import { RealtimeClient } from "@openai/realtime-api-beta";
import { Language_Name } from "./app";
import { getInstructions } from "./Instructions";

const API_KEY = process.env.OPEN_AI_KEY_AGORA
export class OpenAIConnection {
    isAIConnected: boolean = false
    client = new RealtimeClient({
        apiKey: API_KEY
    })
    sourceLanguage: Language_Name
    targetLanguage: Language_Name
    actAsProxy: boolean = false
    onTranslatedResponse: (audio, eventId) => void

    constructor(sourceLanguage: Language_Name, targetLanguage: Language_Name, onTranslatedResponse: (audio, eventId) => void) {
        this.sourceLanguage = sourceLanguage
        this.targetLanguage = targetLanguage
        if (false) { // temp fix for bug on line 62 
            this.actAsProxy = true
            return
        }
        this.onTranslatedResponse = onTranslatedResponse
        this.init(sourceLanguage, targetLanguage, onTranslatedResponse)
    }

    async init(sourceLanguage: Language_Name, targetLanguage: Language_Name, onTranslatedResponse: (audio, eventId) => void) {
        await this.client.connect()
        const instructions = getInstructions(sourceLanguage, targetLanguage)
        this.client.updateSession({ instructions: instructions });
        this.client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
        // this.client.updateSession({ // wait for the speaker to finish
        //     turn_detection: { type: 'server_vad' },
        // });
        console.log('creating new ai', sourceLanguage, targetLanguage)
        // this.client.sendUserMessageContent([
        //     {
        //         type: `input_text`,
        //         text: `Hello!`,
        //         // text: `For testing purposes, I want you to list ten car brands. Number each item, e.g. "one (or whatever number you are one): the item name".`
        //     },
        // ]);
        this.client.on('error', (event: any) => console.error(event));
        this.client.on('conversation.updated', async ({ item, delta }: any) => {
            // console.log(item)
            if (delta?.audio) {
                onTranslatedResponse(delta.audio, item.id);
            }
        });
        this.isAIConnected = true
    }

    onDisconnect = () => {
        if (this.isAIConnected && !this.actAsProxy) {
            this.client.disconnect()
            this.isAIConnected = false
        }
    }

    addAudio = (audioData) => {
        if (this.actAsProxy || !this.isAIConnected) {
            // console.log("this.isAIConnected",this.isAIConnected) // bug - major resolve it. // onTranslatedRespone not a function. Undefined
            // this.onTranslatedResponse(audioData, '')
            return
        }
        this.client.appendInputAudio(audioData)
    }

    createResponse = () => {
        if (this.actAsProxy || !this.isAIConnected) {
            return
        }
        this.client.createResponse()
    }

}