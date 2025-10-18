import dotenv from 'dotenv';

dotenv.config();

export const config = {
    mongodb: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/finalyear'
    },
    jwt: {
        secret: process.env.JWT_SECRET
    },
    email: {
        user: process.env.EMAIL_USER,
        password: process.env.GMAIL_APP_PASSWORD,
        emailPass: process.env.EMAIL_PASS
    },
    google: {
        projectId: process.env.GOOGLE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        privateKey: process.env.GOOGLE_PRIVATE_KEY,
        spreadsheetId: process.env.SPREADSHEET_ID
    }
};

// Validate required configurations
const requiredConfigs = [
    { key: 'jwt.secret', value: config.jwt.secret },
    { key: 'google.spreadsheetId', value: config.google.spreadsheetId },
    { key: 'google.privateKey', value: config.google.privateKey },
    { key: 'google.clientEmail', value: config.google.clientEmail }
];

for (const { key, value } of requiredConfigs) {
    if (!value) {
        throw new Error(`Missing required configuration: ${key}`);
    }
}

export default config;