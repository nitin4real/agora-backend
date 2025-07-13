import cors from 'cors';
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { userNameToUid } from "./utils";
import { GenerateTokenForUserID } from "./agoraTokenGenerator";
import { LanguageName } from './supportedLanguages';
import { addUser, clearAllData, getUserName, logAllUsersAndBots, removeBotAndUser, removeUserAndBots } from './liveData';
import { IUserData } from './interface';
import { generateBots } from './translatorUtils';
import { isRecordingRunning, startWebRecordService, stopAllRecordings, stopWebRecordService } from './webRecordService';
import { config } from './config';

const app = express();

app.use(cors({
  origin: '*'
}))

app.use((req, res, next) => {
  next()
})
app.use(express.json());

app.get('/getToken', (req, res) => {
  const userName = req.query.userId;
  const language = req.query.language;
  const channelName = req.query.channelName;
  const isRecorder = req.query.isRecorder == 'true';
  const voiceId = req.query.voiceId
  const isGemini = req.query.llmId == 'gemini';

  if (typeof channelName !== 'string') {
    console.log('Invalid channel name parameter')
    return res.status(400).send({ error: 'Invalid channelName parameter' });
  }

  if (isRecorder) {
    console.log(`${new Date().toLocaleString()}: Register New Recorder with ${channelName} ${req.query.isRecorder}`);
    GenerateTokenForUserID('11', channelName).then((tokens) => {
      res.send({ tokens, appId: config.AGORA_APP_ID, uid: "11", appkey: config.AGORA_CERT });
    }).catch((err) => {
      res.status(500).send({ error: err });
    })
    return;
  }

  if (typeof userName !== 'string') {
    console.log('Invalid userName parameter')
    return res.status(400).send({ error: 'Invalid userName parameter' });
  }

  if (typeof language !== 'string') {
    console.log('Invalid language parameter')
    return res.status(400).send({ error: 'Invalid language parameter' });
  }

  if (!Object.values(LanguageName).includes(language as LanguageName)) {
    console.log('Invalid language parameter')
    return res.status(400).send({ error: 'Invalid language parameter' });
  }

  if (typeof voiceId !== 'string') {
    console.log('Invalid voiceId parameter')
    return res.status(400).send({ error: 'Invalid voiceId parameter' });
  }

  const uid: string = String(userNameToUid(userName));
  const userData: IUserData = { uid, name: userName, language: language as LanguageName, channel: channelName, voiceId, isGemini };
  addUser(userData);
  // create bots for all combinations of languages
  generateBots(userData)
  console.log(`${new Date().toLocaleString()}: Register New User with ${uid} with ${userName} on channel ${channelName} with voiceId ${voiceId}`);
  // call the agent to join the channel
  GenerateTokenForUserID(uid, channelName).then((tokens) => {
    res.send({ tokens, appId: config.AGORA_APP_ID, uid, appkey: config.AGORA_CERT });
  }).catch((err) => {
    res.status(500).send({ error: err });
  })
});

app.get('/getUserName', (req, res) => {
  const uid: string = req.query.uid as string
  const channelName: string = req.query.channelName as string
  res.send(
    {
      uid,
      userName: getUserName(uid, channelName)
    });
});

app.get('/startRecording', (req, res) => {
  const channelName: string = req.query.channelName as string
  startWebRecordService(channelName).then((status) => {
    res.send({ status });
  }).catch((err) => {
    res.status(500).send({ error: err });
  });
});

app.get('/stopRecording', (req, res) => {
  const channelName: string = req.query.channelName as string
  stopWebRecordService(channelName).then((status) => {
    res.send({ status });
  }).catch((err) => {
    res.status(500).send({ error: err });
  });
});

app.get('/isRecordingRunning', (req, res) => {
  try {
    const channelName: string = req.query.channelName as string
    res.send({ isRecordingRunning: isRecordingRunning(channelName) });
  } catch (err) {
    res.status(500).send({ error: 'Could Not Find Channel' });
  }
})

app.get('/stopAllRecordings', (req, res) => {
  try {
    stopAllRecordings();
    res.send({ success: true });
  } catch (err) {
    res.status(500).send({ err });
  }
})


// route to clear all the active users and live languages
app.get('/clearAll', (req, res) => {
  clearAllData();
  res.send({ message: 'All users are cleared' });
});


app.post('/user_left', (req, res) => {
  const uid = req?.body?.user_id;
  const channel_name = req?.body?.channel_name;

  if (typeof uid !== 'string' || typeof channel_name !== 'string') {
    return res.status(400).send({ error: 'Invalid parameters' });
  }

  console.log("user_left", uid, channel_name)
  removeBotAndUser(uid, channel_name);
  removeUserAndBots(uid, channel_name);
  logAllUsersAndBots(channel_name);

  res.send({ message: 'User Left the channel' });
})



const HTTP_SERVER = http.createServer(app);

// const HTTPS_SERVER = https.createServer(options, app);

HTTP_SERVER.listen(config.HTTP_PORT, () => {
  return console.log(`HTTP SERVER is listening at 3013`);
})

if (config.isProd) {
  const options = {
    key: fs.readFileSync(config.PRIV_KEY_PATH),
    cert: fs.readFileSync(config.CERT_KEY_PATH)
  };
  const HTTPS_SERVER = https.createServer(options, app);
  HTTPS_SERVER.listen(config.HTTPS_PORT, () => {
    console.log(`HTTPS SERVER is running on port ${config.HTTPS_PORT}`);
  });
}