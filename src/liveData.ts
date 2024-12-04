import { IUserData } from './interface';
import { LanguageName } from './supportedLanguages';
import { stopWebRecordService } from './webRecordService';

export const activeUsers: Map<string, IUserData[]> = new Map<string, IUserData[]>();
export const activeBotsIds: Map<string, string[]> = new Map<string, string[]>(); // channelName -> Set of botIds in the channel
export const liveLanguages: Map<string, Set<LanguageName>> = new Map<string, Set<LanguageName>>(); // channelName -> Set of languages in the channel

// get all active users
export function getActiveUsers(channelName: string) {
    if(activeUsers.has(channelName)) {
        return activeUsers.get(channelName);
    }
    return [];
}

export function getActiveLanguages(channelName: string) {
    if(liveLanguages.has(channelName)) {
        return liveLanguages.get(channelName);
    }
    return new Set<LanguageName>();
}

// function to add a new user to the activeUsers array
export function addUser(user: IUserData) {
    const channelName = user.channel;
    if (!activeUsers.has(channelName)) {
        activeUsers.set(channelName, []);
    }
    activeUsers.get(channelName)?.push(user);
    
    if (!liveLanguages.has(channelName)) {
        liveLanguages.set(channelName, new Set<LanguageName>());
    }
    liveLanguages.get(channelName)?.add(user.language);
}

// function to remove a user from the activeUsers array, also remove the language from liveLanguages if no user is using it
export function removeUser(uid: string, channelName: string) {
    // try to find and remove all the bots for this user also
    const users = activeUsers.get(channelName);
    if (users) {
        const index = users.findIndex((user: IUserData) => user.uid === uid);
        if (index !== -1) {
            const language = users[index].language;
            users.splice(index, 1);
            if (!users.some((user: IUserData) => user.language === language)) {
                liveLanguages.get(channelName)?.delete(language);
            }
        }
    }
}

// function to get userName from userId
export function getUserName(uid: string, channelName: string) {
    const users = activeUsers.get(channelName);
    if (users) {
        const user = users.find((user: IUserData) => user.uid === uid);
        return user?.name || `Unknown-${uid}`;
    }
    return `Unknown-${uid}`;
}

export function addBotId(botId: string, channelName: string) {
    if (!activeBotsIds.has(channelName)) {
        activeBotsIds.set(channelName, []);
    }
    activeBotsIds.get(channelName)?.push(botId);
}

export function removeBotId(botId: string, channelName: string) {
    const bots = activeBotsIds.get(channelName);
    if (bots) {
        const index = bots.findIndex((id: string) => id === botId);
        if (index !== -1) {
            bots.splice(index, 1);
        }
    }
}

export function doesBotExist(botId: string, channelName: string) {
    return activeBotsIds.get(channelName)?.includes(botId) || false;
}

// function to clear all active users and live languages
export function clearAllData() {
    activeUsers.clear();
    liveLanguages.clear();
    activeBotsIds.clear();
}

export function removeUserAndBots(userId: string, channelName: string) {
    if(userId.length !== 4){
        return
    }
    removeUser(userId, channelName)
    // find all the bots with this first 4 characters same as this userid
    const bots = activeBotsIds.get(channelName)
    if(bots){
        const botsToBeRemoved = bots.filter(bot => bot.startsWith(userId))
        botsToBeRemoved.forEach(bot => {
            removeBotId(bot, channelName)
        })
    }
}

export function removeBotAndUser(botId: string, channelName: string) {
    if(botId.length !== 8){
        return
    }
    removeBotId(botId, channelName)
    const userId = botId.slice(0, 4)
    removeUser(userId, channelName)
}


function logAllBots(channelName){
    const bots = activeBotsIds.get(channelName)
    console.log(`Bots in ${channelName}`)
    console.log('---------------------')
    if(bots){
        bots.forEach(bot => {
            console.log(bot)
        })
    }
    console.log('---------------------')
}

function logAllUsers(channelName){
    const users = activeUsers.get(channelName)
    console.log(`Users in ${channelName}`)
    console.log('---------------------')
    if(users){
        if(users?.length === 0){
            stopWebRecordService(channelName)
        }
        users.forEach(user => {
            console.log(user)
        })
    }
    console.log('---------------------')
}

export function logAllUsersAndBots(channelName){
    logAllUsers(channelName)
    logAllBots(channelName)
}