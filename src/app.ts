import { RtcRole, RtcTokenBuilder, RtmTokenBuilder } from "agora-token";
import cors from 'cors';
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Socket, Server as SocketServer } from 'socket.io';
import { OpenAIConnection } from "./OpenAIConnection";

const appId = process.env.AGORA_APP_ID
const appCertificate = process.env.AGORA_CERT


const app = express();
const PORT = 3012; // HTTPS typically uses port 443
app.use(cors({
  origin: '*'
}))
app.use((req, res, next) => {
  next()
})

interface StringMap {
  [key: string]: string;
}
const uid_name_pair: StringMap = {}

app.get('/getToken', (req, res) => {
  const userId: string = req.query.userId as string
  const uid: string = String(userNameToUid(userId));
  const channelName: string = req.query.channelName as string
  uid_name_pair[`${uid}`] = userId
  console.log(`${new Date().toLocaleString()}: Register New User with ${uid} with ${userId} on channel ${channelName}`)
  res.send({ tokens: GenerateTokenForUserID(uid, channelName), appId, uid });
});

app.get('/getUserName', (req, res) => {
  const uid: string = req.query.uid as string
  res.send({ uid, userName: uid_name_pair[`${uid}`] });
});
const options = {
  // key: fs.readFileSync('/etc/letsencrypt/live/nitinsingh.in/privkey.pem'),
  // cert: fs.readFileSync('/etc/letsencrypt/live/nitinsingh.in/cert.pem')
};


export const GenerateTokenForUserID = (uid: string, channelName: string = '') => {
  const expirationTimeInSeconds = 6000
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
  const role = RtcRole.PUBLISHER;

  const rtcToken = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    expirationTimeInSeconds,
    privilegeExpiredTs
  );

  const rtmToken =
    RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      uid,
      expirationTimeInSeconds
    )
  return { rtcToken, rtmToken }
}

function userNameToUid(username: string): number {
  const uniqueNumber = Math.floor(Math.random() * 10000)
  //here every user should be mapped to a number and be saved in the db for later tally//
  return uniqueNumber
}



type TranslationData = {
  UID: string
  currentText: string
  language: string
}
export type Language_Name = 'Chinese' | 'English' | 'Hindi'
type Language_Spoken = 'en-us' | 'en-in' | 'en' | 'hi' | 'cmn-Hans-CN'
type Language_Read = 'en' | 'en' | 'en' | 'hi' | 'zh-CN'

interface LanguageNameMap {
  [key: string]: Language_Name;
}

export const languageNameMap: LanguageNameMap = {
  ['cmn-Hans-CN']: 'Chinese',
  ['en-us']: 'English',
  ['en-in']: 'English',
  ['hi']: 'Hindi',
  ['en']: 'English',
}

const languageMap = new Map<Language_Spoken, Language_Read>()
languageMap.set('en-us', 'en')
languageMap.set('en-in', 'en')
languageMap.set('en', 'en')
languageMap.set('hi', 'hi')
languageMap.set('cmn-Hans-CN', 'zh-CN')

type ConnectionNode = {
  socket: Socket
  languageSpoken: Language_Spoken
  UID: string
  AIConnections: Map<Language_Name, OpenAIConnection>
}
type ConnectionNodeMap = Map<string, ConnectionNode> // {UID, ConnectionNode}


const languageListeners = new Map<Language_Name, ConnectionNodeMap>()
const languagePool = new Set<Language_Name>()
const activeUsers = new Map<string, ConnectionNode>() // {UID, ConnectionNode}

const handleSocketConnection = (speakerUID: string, language: Language_Spoken, socket: Socket) => {
  const languageUserUnderstands = languageNameMap[language];
  const addNewLanguageForExistingUsers = !languagePool.has(languageUserUnderstands)

  const newUserConnectionNode: ConnectionNode = {
    socket: socket,
    languageSpoken: language,
    UID: speakerUID,
    AIConnections: new Map()
  }

  activeUsers.set(speakerUID, newUserConnectionNode)
  languagePool.add(languageUserUnderstands);
  if (!languageListeners.has(languageUserUnderstands)) {
    languageListeners.set(languageUserUnderstands, new Map<string, ConnectionNode>())
  }

  languageListeners.get(languageUserUnderstands).set(speakerUID, newUserConnectionNode)
  for (const language of languagePool.values()) {
    // create a ai for all the languages for this user
    console.log("Creating a new AI Model for ", speakerUID, " for language ", language)
    const translator = new OpenAIConnection(languageUserUnderstands, language, (audio, eventId) => {
      // send this audio to all the users who understand lanugage
      // except for the user itself
      const userListListeningToLanuguage = languageListeners.get(language)
      for (const listenerUserConnectionNode of userListListeningToLanuguage.values()) {
        if (speakerUID !== listenerUserConnectionNode.UID) {
          listenerUserConnectionNode.socket.emit('translatedAudio', audio, eventId)
        }
      }
    })
    newUserConnectionNode.AIConnections.set(language, translator)
  }

  if (addNewLanguageForExistingUsers) {
    // add a new ai for all the prev users for this new language
    for (const activeUserConnection of activeUsers.values()) {
      const activeUserLanguage = activeUserConnection.languageSpoken
      const languageNameOfActiveUser: Language_Name = languageNameMap[activeUserLanguage];
      const targetLanguage = languageUserUnderstands
      if (activeUserConnection.AIConnections.has(targetLanguage)) continue; // this case should ideally be never true // but just in case
      console.log("Creating a new AI Model for ", speakerUID, " for language ", language)
      const newTranslator = new OpenAIConnection(languageNameOfActiveUser, targetLanguage, (audio, eventId) => {
        const userListListeningToLanuguage = languageListeners.get(targetLanguage)
        for (const listenerUserConnectionNode of userListListeningToLanuguage.values()) {
          if (activeUserConnection.UID !== listenerUserConnectionNode.UID) {
            listenerUserConnectionNode.socket.emit('translatedAudio', audio, eventId)
          }
        }
      })
      activeUserConnection.AIConnections.set(targetLanguage, newTranslator)
    }
  }

  socket.on('audioData', (data) => {
    const listeningAIs = newUserConnectionNode.AIConnections.values()
    for (const ai of listeningAIs) {
      ai.addAudio(bufferToInt16(data))
    }
  })

  socket.on('createResponse', () => {
    // generate the resposne of audio uptill now
    const listeningAIs = newUserConnectionNode.AIConnections.values()
    for (const ai of listeningAIs) {
      ai.createResponse()
    }
  })





  socket.on('disconnect', () => {
    // kill all the ai it have
    const listeningAIs = newUserConnectionNode.AIConnections.values()
    for (const ai of listeningAIs) {
      ai.onDisconnect()
    }
    // remove this user from user list
    activeUsers.delete(speakerUID)


    // remove from listeners list
    const allListenersOfThisLanguage = languageListeners.get(languageUserUnderstands)
    allListenersOfThisLanguage?.delete(speakerUID)

    if (allListenersOfThisLanguage.size === 0) {
      //remove the language so it does not gets translated to this langauge again
      languageListeners.delete(languageUserUnderstands)
    }
  })
}

// const HTTP_SERVER = http.createServer(app);
// const socketServer = new SocketServer(HTTP_SERVER, {
//   cors: {
//     origin: '*'
//   }
// })

const HTTPS_SERVER = https.createServer(options, app);
const socketServer = new SocketServer(HTTPS_SERVER, {
  cors: {
    origin: '*'
  }
})

socketServer.on('connection', (socket) => {
  const {
    languageCode,
    userUid,
    channelName
  } = socket.handshake.query as {
    languageCode: Language_Spoken,
    userUid: string,
    channelName: string
  }
  if (channelName === 'channel') {
    handleSocketConnection(userUid, languageCode, socket)
  }
});


const startTranslatorServices = async (audioData, language: Language_Spoken) => { }



// HTTP_SERVER.listen(3013, () => {
//   return console.log(`HTTP SERVER is listening at 3013`);
// })



HTTPS_SERVER.listen(PORT, () => {
  console.log(`HTTPS SERVER is running on port ${PORT}`);
});








// function arrayBufferToBase64(buffer) {
//   let binaryString = '';
//   const bytes = new Uint8Array(buffer);
//   const len = bytes.byteLength;
//   for (let i = 0; i < len; i++) {
//     binaryString += String.fromCharCode(bytes[i]);
//   }
//   return binaryString
// }
function bufferToInt16(buffer) {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const int16Array = new Int16Array(arrayBuffer);
  return int16Array
}