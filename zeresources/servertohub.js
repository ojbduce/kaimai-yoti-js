const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const { 
    DigitalIdentityClient,
    DigitalIdentityBuilders: {
        PolicyBuilder,
        ShareSessionNotificationBuilder,
        ShareSessionConfigurationBuilder
    }
} = require('yoti');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// SSL options
const sslOptions = {
    key: fs.readFileSync('./certificates/private.key'),
    cert: fs.readFileSync('./certificates/certificate.pem')
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client'));

// Initialize Yoti client
const yotiClient = new DigitalIdentityClient(
    process.env.YOTI_CLIENT_SDK_ID,
    fs.readFileSync(process.env.YOTI_KEY_FILE_PATH)
);

// Build the policy
const policy = new PolicyBuilder()
    .withEmail()
    .build();

// Create an endpoint to initialize Yoti session
app.post('/api/yoti/create-session', async (req, res) => {
    try {
        // Session configuration
        const shareSessionConfig = new ShareSessionConfigurationBuilder()
            .withRedirectUri(`${process.env.APP_URL}/callback`)  // We'll need to add this to .env
            .withPolicy(policy)
            // Optional notification webhook
            // .withNotification(notification)  // Uncomment if you want to add webhook
            .build();

        // Create the session
        const shareSessionResult = await yotiClient.createShareSession(shareSessionConfig);
        
        res.json({
            sessionId: shareSessionResult.getId(),
            success: true
        });
    } catch (error) {
        console.error('Yoti session creation error:', error);
        res.status(500).json({
            error: 'Failed to create Yoti session',
            success: false
        });
    }
});

// Update the server creation to use HTTPS
https.createServer(sslOptions, app)
    .listen(port, () => {
        console.log(`Secure server running on https://localhost:${port}`);
    });