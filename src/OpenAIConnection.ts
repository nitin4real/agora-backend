import { Language_Name } from "./app";
import { getInstructions } from "./Instructions";

const getRealTimeApiClient = async () => {
    const module = await import('@openai/realtime-api-beta');
    return module.default;
};

const API_KEY = process.env.OPEN_AI_KEY_PERSONAL

export class OpenAIConnection {
    isAIConnected: boolean = false
    client
    sourceLanguage: Language_Name
    targetLanguage: Language_Name
    actAsProxy: boolean = false
    onTranslatedResponse: (audio, eventId) => void

    constructor(sourceLanguage: Language_Name, targetLanguage: Language_Name, onTranslatedResponse: (audio, eventId) => void) {
        this.sourceLanguage = sourceLanguage
        this.targetLanguage = targetLanguage
        if (false) {
            this.actAsProxy = true
            return
        }
        console.log("connection made")
        this.init(sourceLanguage, targetLanguage, onTranslatedResponse)
    }

    async init(sourceLanguage, targetLanguage, onTranslatedResponse) {
        const { RealtimeClient } = await getRealTimeApiClient()
        this.client = new RealtimeClient({
            apiKey: API_KEY
        })
        console.log("connection made")
        await this.client.connect()
        const instructions = getInstructions(sourceLanguage, targetLanguage)
        this.client.updateSession({ instructions: instructions });
        this.client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
        this.client.on('conversation.updated', async ({ item, delta }: any) => {
            console.log("on connection updated")
            if (delta?.audio) {
                onTranslatedResponse(delta.audio, item.id);
            }
        });
        this.isAIConnected = true
    }

    onDisconnect = () => {
        if(this.isAIConnected && !this.actAsProxy){
            this.client.disconnect()
            this.isAIConnected = false
        }
    }

    addAudio = (audioData) => {
        if (this.actAsProxy || !this.isAIConnected) {
            this.onTranslatedResponse(audioData, '')
            return
        }
        this.client.appendInputAudio(audioData)
    }

    createResponse = () => {
        console.log("Trying to get response" )
        if (this.actAsProxy || !this.isAIConnected) {
            return
        }
        this.client.createResponse()
    }

}