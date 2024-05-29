import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from "agora-token"
import cors from 'cors'
import https from 'https'
import fs from 'fs'
const appId = '';
const appCertificate = '';
const app = express();
const PORT = process.env.PORT || 443; // HTTPS typically uses port 443

app.use(cors())

app.get('/getToken', (req, res) => {
  console.log(req.query)
  const userId: string = req.query.userId as string
  res.send({ tokens: GenerateTokenForUserID(userId), appId });
});

const options = {
  key: fs.readFileSync('./private.key'),
  cert: fs.readFileSync('./server.cert')
};


const server = https.createServer(options, app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.listen('3030', () => {
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