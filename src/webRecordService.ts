import axios from "axios"
import { appId } from "./app"


const S2_BUCKET = process.env.S2_BUCKET
const S2_SECRET_KEY = process.env.S2_SECRET_KEY
const S2_ACCESS_KEY_ID = process.env.S2_ACCESS_KEY_ID
const CUSTOMER_SECRET = process.env.CUSTOMER_SECRET
const CUSTOMERID = process.env.CUSTOMERID

export enum RecorderStatus {
    STARTED = 'STARTED',
    STOPPED = 'STOPPED',
    ALREADY_RECORDING = 'ALREADY RECORDING',
    ERROR = 'ERROR'
}

interface IRecording {
    channelName: string,
    sid: string,
    resourceId: string
    isRecordingRunning: boolean
}
const recorderInstances: IRecording[] = []

export const isRecordingRunning = (channelName: string) => {
    return recorderInstances.find(rec => rec.channelName === channelName)?.isRecordingRunning
}

const createRecorderInstance = (channelName: string) => {
    const recorderInstance = getRecorderInstance(channelName)
    if (recorderInstance) {
        recorderInstance.isRecordingRunning = true
        return
    }
    recorderInstances.push({
        channelName,
        resourceId: '',
        sid: '',
        isRecordingRunning: true
    })
}

const stopRecorderInstance = (channelName: string) => {
    const recorderInstance = getRecorderInstance(channelName)
    if (recorderInstance) {
        recorderInstance.isRecordingRunning = false
    }
}

const setResourceID = (channelName: string, resourceId: string) => {
    const recorderInstance = getRecorderInstance(channelName)
    if (recorderInstance) {
        recorderInstance.resourceId = resourceId
    }
}

const setSID = (channelName: string, sid: string) => {
    const recorderInstance = getRecorderInstance(channelName)
    if (recorderInstance) {
        recorderInstance.sid = sid
    }
}

const getRecorderInstance = (channelName: string) => {
    return recorderInstances.find(rec => rec.channelName === channelName)
}

export const startWebRecordService = async (channelName: string): Promise<RecorderStatus> => {
    console.log('startWebRecordService')
    try {
        if (isRecordingRunning(channelName)) {
            return RecorderStatus.ALREADY_RECORDING
        }
        createRecorderInstance(channelName)
        const resourceResponse = await axios.post(`https://api.agora.io/v1/apps/${appId}/cloud_recording/acquire`,
            {
                "cname": "anything",
                "uid": "43211",
                "clientRequest": {
                    "resourceExpiredHour": 24,
                    "scene": 1
                }
            }, {
            headers: {
                'Content-Type': 'application/json',
            },
            auth: {
                username: CUSTOMERID,
                password: CUSTOMER_SECRET
            }
        })
        const resourceId = resourceResponse?.data?.resourceId
        setResourceID(channelName, resourceId)
        console.log('Successfully acquired resource', resourceId)
        console.log('Starting recording')
        const startResponse = await axios.post(`https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/web/start`,
            {
                "cname": "anything",
                "uid": "43211",
                "clientRequest": {
                    "token": "",
                    "extensionServiceConfig": {
                        "errorHandlePolicy": "error_abort",
                        "extensionServices": [
                            {
                                "serviceName": "web_recorder_service",
                                "errorHandlePolicy": "error_abort",
                                "serviceParam": {
                                    "url": `https://s2s-agora-openai-demo.vercel.app/meet/${channelName}/language?isRecorder=recorder`,
                                    "audioProfile": 1,
                                    "videoWidth": 1280,
                                    "videoHeight": 720,
                                    "maxRecordingHour": 1
                                }
                            }
                        ]
                    },
                    "recordingFileConfig": {
                        "avFileType": [
                            "hls",
                            "mp4"
                        ]
                    },
                    "storageConfig": {
                        "vendor": 1,
                        "region": 14,
                        "bucket": S2_BUCKET,
                        "accessKey": S2_ACCESS_KEY_ID,
                        "secretKey": S2_SECRET_KEY
                    }
                }
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
        const sid = startResponse?.data?.sid
        setSID(channelName, sid)
        console.log('Successfully started recording with sid: ', startResponse?.data?.sid)
        return RecorderStatus.STARTED
    } catch (error) {
        stopRecorderInstance(channelName)
        console.log('error in starting the recording', error.status, error.message)
        return RecorderStatus.ERROR
    }
}

export const stopWebRecordService = async (channelName: string): Promise<RecorderStatus> => {
    try {
        console.log('Stop recording')
        const recorderInstance = getRecorderInstance(channelName)
        if(recorderInstance === undefined) {
            return RecorderStatus.ERROR
        }
        const stopResponse = await axios.post(`https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${recorderInstance.resourceId}/sid/${recorderInstance.sid}/mode/web/stop`,
            {
                "cname": "anything",
                "uid": "43211",
                "clientRequest": {}
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
        stopRecorderInstance(channelName)
        console.log('Successfully stopped recording with sid: ', stopResponse?.data?.sid)
        return RecorderStatus.STOPPED
    }
    catch (error) {
        console.log('error in stoping the recording', error)
        return RecorderStatus.ERROR
    }
}


export const stopAllRecordings = async () => {
    recorderInstances.forEach(async (recorderInstance) => {
        await stopWebRecordService(recorderInstance.channelName)
    })
}