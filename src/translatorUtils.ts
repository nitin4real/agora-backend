import axios from "axios";
import { generateBotID, generatePromptForAgent } from "./utils";
import { IUserData } from "./interface";
import { LanguageName } from "./supportedLanguages";
import { addBotId, doesBotExist, getActiveUsers } from "./liveData";

async function createBot(channelName: string, botID: string, target_user_id: string, srcLanguage: LanguageName, targetLanguage: LanguageName) {
    try {
        addBotId(botID)
        await axios.post('http://localhost:8080/start_agent', {
            channel_name: channelName,
            uid: botID,
            system_instruction: generatePromptForAgent(srcLanguage, targetLanguage),
            target_user_id: target_user_id
        })
        console.log(`Bot created for ${botID} for ${target_user_id} from ${srcLanguage} to ${targetLanguage}`)
    } catch (error) {
        console.log(`Err in creating bot ${error}`)
    }
}

// generate bots for all the languages
export function generateBots(userData: IUserData) {
    const { uid, language, channel } = userData;
    // create bots for all combinations of languages
    const allActiveUsers = getActiveUsers();
    allActiveUsers.forEach(user => {
        if (user.uid !== uid && user.language !== language) {
            const newUsersBotID = generateBotID(uid, language, user.language);
            const existingUsersBotID = generateBotID(user.uid, user.language, language);
            if (!doesBotExist(newUsersBotID)) {
                createBot(channel, newUsersBotID, uid, language, user.language);
            }
            if (!doesBotExist(existingUsersBotID)) {
                createBot(channel, existingUsersBotID, user.uid, user.language, language);
            }
        }
    })
}