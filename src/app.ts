import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from "agora-token"
import cors from 'cors'
import https from 'https'
import http from 'http'
import fs from 'fs'
import speech from '@google-cloud/speech'
import { TranslationServiceClient, v2 } from '@google-cloud/translate'

import { Socket, Server as SocketServer } from 'socket.io'
import { google } from '@google-cloud/speech/build/protos/protos';
import { } from "@google-cloud/speech"
const appId = '6a0d0b12f6074aad818c99ff9355d444';
const appCertificate = '7c1ea51799fa4f059dd745ce9f83b31c';
const app = express();
const PORT = 3012; // HTTPS typically uses port 443
// const HTTP_SERVER = http.createServer(app);
app.use(cors({
  origin: '*'
}))
app.use((req, res, next) => {
  console.log('request recived')
  next()
})

interface StringMap {
  [key: string]: string;
}
const uid_name_pair: StringMap = {}

app.get('/getToken', (req, res) => {
  console.log(req.query)
  const userId: string = req.query.userId as string
  const uid: string = String(userNameToUid(userId));
  const channelName: string = req.query.channelName as string
  uid_name_pair[`${uid}`] = userId
  console.log(`Register New User with ${uid} with ${userId}`)
  res.send({ tokens: GenerateTokenForUserID(uid, channelName), appId, uid });
});

app.get('/getUserName', (req, res) => {
  console.log(req.query)
  const uid: string = req.query.uid as string
  res.send({ uid, userName: uid_name_pair[`${uid}`] });
});

const options = {
  key: fs.readFileSync('./privkey.pem'),
  cert: fs.readFileSync('./cert.pem')
};

 

// app.listen('3013', () => {
//   return console.log(`Express is listening at 3030`);
// });

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

const pTranslator = new TranslationServiceClient()

const { Translate } = v2
const translatorService = new Translate()
// pTranslator.ro({
//   contents: ['to isko To Nahin Honge Milana chahie'],
//   targetLanguageCode: 'hi',
//   mimeType: 'plain/text',
//   parent: ''
// } )
// transliterationConfig: {
//   enableTransliteration: true    
// }

const translator = async (text: string, targetLang: string) => {
}

type TranslationData = {
  UID: string
  currentText: string
  language: string
}
type Language_Spoken = 'en-us' | 'en-in' | 'en' | 'hi' | 'cmn-Hans-CN'
type Language_Read = 'en' | 'en' | 'en' | 'hi' | 'zh-CN'
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
}
type ConnectionNodeMap = Map<string, ConnectionNode> // {UID, ConnectionNode}


const languageListeners = new Map<Language_Read, ConnectionNodeMap>()

const translateAndSendToAll = async (textToTranslate: string, targetLang: Language_Read, speakerUID: string) => {
  // can optimize for eng -> eng translations
  let [translations] = await translatorService.translate(textToTranslate, targetLang);

  const allListeners = languageListeners.get(targetLang)
  console.log(`sending data to all the users who understand - ${targetLang} of the speaker - ${speakerUID}`)
  allListeners.forEach((listener) => {
    const connectionSocket = listener.socket
    console.log(`sending to - ${listener.UID}`)
    connectionSocket.emit('translationData', translations, speakerUID)
  })
}


const onTranscribe = (transcribedText: string, speakerUID: string) => {
  for (let languageRead of languageListeners.keys()) {
    //for each of these languages translate the transcribed text and send to the respective listeners
    translateAndSendToAll(transcribedText, languageRead, speakerUID)
  }
}


const handleSocketConnection = (speakerUID: string, language: Language_Spoken, socket: Socket) => {
  const languageRead = languageMap.get(language)

  if (!languageListeners.has(languageRead)) {
    languageListeners.set(languageRead, new Map<string, ConnectionNode>())
  }

  const connectionNode: ConnectionNode = {
    socket: socket,
    languageSpoken: language,
    UID: speakerUID
  }

  languageListeners.get(languageRead).set(speakerUID, connectionNode)

  socket.on('disconnect', () => {
    const allListeners = languageListeners.get(languageRead)
    allListeners.delete(speakerUID)
    if (allListeners.size === 0) {
      //remove the language so it does not gets translated to this langauge again
      languageListeners.delete(languageRead)
    }
    //remove it from the map
    //remove the map entry if after this there are no more sockets listening to this language
  })

  socket.on('audioStream', async (data) => {
    const transcription: string = await startTranslatorServices(data, language)
    onTranscribe(transcription, speakerUID)
  })
}


const HTTPS_SERVER = https.createServer(options, app);
const socketServer = new SocketServer(HTTPS_SERVER, {
  cors: {
    origin: '*'
  }
})

socketServer.on('connection', (socket) => {
  const {
    languageCode,
    userUid
  } = socket.handshake.query as {
    languageCode: Language_Spoken,
    userUid: string
  }
  handleSocketConnection(userUid, languageCode, socket)
});

const speechClient = new speech.SpeechClient();

// const request: google.cloud.speech.v1.IStreamingRecognitionConfig = {
//   config: {
//     encoding: 'LINEAR16',
//     sampleRateHertz: 16000,
//     languageCode: 'hi',
//   }
// };

const startTranslatorServices = async (audioData, language: Language_Spoken) => {
  const config: google.cloud.speech.v1p1beta1.IRecognitionConfig = {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 48000,
    languageCode: language,
  };

  const audio = {
    content: audioData
  };
  const request: google.cloud.speech.v1p1beta1.IRecognizeRequest = {
    audio: audio,
    config: config,
  };

  const [response] = await speechClient.recognize(request,)
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  return transcription
}



// HTTP_SERVER.listen(3013, () => {
//   return console.log(`HTTP SERVER is listening at 3013`);
// })



HTTPS_SERVER.listen(PORT, () => {
  console.log(`HTTPS SERVER is running on port ${PORT}`);
});





























// const recognizeStream = speechClient
//   .streamingRecognize(request)
//   .on('data',(response)=>{
//     console.log('charges',response.totalBilledTime)
//     console.log(
//       `Transcription: ${response.results[0].alternatives[0].transcript}`
//     )
//   })
//   .on('error', console.error)
//   .on('finish',()=>{
//     console.log('finished')
//   })
//   .on('end',()=>{
//     console.log('ended')
//   })

// fs.createReadStream('./audioSamples0').pipe(recognizeStream);
// fs.createReadStream('./test.wav').pipe(recognizeStream);
// const contentInFile = fs.readFileSync('./test.wav', { encoding: 'base64' })
// console.log(contentInFile)
// fs.writeFileSync('./test.wav', content, { encoding: 'base64' })

// startTranslatorServices()
// startTranslatorServices({})
// below thing works
// console.log(Buffer.from("nitin").toString('base64'))

// const upload = multer({ dest: './' });

// app.post('/api/speech-to-text', upload.single('file'), async (req: any, res: any) => {
//   try {
//     const file = req.file;
//     const filePath = './' + file.path
//     const audioBytes = fs.readFileSync(filePath).toString('base64');
//     const contentInFile = fs.readFileSync('./dubey.wav', { encoding: 'base64' })

//     const request: google.cloud.speech.v1.IRecognizeRequest = {
//       audio: {
//         content: audioBytes,
//       },
//       config: {
//         encoding: 'WEBM_OPUS',
//         sampleRateHertz: 48000,
//         languageCode: 'en-IN',
//       },
//     };

//     const [response] = await speechClient.recognize(request);
//     const transcript = response.results
//       .map(result => result.alternatives[0].transcript)
//       .join('\n');

//     res.json({ transcript });
//   } catch (error) {
//     console.error('Error processing audio:', error);
//     res.status(500).send('Error processing audio');
//   }
// });
