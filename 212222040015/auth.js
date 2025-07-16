// register.js
import fetch from 'node-fetch';
const authURL = 'http://20.244.56.144/evaluation-service/register';

const authenticationData = {
    email: "justarun0210@gmail.com",
    name: "arun j",
    mobileNo: "9384149692",
    githubUsername: "arun1111j",
    rollNo: "212222040015",
    accessCode: 'qguCff',
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
        console.log(`ClientID: ${data.clientID}`);
        console.log(`ClientSecret: ${data.clientSecret}`);
        console.log(`Expires_in: ${data.expires_in}`);
    } catch (error) {
        console.error('❌ Error registering:', error.message);
    }
}

authLogger();