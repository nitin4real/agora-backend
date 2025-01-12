import { RtcRole, RtcTokenBuilder, RtmTokenBuilder, ChatTokenBuilder } from "agora-token";
import { appId, appCertificate } from "./app";
import axios from "axios";
import { addChatRoomId, getChatRoomId, isChatRoomIdActive } from "./liveData";

let chatAppToken = ''

const generateChatAppToken = () => {
  const expirationTimeInSeconds = 82800;
  chatAppToken = ChatTokenBuilder.buildAppToken(
    appId,
    appCertificate,
    expirationTimeInSeconds
  )
}

setInterval(() => {
  generateChatAppToken()
}, 72800000)

export const GenerateTokenForUserID = async (uid: string, channelName: string = '') => {
  const expirationTimeInSeconds = 6000;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const role = RtcRole.PUBLISHER;
  if (chatAppToken === '') {
    generateChatAppToken()
  }
  await registerUser(uid)
  const chatRoomId = await createChatRoom(channelName, uid)

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

  const chatToken = ChatTokenBuilder.buildUserToken(
    appId,
    appCertificate,
    uid,
    privilegeExpiredTs
  )

  return { rtcToken, rtmToken, chatToken, chatRoomId };

};

const registerUser = async (uid: string) => {
  if (uid.length !== 4) return 'Invalid uid'
  try {
    const registerUserResponse = await axios.post(`https://a61.chat.agora.io/611155502/1341943/users`,
      {
        username: uid
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chatAppToken}`
        },
      }
    )
    console.log('User registered successfully', uid)
  } catch (error) {
    console.log('Error in user registeration')
  }
}

const removeUser = () => {
  try {

  } catch (error) {
    console.log('Error in user deregisteration')
  }
}

const createChatRoom = async (channelName, uid) => {
  if (uid.length !== 4) return 'Invalid uid'
  if (isChatRoomIdActive(channelName)) {
    return getChatRoomId(channelName)
  }
  try {
    const chatRoomCreateResponse = await axios.post(`https://a61.chat.agora.io/611155502/1341943/chatrooms`,
      {
        name: channelName,
        desc: 'Chat room for the channel',
        owner: uid
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${chatAppToken}`
        },
      }
    )
    const chatRoomId = chatRoomCreateResponse?.data?.data?.id
    console.log('Chat room created successfully', chatRoomId)
    addChatRoomId(channelName, chatRoomId)
    return chatRoomId
  } catch (error) {
    console.log('Error in creating chat room')
  }
}