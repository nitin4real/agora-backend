import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from "agora-token"
import cors from 'cors'
import https from 'https'
import fs from 'fs'
const appId = '6a0d0b12f6074aad818c99ff9355d444';
const appCertificate = '7c1ea51799fa4f059dd745ce9f83b31c';
const app = express();
const PORT = 3012; // HTTPS typically uses port 443

app.use(cors({
  origin: '*'
}))

app.get('/getToken', (req, res) => {
  console.log(req.query)
  const userId: string = req.query.userId as string
  const channelName: string = req.query.channelName as string
  res.send({ tokens: GenerateTokenForUserID(userId, channelName), appId });
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

export const GenerateTokenForUserID = (userId: string, channelName: string = '') => {
  const uid: string = userId;
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
      userId,
      expirationTimeInSeconds
    )
  return { rtcToken, rtmToken }
}
