import axios from "axios";
import { generateBotID, generatePromptForAgent } from "./utils";
import { IUserData } from "./interface";
import { isAgoraSTTLanguage, languageCodeList, LanguageName, VoiceId } from "./supportedLanguages";
import { addBotId, doesBotExist, getActiveLanguages, getActiveUsers } from "./liveData";

interface BotData {
    channelName: string;
    botID: string;
    target_user_id: string;
    srcLanguage: LanguageName;
    targetLanguage: LanguageName;
    voiceId: VoiceId;
    isGemini: boolean;
}

const botQueue: Array<BotData> = new Array();

async function createBot(channelName: string, botID: string, target_user_id: string, srcLanguage: LanguageName, targetLanguage: LanguageName, botVoiceId: VoiceId, isGemini: boolean = false) {
    try {
        addBotId(botID, channelName)
        if (!isGemini) {
            await axios.post('http://localhost:8080/start_agent', {
                channel_name: channelName,
                uid: botID,
                system_instruction: generatePromptForAgent(srcLanguage, targetLanguage),
                target_user_id: target_user_id,
                language_code: languageCodeList.find(lang => lang.name === srcLanguage)?.isoCode || "en",
                voice: botVoiceId
            })
        } else {
            await axios.post('http://localhost:8082/start', {
                request_id: Math.random().toString(36).substring(7),
                channel_name: channelName,
                user_uid: Number(target_user_id),
                graph_name: "voice_assistant",
                voice_type: 'male',
                bot_uid: Number(botID),
                timeout: 1200,
                properties: {
                    llm: {
                        prompt: generatePromptForAgent(srcLanguage, targetLanguage),
                    },
                    stt: {
                        lang_code: languageCodeList.find(lang => lang.name === srcLanguage)?.transcriptLanguageCode || "en-US",
                    },
                    tts: {
                        voice_id: botVoiceId === 'sage' ? 'Xb7hH8MSUJpSbSDYk0k2' : "nPczCjzI2devNBz1zQrb"
                    }
                }
            })
        }
        console.log(`Bot created for ${botID} for ${target_user_id} from ${srcLanguage} to ${targetLanguage}`)
    } catch (error) {
        console.log(`Err in creating bot ${error}`)
    }
}

setInterval(() => {
    const botData = botQueue.shift();
    if (botData) {
        createBot(botData.channelName, botData.botID, botData.target_user_id, botData.srcLanguage, botData.targetLanguage, botData.voiceId, botData.isGemini);
    }
}, 1000)

// generate bots for all the languages
export function generateBots(userData: IUserData) {
    const { uid, language, channel } = userData;
    // create bots for all combinations of languages
    const allActiveUsers = getActiveUsers(channel);
    const activeLanguagesInChannel = getActiveLanguages(channel);
    allActiveUsers.forEach(user => {
        activeLanguagesInChannel.forEach(targetLanguage => {
            if (user.language === targetLanguage && isAgoraSTTLanguage(user.language)) {
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