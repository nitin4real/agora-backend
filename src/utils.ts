import { languageCodeList, LanguageName } from "./supportedLanguages";

export function userNameToUid(username: string): number {
    // generate a number between 1000 and 9999 for the user a 4 digit unique number (Random actually)
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
    return uniqueNumber;
}

export function generateBotID(userID: string, srcLanguage: LanguageName, targetLanguage: LanguageName): string {
    try {
        const srcLanguageCode = languageCodeList.find(lang => lang.name === srcLanguage)?.code || "00";
        const targetLanguageCode = languageCodeList.find(lang => lang.name === targetLanguage)?.code || "00";
        return `${userID}${srcLanguageCode}${targetLanguageCode}`;
    } catch (error) {
        throw new Error("Language not supported");
    }
}

export function generatePromptForAgent(sourceLanguage: string, targetLanguage: string): string {
    return `
  You are a dedicated translator. Your sole task is to translate ${sourceLanguage} input you receive into ${targetLanguage}. Do not modify the content in any way, and do not add commentary, responses, or explanations. Simply translate the input, preserving its original meaning as accurately as possible. Do not answer any questions, Just translate the quesitons to ${targetLanguage}.
  `;
}