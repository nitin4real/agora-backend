import axios from "axios";
import { generateBotID, generatePromptForAgent } from "./utils";
import { IUserData } from "./interface";
import { languageCodeList, LanguageName } from "./supportedLanguages";
import { addBotId, doesBotExist, getActiveLanguages, getActiveUsers } from "./liveData";

interface BotData {
    channelName: string;
    botID: string;
    target_user_id: string;
    srcLanguage: LanguageName;
    targetLanguage: LanguageName;
}

const botQueue: Array<BotData> = new Array();

async function createBot(channelName: string, botID: string, target_user_id: string, srcLanguage: LanguageName, targetLanguage: LanguageName) {
    try {
        addBotId(botID, channelName)
        await axios.post('http://localhost:8080/start_agent', {
            channel_name: channelName,
            uid: botID,
            system_instruction: generatePromptForAgent(srcLanguage, targetLanguage),
            target_user_id: target_user_id,
            language_code: languageCodeList.find(lang => lang.name === srcLanguage)?.isoCode || "en",
        })
        console.log(`Bot created for ${botID} for ${target_user_id} from ${srcLanguage} to ${targetLanguage}`)
    } catch (error) {
        console.log(`Err in creating bot ${error}`)
    }
}

setInterval(() => {
    const botData = botQueue.shift();
    if (botData) {
        createBot(botData.channelName, botData.botID, botData.target_user_id, botData.srcLanguage, botData.targetLanguage);
    }
}, 1500)

// generate bots for all the languages
export function generateBots(userData: IUserData) {
    const { uid, language, channel } = userData;
    // create bots for all combinations of languages
    const allActiveUsers = getActiveUsers(channel);
    const activeLanguagesInChannel = getActiveLanguages(channel);
    allActiveUsers.forEach(user => {
        activeLanguagesInChannel.forEach(targetLanguage => {
            const languageBotID = generateBotID(user.uid, user.language, targetLanguage);
            if (!doesBotExist(languageBotID, channel)) {
                botQueue.push({ channelName: channel, botID: languageBotID, target_user_id: user.uid, srcLanguage: user.language, targetLanguage });
                // createBot(channel, languageBotID, user.uid, user.language, targetLanguage);
            }
        })
    })
}