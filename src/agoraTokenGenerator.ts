import { RtcRole, RtcTokenBuilder, RtmTokenBuilder } from "agora-token";
import { appId, appCertificate } from "./app";

export const GenerateTokenForUserID = (uid: string, channelName: string = '') => {
  const expirationTimeInSeconds = 6000;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
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

  const rtmToken = RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    uid,
    expirationTimeInSeconds
  );
  return { rtcToken, rtmToken };
};
