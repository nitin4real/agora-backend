import express from 'express';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from "agora-token"
import cors from 'cors'

const appId = '';
const appCertificate = '';

const port = 3020;
const app = express();

app.use(cors())

app.get('/getToken', (req, res) => {
  console.log(req.query)
  const userId: string = req.query.userId as string
  res.send({ tokens: GenerateTokenForUserID(userId), appId });
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
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