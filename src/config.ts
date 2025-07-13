import dotenv from 'dotenv';
dotenv.config();

export const AGORA_APP_ID = process.env.AGORA_APP_ID!;
export const AGORA_CERT = process.env.AGORA_CERT!;
export const S2_BUCKET = process.env.S2_BUCKET!;
export const S2_SECRET_KEY = process.env.S2_SECRET_KEY!;
export const S2_ACCESS_KEY_ID = process.env.S2_ACCESS_KEY_ID!;
export const CUSTOMER_SECRET = process.env.CUSTOMER_SECRET!;
export const CUSTOMERID = process.env.CUSTOMERID!;
export const ORG_NAME = process.env.ORG_NAME!;
export const APP_NAME = process.env.APP_NAME!;
export const APP_KEY = ORG_NAME + '#' + APP_NAME;
export const HTTP_PORT = process.env.HTTP_PORT!;
export const HTTPS_PORT = process.env.HTTPS_PORT!;
export const isProd = process.env.isProd! === 'true';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
export const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
export const PRIV_KEY_PATH = process.env.PRIV_KEY_PATH!;
export const CERT_KEY_PATH = process.env.CERT_KEY_PATH!;

export const config = {
    AGORA_APP_ID,
    AGORA_CERT,
    S2_BUCKET,
    S2_SECRET_KEY,
    S2_ACCESS_KEY_ID,
    CUSTOMER_SECRET,
    CUSTOMERID,
    ORG_NAME,
    APP_NAME,
    APP_KEY,
    HTTP_PORT,
    HTTPS_PORT,
    isProd,
    OPENAI_API_KEY,
    ELEVENLABS_API_KEY,
    PRIV_KEY_PATH,
    CERT_KEY_PATH
}