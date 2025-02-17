import axios from "axios"
import { appId } from "./app"
import { CUSTOMER_SECRET, CUSTOMERID } from "./webRecordService"
import { getTranscriptLanguageCode, LanguageName } from "./supportedLanguages"
import { generateBotID } from "./utils"
import { GenerateTokenForUserID } from "./agoraTokenGenerator"
import fs from 'fs';
import path from 'path';

export enum TranscriptStatus {
    STARTED = 'STARTED',
    STOPPED = 'STOPPED',
    ERROR = 'ERROR'
}


interface ITranscriptProcess {
    uid: string,
    channelName: string,
    resourceId?: string,
    taskId?: string
}

const transcriptProcesses = new Map<string, ITranscriptProcess>()

const addTranscriptProcess = (channelName: string, uid: string) => {
    const key = `${channelName}_${uid}`
    const transcriptProcess: ITranscriptProcess = { uid, channelName }
    transcriptProcesses.set(key, transcriptProcess)
}


const updateTrancriptProcess = (channelName: string, uid: string, resourceId: string, taskId: string) => {
    const key = `${channelName}_${uid}`
    const transcriptProcess = transcriptProcesses.get(key)
    if (transcriptProcess) {
        transcriptProcess.resourceId = resourceId
        transcriptProcess.taskId = taskId
    }
}

const deleteTranscriptProcess = (channelName: string, uid: string) => {
    const key = `${channelName}_${uid}`
    transcriptProcesses.delete(key)
}
const getTranscriptProcess = (channelName: string, uid: string): ITranscriptProcess | undefined => {
    const key = `${channelName}_${uid}`
    return transcriptProcesses.get(key)
}


export const startTranscription = async (channelName: string, userUid: string, userLanguage: LanguageName): Promise<TranscriptStatus> => {
    try {
        console.log('Starting Transcriptions for', 'for user', userUid, 'in channel', channelName)
        const transcriptProcess = getTranscriptProcess(channelName, userUid)
        if (transcriptProcess) {
            console.log('Transcription already running for user', userUid, 'in channel', channelName)
            return TranscriptStatus.STARTED
        }
        addTranscriptProcess(channelName, userUid)
        const resourceResponse = await axios.post(`https://api.agora.io/v1/projects/${appId}/rtsc/speech-to-text/builderTokens`,
            {
                instanceId: userUid
            }, {
            headers: {
                'Content-Type': 'application/json',
            },
            auth: {
                username: CUSTOMERID,
                password: CUSTOMER_SECRET
            }
        })
        const resourceId = resourceResponse?.data?.tokenName
        // setResourceID(channelName, resourceId)
        console.log('Starting transcription with resourceID', resourceId, 'for user', userUid, 'in channel', channelName)
        const subuid = userUid + "1"
        const putuid = generateBotID(userUid, userLanguage, userLanguage)
        const transcriptionCode = getTranscriptLanguageCode(userLanguage)
        const startResponse = await axios.post(`https://api.agora.io/v1/projects/${appId}/rtsc/speech-to-text/tasks?builderToken=${resourceId}`,
            {
                "languages": [
                    transcriptionCode,
                ],
                "maxIdleTime": 60,
                "rtcConfig": {
                    "channelName": channelName,
                    "subBotUid": subuid,
                    "subBotToken": (await GenerateTokenForUserID(subuid, channelName)).rtcToken,
                    "pubBotUid": putuid,
                    "pubBotToken": (await GenerateTokenForUserID(putuid, channelName)).rtcToken,
                    "subscribeAudioUids": [
                        userUid
                    ]
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                auth: {
                    username: CUSTOMERID,
                    password: CUSTOMER_SECRET
                }
            }
        )
        const taskId = startResponse?.data?.taskId
        updateTrancriptProcess(channelName, userUid, resourceId, taskId)
        // add this resource id and task id to a file
        try {
            const resourceDataPath = path.join(__dirname, 'sttResourceData.json');
            const saveResourceData = (channelName: string, uid: string, resourceId: string, taskId: string) => {
                let resourceData = {};
                if (fs.existsSync(resourceDataPath)) {
                    const rawData = fs.readFileSync(resourceDataPath, 'utf-8');
                    resourceData = JSON.parse(rawData);
                }
                resourceData[`${channelName}_${uid}`] = { resourceId, taskId };
                fs.writeFileSync(resourceDataPath, JSON.stringify(resourceData, null, 2));
            };
            saveResourceData(channelName, userUid, resourceId, taskId);
        } catch (error) {
            console.log('Error in saving resource data', error)
        }

        console.log('Successfully started transcription with taskid: ', taskId)
        return TranscriptStatus.STARTED
    } catch (error) {
        deleteTranscriptProcess(channelName, userUid)
        console.log('error in starting the transcription', error?.status, error?.message)
        return TranscriptStatus.ERROR
    }
}


export const stopTranscription = async (channelName: string, uid: string): Promise<TranscriptStatus> => {
    try {
        console.log('Stop Transcription for user ', uid, 'in channel', channelName)
        const transcriptProcess = getTranscriptProcess(channelName, uid)
        if (transcriptProcess === undefined) {
            return TranscriptStatus.ERROR
        }
        const { taskId, resourceId } = transcriptProcess
        const stopResponse = await axios.delete(`https://api.agora.io/v1/projects/${appId}/rtsc/speech-to-text/tasks/${taskId}?builderToken=${resourceId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                auth: {
                    username: CUSTOMERID,
                    password: CUSTOMER_SECRET
                }
            }
        )
        deleteTranscriptProcess(channelName, uid)
        console.log('Successfully stopped transcription with tid: ', stopResponse?.data?.taskId)
        return TranscriptStatus.STOPPED
    }
    catch (error) {
        console.log('error in stoping the transcription', error?.status, error?.message)
        return TranscriptStatus.ERROR
    }
}


export const stopAllTranscriptions = async () => {
    try {
        const resourceDataPath = path.join(__dirname, 'sttResourceData.json');
        if (fs.existsSync(resourceDataPath)) {
            const rawData = fs.readFileSync(resourceDataPath, 'utf-8');
            const resourceData = JSON.parse(rawData);
            for (const key in resourceData) {
                const [channelName, uid] = key.split('_');
                await stopTranscription(channelName, uid);
            }
            fs.writeFileSync(resourceDataPath, JSON.stringify({}, null, 2)); // Clear the file after stopping all transcriptions
        }
    } catch (error) {
        console.log('error in stoping all the transcriptions', error)
        return TranscriptStatus.ERROR
    }
    // transcriptProcesses.forEach(async (transcriptProcess) => {
    //     const { channelName, uid } = transcriptProcess
    //     await stopTranscription(channelName, uid)
    // })
    console.log('Stopped all transcriptions')
    return TranscriptStatus.STOPPED
}