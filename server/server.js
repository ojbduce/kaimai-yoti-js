const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { 
    DigitalIdentityClient,
    DigitalIdentityBuilders: {
        PolicyBuilder,
        ShareSessionConfigurationBuilder,
    }
} = require('yoti');
require('dotenv').config();

console.log('Starting server with environment:', {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    YOTI_KEY_PATH: process.env.YOTI_KEY_FILE_PATH,
    APP_URL: process.env.APP_URL,
    PWD: process.cwd()
});
console.log('YOTI_CLIENT_SDK_ID:', process.env.YOTI_CLIENT_SDK_ID?.substring(0, 8) + '...');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('client'));
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'ALLOW-FROM https://reliable-equatorial-heron.anvil.app');
    res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'self' https://reliable-equatorial-heron.anvil.app"
    );
    next();
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

let yotiClient;
try {
    const yotiKeyPath = process.env.YOTI_KEY_FILE_PATH;
    console.log('Attempting to read Yoti key from:', yotiKeyPath);
    
    if (!fs.existsSync(yotiKeyPath)) {
        console.error('Yoti key file not found at:', yotiKeyPath);
        console.log('Directory contents:', fs.readdirSync(path.dirname(yotiKeyPath)));
        throw new Error('Yoti key file not found');
    }
    
    yotiClient = new DigitalIdentityClient(
        process.env.YOTI_CLIENT_SDK_ID,
        fs.readFileSync(yotiKeyPath)
    );
    console.log('Yoti client initialized successfully');
} catch (error) {
    console.error('Failed to initialize Yoti client:', error);
    process.exit(1);
}

const policy = new PolicyBuilder()
    .withEmail()
    .withWantedRememberMe()
    .build();

app.post('/api/yoti/create-session', async (req, res) => {
    console.log('Attempting to create Yoti session...');
    try {
        const callbackUrl = `${process.env.APP_URL}/callback`;
        console.log('Using callback URL:', callbackUrl);
        
        const shareSessionConfig = new ShareSessionConfigurationBuilder()
            .withRedirectUri(callbackUrl)
            .withPolicy(policy)
            .build();

        const shareSessionResult = await yotiClient.createShareSession(shareSessionConfig);
        console.log('Session created successfully:', shareSessionResult.getId());
        
        res.json({
            sessionId: shareSessionResult.getId(),
            success: true
        });
    } catch (error) {
        console.error('Session creation failed:', error);
        res.status(500).json({
            error: 'Failed to create Yoti session',
            details: error.message,
            success: false
        });
    }
});

app.get('/callback', async (req, res) => {
    console.log('\n=== YOTI CALLBACK ===');
    console.log('Callback received with query params:', req.query);
    
    try {
        const { receiptId } = req.query;
        
        if (!receiptId) {
            console.log('❌ No receipt ID provided');
            return res.send(`
                <html>
                    <head><title>Verification Failed</title></head>
                    <body>
                        <h1>Verification Failed</h1>
                        <p>No receipt ID provided</p>
                    </body>
                </html>
            `);
        }

        const decodedReceiptId = decodeURIComponent(receiptId);
        console.log('Decoded receipt ID:', decodedReceiptId);
        
        console.log('🔍 Retrieving share receipt...');
        const shareReceipt = await yotiClient.getShareReceipt(decodedReceiptId);
        
        const sessionId = shareReceipt.getSessionId();
        const rememberMeId = shareReceipt.getRememberMeId();
        const parentRememberMeId = shareReceipt.getParentRememberMeId();

        console.log('📋 Receipt Details:', {
            sessionId,
            rememberMeId,
            parentRememberMeId
        });
        
        console.log('📧 Getting profile...');
        const profile = shareReceipt.getProfile();
        const email = profile.getEmailAddress().getValue();
        console.log('Email retrieved:', email);

        const userData = {
            email: email,
            rememberMeId: rememberMeId,
            verificationDate: new Date().toISOString()
        };

        console.log('🚀 Sending to Anvil:', userData);
        
        const anvilResponse = await fetch('https://reliable-equatorial-heron.anvil.app/_/api/yka', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const responseData = await anvilResponse.json();
        console.log('📥 Anvil Response:', responseData);

        if (!anvilResponse.ok || responseData.status === 'error') {
            throw new Error(responseData.message || 'Failed to save to Anvil');
        }

        console.log('✅ Verification and data storage successful!\n');
        
        res.send(`
            <html>
                <head><title>Verification Complete</title></head>
                <body>
                    <h1>Verification Successful!</h1>
                    <p>Email: ${email}</p>
                    <p>Session ID: ${sessionId}</p>
                    <p>Remember Me ID: ${rememberMeId}</p>
                    <p>Parent Remember Me ID: ${parentRememberMeId || 'None'}</p>
                    <p>Data saved to database ✅</p>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ Error:', error);
        res.send(`
            <html>
                <head><title>Verification Error</title></head>
                <body>
                    <h1>Verification Error</h1>
                    <p>There was a problem processing your verification</p>
                    <pre>${error.message}</pre>
                </body>
            </html>
        `);
    }
});

app.get('/debug-env', (req, res) => {
    res.json({
        YOTI_CLIENT_SDK_ID: process.env.YOTI_CLIENT_SDK_ID?.substring(0, 4) + '...',
        YOTI_KEY_FILE_PATH: process.env.YOTI_KEY_FILE_PATH,
        APP_URL: process.env.APP_URL,
        NODE_ENV: process.env.NODE_ENV,
        PWD: process.cwd()
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check available at: http://0.0.0.0:${port}/health`);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
