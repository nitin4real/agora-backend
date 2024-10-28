import { IUserData } from './interface';
import { LanguageName } from './supportedLanguages';

export const activeUsers: IUserData[] = [];
export const activeBotsIds: string[] = [];
export const liveLanguages: Set<LanguageName> = new Set<LanguageName>();

// get all active users
export function getActiveUsers() {
    return activeUsers;
}


// function to add a new user to the activeUsers array
export function addUser(user: IUserData) {
    activeUsers.push(user);
    liveLanguages.add(user.language as LanguageName);
}

// function to remove a user from the activeUsers array, also remove the language from liveLanguages if no user is using it
export function removeUser(uid: string) {
    const index = activeUsers.findIndex(user => user.uid === uid);
    if (index !== -1) {
        const language = activeUsers[index].language;
        activeUsers.splice(index, 1);
        if (!activeUsers.some(user => user.language === language)) {
            liveLanguages.delete(language);
        }
    }
}

// function to get userName from userId
export function getUserName(uid: string) {
    const user = activeUsers.find(user => user.uid === uid);
    return user?.name || `Unknown-${uid}`;
}

export function addBotId(botId: string) {
    // if bot does not exist
    if (!activeBotsIds.includes(botId))
        activeBotsIds.push(botId);
}

export function doesBotExist(botId: string) {
    return activeBotsIds.includes(botId);
}

// function to clear all active users and live languages
export function clearAllData() {
    activeUsers.length = 0;
    liveLanguages.clear();
    activeBotsIds.length = 0;
}