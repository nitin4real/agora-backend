import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from "agora-token"
import cors from 'cors'
import https from 'https'
import http from 'http'
import fs from 'fs'
import speech from '@google-cloud/speech'
import { v2 } from '@google-cloud/translate'

import { Server as SocketServer } from 'socket.io'
import { google } from '@google-cloud/speech/build/protos/protos';
import { } from "@google-cloud/speech"
import multer from 'multer'
const appId = '6a0d0b12f6074aad818c99ff9355d444';
const appCertificate = '7c1ea51799fa4f059dd745ce9f83b31c';
const app = express();
const PORT = 3012; // HTTPS typically uses port 443
const HTTP_SERVER = http.createServer(app);
const io = new SocketServer(HTTP_SERVER, {
  cors: {
    origin: '*'
  }
})
app.use(cors({
  origin: '*'
}))
// app.use((req, res, next) => {
//   console.log('request recived')
//   next()
// })

interface StringMap {
  [key: string]: string;
}
const uid_name_pair: StringMap = {}

// app.get('/getToken', (req, res) => {
//   console.log(req.query)
//   const userId: string = req.query.userId as string
//   const uid: string = String(userNameToUid(userId));
//   const channelName: string = req.query.channelName as string
//   uid_name_pair[`${uid}`] = userId
//   console.log('sertting', userId, uid, uid_name_pair)
//   res.send({ tokens: GenerateTokenForUserID(uid, channelName), appId, uid });
// });

// app.get('/getUserName', (req, res) => {
//   console.log(req.query)
//   const uid: string = req.query.uid as string
//   console.log(uid_name_pair)
//   res.send({ uid, userName: uid_name_pair[`${uid}`] });
// });


const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};


// const HTTPS_SERVER = https.createServer(options, app);
// HTTPS_SERVER.listen(PORT, () => {
//   console.log(`HTTPS SERVER is running on port ${PORT}`);
// });

// app.listen('3013', () => {
//   return console.log(`Express is listening at 3030`);
// });
// export const GenerateTokenForUserID = (uid: string, channelName: string = '') => {
//   const expirationTimeInSeconds = 6000
//   const currentTimestamp = Math.floor(Date.now() / 1000)
//   const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
//   const role = RtcRole.PUBLISHER;

//   const rtcToken = RtcTokenBuilder.buildTokenWithUid(
//     appId,
//     appCertificate,
//     channelName,
//     uid,
//     role,
//     expirationTimeInSeconds,
//     privilegeExpiredTs
//   );

//   const rtmToken =
//     RtmTokenBuilder.buildToken(
//       appId,
//       appCertificate,
//       uid,
//       expirationTimeInSeconds
//     )
//   return { rtcToken, rtmToken }
// }

// function userNameToUid(username: string): number {
//   const uniqueNumber = Math.floor(Math.random() * 10000)
//   //here every user should be mapped to a number and be saved in the db for later tally//
//   return uniqueNumber
// }

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('audioStream', async (audioUrl) => {
    const translatedResponse = await startTranslatorServices(audioUrl)
    console.log('translatedResponse', translatedResponse)
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const speechClient = new speech.SpeechClient();

const request: google.cloud.speech.v1.IStreamingRecognitionConfig = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'hi',
  }
};

const startTranslatorServices = async (audioData) => {
  const config: google.cloud.speech.v1p1beta1.IRecognitionConfig = {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 48000,
    languageCode: 'hi',
  };

  const audio = {
    content: audioData
  };
  const request: google.cloud.speech.v1p1beta1.IRecognizeRequest = {
    audio: audio,
    config: config,
  };

  const [response] = await speechClient.recognize(request,)
  console.log(response.totalBilledTime)
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  const translatedValue = await translator(transcription, 'en')
  return translatedValue
}



HTTP_SERVER.listen(3013, () => {
  return console.log(`HTTP SERVER is listening at 3013`);
})


const { Translate } = v2
const translate = new Translate()

const translator = async (text: string, targetLang: string) => {
  let [translations] = await translate.translate(text, targetLang);
  return translations
}





























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