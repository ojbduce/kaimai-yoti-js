const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
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
const port = process.env.PORT || 8080;

// Add SSL configuration
const httpsOptions = process.env.NODE_ENV === 'development' ? {
    key: fs.readFileSync('local-dev/certificates/private.key'),
    cert: fs.readFileSync('local-dev/certificates/certificate.pem')
} : null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client'));
app.use((req, res, next) => {
    // Allow embedding in iframes
    res.setHeader('X-Frame-Options', 'ALLOW-FROM https://reliable-equatorial-heron.anvil.app');
    // Modern browsers use Content-Security-Policy
    res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'self' https://reliable-equatorial-heron.anvil.app"
    );
    next();
});

async function getYotiKey() {
    try {
        const keyPath = process.env.YOTI_KEY_FILE_PATH;
        console.log(`📝 Reading key from: ${keyPath}`);
        const key = fs.readFileSync(keyPath, 'utf8');
        
        if (!key) {
            throw new Error('Failed to read key file');
        }

        console.log('Key loaded successfully');
        return key;
    } catch (error) {
        console.error('❌ Error reading key file:', error);
        throw error;
    }
}

// Initialize Yoti client
let yotiClient;
async function initializeYotiClient() {
    try {
        const privateKey = await getYotiKey();
        yotiClient = new DigitalIdentityClient(
            process.env.YOTI_CLIENT_SDK_ID,
            privateKey
        );
        console.log(`✅ Yoti client initialized in ${process.env.NODE_ENV} mode`);
    } catch (error) {
        console.error('❌ Failed to initialize Yoti client:', error);
        throw error;
    }
}

// Build the policy
const policy = new PolicyBuilder()
    .withEmail()
    .withWantedRememberMe()
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


app.get('/callback', async (req, res) => {
    console.log('\n=== YOTI CALLBACK ===');
    
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

        console.log('🔍 Retrieving share receipt...');
        const shareReceipt = await yotiClient.getShareReceipt(decodeURIComponent(receiptId));
        
        // Get receipt details
        const sessionId = shareReceipt.getSessionId();
        const rememberMeId = shareReceipt.getRememberMeId();
        const parentRememberMeId = shareReceipt.getParentRememberMeId();

        console.log('📋 Receipt Details:');
        console.log('Session ID:', sessionId);
        console.log('Remember Me ID:', rememberMeId);
        console.log('Parent Remember Me ID:', parentRememberMeId);
        
        console.log('📧 Getting profile...');
        const profile = shareReceipt.getProfile();
        const email = profile.getEmailAddress().getValue();
        console.log('Email retrieved:', email);

        // Prepare data for Anvil
        const userData = {
            email: email,
            rememberMeId: rememberMeId,
            verificationDate: new Date().toISOString()
        };

        console.log('🚀 Sending to Anvil:', userData);
        
        // Send to Anvil
        const anvilResponse = await fetch('https://reliable-equatorial-heron.anvil.app/_/api/yka', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const responseData = await anvilResponse.json();
        console.log('Anvil Response:', responseData);

        if (!anvilResponse.ok || responseData.status === 'error') {
            throw new Error(responseData.message || 'Failed to save to Anvil');
        }

        // Send success HTML
       /*res.send(`
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
        `);*/
        
      
        res.redirect('http://myweb.com')

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

// Initialize before starting server
if (process.env.NODE_ENV === 'development') {
    // Use HTTPS in development
    const server = https.createServer(httpsOptions, app);
    server.listen(port, async () => {
        await initializeYotiClient();
        console.log(`Server running on https://localhost:${port}`);
    });
} else {
    // Use regular HTTP in production (Azure handles SSL termination)
    app.listen(port, async () => {
        await initializeYotiClient();
        console.log(`Server running on port ${port}`);
    });
}
