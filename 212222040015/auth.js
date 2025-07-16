// register.js
import fetch from 'node-fetch';
const authURL = 'http://20.244.56.144/evaluation-service/auth';

const authenticationData = {
    email: "justarun0210@gmail.com",
    name: "arun j",
    rollNo: "212222040015",
    accessCode: 'qguCff',
    clientID: "26595c82-056b-40a9-b9a1-9de6d267186e",
    clientSecret: "fMhnGZsHCtbkKVSc"
};
async function authLogger() {
    try {
        const response = await fetch(authURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(authenticationData),
        });

        if (!response.ok) {

            throw new Error(`Authentication failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(`token_type: ${data.token_type}`);
        console.log(`access_token: ${data.access_token}`);
        console.log(`Expires_in: ${data.expires_in}`);
    } catch (error) {
        console.error('❌ Error registering:', error.message);
    }
}

authLogger();