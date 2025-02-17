import { LanguageName, VoiceId } from "./supportedLanguages";


export interface IUserData {
    uid: string;
    name: string;
    language: LanguageName;
    channel: string;
    voiceId: VoiceId;
}
