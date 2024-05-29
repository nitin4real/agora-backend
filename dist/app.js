"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateTokenForUserID = void 0;
const express_1 = __importDefault(require("express"));
const agora_token_1 = require("agora-token");
const cors_1 = __importDefault(require("cors"));
const appId = '6a0d0b12f6074aad818c99ff9355d444';
const port = 3020;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.get('/getToken', (req, res) => {
    console.log(req.query);
    const userId = req.query.userId;
    res.send({ tokens: (0, exports.GenerateTokenForUserID)(userId), appId });
});
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
const GenerateTokenForUserID = (userId, channelName = '') => {
    const appCertificate = '7c1ea51799fa4f059dd745ce9f83b31c';
    const uid = userId;
    const expirationTimeInSeconds = 6000;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const role = agora_token_1.RtcRole.PUBLISHER;
    const rtcToken = agora_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, expirationTimeInSeconds, privilegeExpiredTs);
    const rtmToken = agora_token_1.RtmTokenBuilder.buildToken(appId, appCertificate, userId, expirationTimeInSeconds);
    return { rtcToken, rtmToken };
};
exports.GenerateTokenForUserID = GenerateTokenForUserID;
//# sourceMappingURL=app.js.map