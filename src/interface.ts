import { LanguageName } from "./supportedLanguages";


export interface IUserData {
    uid: string;
    name: string;
    language: LanguageName;
    channel: string;
    voiceId: string;
    isGemini: boolean;
}
