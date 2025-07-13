import axios from "axios";
import { generateBotID, generatePromptForAgent } from "./utils";
import { IUserData } from "./interface";
import { getLanguageCode, LanguageName } from "./supportedLanguages";
import { addBotId, doesBotExist, getActiveLanguages, getActiveUsers, addConvoAIAgent, removeConvoAIAgent, activeConvoAIAgents } from "./liveData";
import { RtcRole } from "agora-token";
import { RtcTokenBuilder } from "agora-token";
import { config } from "./config";
interface BotData {
    channelName: string;
    botID: string;
    target_user_id: string;
    srcLanguage: LanguageName;
    targetLanguage: LanguageName;
    voiceId: string;
    isGemini: boolean;
}

const botQueue: Array<BotData> = new Array();

const generateBotToken = ({
    channel_name,
    botId
}) => {
    const expirationTimeInSeconds = 6000;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const role = RtcRole.PUBLISHER;

    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
        config.AGORA_APP_ID,
        config.AGORA_CERT,
        channel_name,
        botId,
        role,
        expirationTimeInSeconds,
        privilegeExpiredTs
    );
    return rtcToken
}

const getAuthHeader = () => {
    const plainCredential = `${config.CUSTOMERID}:${config.CUSTOMER_SECRET}`;
    const encodedCredential = Buffer.from(plainCredential).toString('base64');
    return `Basic ${encodedCredential}`;
}

const getHeaders = () => {
    return {
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        }
    }
}

const startAgoraConvoAIAgent = async ({
    channelName,
    botID,
    srcLanguage,
    targetLanguage,
    target_user_id,
    botVoiceId
}) => {
    const agoraLanguageCode = getLanguageCode(srcLanguage)
    if (!agoraLanguageCode) {
        console.log("NOT AGORA STT LANGUAGE", srcLanguage)
        return
    }
    const agentToken = generateBotToken({
        botId: botID,
        channel_name: channelName
    })

    const properties = {
        channel: channelName,
        token: agentToken,
        agent_rtc_uid: botID,
        remote_rtc_uids: [target_user_id], // use req user id as remote uid
        enable_string_uid: false,
        idle_timeout: 10,
        parameters: {
            interruptable: 'append'
        },
        llm: {
            url: "https://api.openai.com/v1/chat/completions",
            api_key: config.OPENAI_API_KEY,
            system_messages: [
                {
                    role: "system",
                    content: generatePromptForAgent(srcLanguage, targetLanguage)
                }
            ],
            greeting_message: "",
            failure_message: "There is some problem with the translator.",
            max_history: 20,
            params: {
                model: "gpt-4o-mini"
            }
        },
        vad: {
            silence_duration_ms: 200
        },
        turn_detection: {
            interrupt_mode: 'append'
        },
        asr: {
            language: agoraLanguageCode
        },

        tts: {
            vendor: "elevenlabs",
            params: {
                key: config.ELEVENLABS_API_KEY,
                model_id: "eleven_flash_v2_5",
                voice_id: botVoiceId,
            }
        }
    }
    console.log("properties", properties)
    const response = await axios.post(`https://api.agora.io/api/conversational-ai-agent/v2/projects/${config.AGORA_APP_ID}/join`, {
        name: `agent_${botID}`,
        properties,
    },
        getHeaders()
    )
    console.log("started a agent", response.data)
    return response.data
}


export async function stopAgoraConvoAIAgent(botId: string) {
    const agentId = activeConvoAIAgents.get(botId);
    if (!agentId) {
        console.log("No agent found for botId", botId)
        return
    }
    try {
        removeConvoAIAgent(botId)
        const response = await axios.post(`https://api.agora.io/api/conversational-ai-agent/v2/projects/${config.AGORA_APP_ID}/agents/${agentId}/leave`, {},
            getHeaders()
        )
        console.log("stopped a agent", response.data, agentId)
    } catch (error) {
        console.log("Error in stopping agent:botid", botId, agentId)
    }
}

async function createBot(channelName: string, botID: string, target_user_id: string, srcLanguage: LanguageName, targetLanguage: LanguageName, botVoiceId: string) {
    try {
        const response = await startAgoraConvoAIAgent({
            channelName,
            botID,
            srcLanguage,
            targetLanguage,
            target_user_id,
            botVoiceId
        })
        if (response.status === 'RUNNING') {
            addBotId(botID, channelName)
            addConvoAIAgent(botID, response.agent_id)
            console.log(`Bot created for ${botID} for ${target_user_id} from ${srcLanguage} to ${targetLanguage}`)
        } else {
            console.log(`Bot creation failed for ${botID} for ${target_user_id} from ${srcLanguage} to ${targetLanguage}`)
        }
    } catch (error) {
        console.log(`Err in creating bot ${error}`)
    }
}

setInterval(() => {
    const botData = botQueue.shift();
    if (botData) {
        createBot(botData.channelName, botData.botID, botData.target_user_id, botData.srcLanguage, botData.targetLanguage, botData.voiceId);
    }
}, 100)

// generate bots for all the languages
export function generateBots(userData: IUserData) {
    const { uid, language, channel } = userData;
    // create bots for all combinations of languages
    const allActiveUsers = getActiveUsers(channel);
    const activeLanguagesInChannel = getActiveLanguages(channel);
    allActiveUsers.forEach(user => {
        activeLanguagesInChannel.forEach(targetLanguage => {
            if (user.language === targetLanguage) {
                return
            }
            const languageBotID = generateBotID(user.uid, user.language, targetLanguage);
            if (!doesBotExist(languageBotID, channel)) {
                botQueue.push({ channelName: channel, botID: languageBotID, target_user_id: user.uid, srcLanguage: user.language, targetLanguage, voiceId: user.voiceId, isGemini: user.isGemini });
                // createBot(channel, languageBotID, user.uid, user.language, targetLanguage);
            }
        })
    })
}