import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from "agora-token"
import cors from 'cors'
import https from 'https'
import fs from 'fs'
const appId = '6a0d0b12f6074aad818c99ff9355d444';
const appCertificate = '7c1ea51799fa4f059dd745ce9f83b31c';
const app = express();
const PORT = 3012; // HTTPS typically uses port 443

app.use((req, res, next) => {
  console.log('request recived')
  next()
})

app.use(cors({
  origin: '*'
}))
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
  console.log('sertting',userId,uid,uid_name_pair)
  res.send({ tokens: GenerateTokenForUserID(uid, channelName), appId, uid });
});


app.get('/getUserName', (req, res) => {
  console.log(req.query)
  const uid: string = req.query.uid as string
  console.log(uid_name_pair)
  res.send({ uid, userName: uid_name_pair[`${uid}`] });
});


const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};


const server = https.createServer(options, app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.listen('3013', () => {
  return console.log(`Express is listening at 3030`);
});

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
