
---

# Backend Services  

## **Node.js Server**  

### Overview  

This server is responsible for:  
1. Managing **active channels**, **users**, and **translation agents** in those channels.  
2. Generating **translation agents** by sending API requests to the Python server, which acts as an agent generator.  
3. Creating **Agora RTC tokens** for frontend users to join channels.  

---

### Instructions  

#### **Environment Setup**  
1. Create a `.env` file in the project directory.  
2. Add the following variables:  
   ```plaintext
   AGORA_APP_ID=yourAgoraAppId  
   AGORA_CERT=yourAgoraCert  
   ```  
   To obtain the Agora App ID and Certificate, follow the instructions on [this page](addLink).  

#### **Installation and Setup**  
1. **Install Dependencies**:  
   ```bash
   npm install
   ```  
2. **Compile the Code**:  
   ```bash
   npx tsc
   ```  
3. **Start the Server**:  
   ```bash
   npm run start
   ```  

#### **HTTP/HTTPS Server Configuration**  
- For development, an HTTP server is sufficient and does not require SSL certificates.  
- For production, update the `.pem` file paths for SSL certificates in `src/app.ts`.  
- Uncomment the `HTTPS_SERVER.listen` line in `src/app.ts` to enable the HTTPS server.  
- Default ports:  
  - HTTP: **3013**  
  - HTTPS: **3012**  
- Ports can be updated in `src/app.ts`.  

---

### Endpoints  

#### **1. `/getToken`**  
**Parameters**:  
- `userId` (string): User's name.  
- `language` (string): Selected language (must match a language in `supportedLanguages.ts`).  
- `channelName` (string): Case-sensitive channel name.  

**Functionality**:  
- Generates a token using Agora credentials.  
- Creates a random 4-digit UID for the user and stores their username for reference.  
- Sends a request to the Python server to create and inject translation agents into the channel.  

**Agent Creation API Parameters (sent to Python server)**:  
- `channel_name`: Channel name.  
- `uid`: 8-digit agent UID.  
- `system_instruction`: System instructions for the agent.  
- `target_user_id`: 4-digit UID of the target user.  

#### **2. `/getUserName`**  
**Parameters**:  
- `uid` (number): User ID.  

**Functionality**:  
- Retrieves the username associated with the provided UID, stored during token generation.  
- Used by the frontend to display remote user names.  

#### **3. `/user_left`**  
**Parameters**:  
- `uid` (number): User ID.  

**Functionality**:  
- Removes the user's data and releases resources when they leave a channel.  

---

### Logic for Generating Agents  

1. When a user joins a channel with a selected language:  
   - The server checks the languages currently present in the channel.  
   - For each existing language, an agent is created to translate the user’s speech to that language.  

2. **Example Scenario**:  
   - **Current Users**: 2 users speaking Hindi and 1 user speaking English.  
   - **New User**: Joins speaking Chinese.  
   - Agents are created as follows:  
     - 2 agents for translating the new user’s speech to Hindi.  
     - 1 agent for translating the new user’s speech to English.  
     - Additionally, 3 agents are created to translate existing users’ speech (Hindi and English) to Chinese.  

3. No agents are created for users who share the same language (e.g., English to English).  

4. **Transcription Agents**:  
   - A transcription agent is created for every user upon joining, with the same source and target language for text transcription.  

5. When a user leaves:  
   - All agents responsible for translating the user’s speech are destroyed.  

---

### Related Repositories

- **Frontend**: User interface for the meeting application. [Repository Link](https://github.com/nitin4real/react-video-call-project)
- **Python Server**: Handles agent generation and injection into Agora RTN channels. [Repository Link](https://github.com/nitin4real/s2s-agora-openai-realtime-translation)

---
