//Initi
const Yoti = require('yoti')
const fs = require('fs');
const CLIENT_SDK_ID = 'YOTI_CLIENT_SDK_ID'
const PEM_PATH = 'YOTI_KEY_FILE_PATH'
const PEM_KEY = fs.readFileSync(PEM_PATH)

const yotiClient = new Yoti.DigitalIdentityClient(CLIENT_SDK_ID, PEM_KEY)

//Build A Policy
//A policy is used to define what attributes are requested from the user. 
//You can use the policy builder to define what attributes are needed.
const {
    DigitalIdentityBuilders: {
      PolicyBuilder
    }
  } = require('yoti');
  
  const policy = new PolicyBuilder()
      // using a predefined method to add an attribute
      .withFullName()
          .withEmail()
      // if you wish the user to prove it's them by taking a selfie on share
      .withSelfieAuthentication()
      .build();


      //Specify the Session configuration
//The Session configuration is built using:
//The policy.
//The redirect URI for share completion. This is where the user will be redirected to after the share is completed. A receiptId query parameter will be added to the URL. You can use this to retrieve the user profile from the share.
//A subject Id (optional).
//A notification webhook (optional).
//Any extensions.

      const {
        DigitalIdentityBuilders: {
          ShareSessionNotificationBuilder,
          ShareSessionConfigurationBuilder
        }
      } = require('yoti');
      
      const notification = new ShareSessionNotificationBuilder()
              .withUrl("your-webhook-url")
              .withMethod("POST")
              .withHeader("Authorization", "<Bearer_token>") // Optional
              .withVerifiedTls(true) 	// Optional
              .build();
      
      const subject = {
            subject_id: 'some_subject_id_string',
      };
      
      const shareSessionConfig = new ShareSessionConfigurationBuilder()
          .withRedirectUri("/your-callback-url")
          .withPolicy(policy)
          .withSubject(subject)
              .withNotification(notification)
          .build();
//SCreate A Share Session
          yotiClient.createShareSession(shareSessionConfig)
          .then((shareSessionResult) => {
              const shareSession = shareSessionResult;
              const shareSessionId = shareSession.getId();
          }).catch((error) => {
            console.error(error.message);
          });


