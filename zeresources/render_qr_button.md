Render QR button
Yoti provides a QR/button generation script to be included in your HTML file. In the examples below, this script has been added to the head of the HTML document.

To render the Yoti QR or button, please take a look at our range of options below and pick a configuration.

The JavaScript library called Webshare needs to be invoked – you can do this by calling Yoti.createWebShare() in the body of your HTML document. For the config, you will need to specify a ‘domId’ so the script knows where to add the Yoti button on your page.

The Yoti button requires the hosting page to be accessed via HTTPS, so please make sure that your web application has HTTPS enabled.

Name	Purpose	Required
name	Identifies the Yoti share on the page.	✅
domID	Specifies the ID of the DOM node where Yoti webshare has to be rendered.	✅
clientSdkId	Identifies your Yoti Hub application. This value can be found in the Hub, within your application section, in the keys tab.	✅
hooks	Object for specifying the functions hooks to be called by Yoti webshare.	✅
hooks - sessionIdResolver	Hook Function to resolve the Session ID generated from the creating a Share session using the Yoti backend SDK.	✅
hooks - errorListener	Allows you to listen to error messages from the Webshare QR/button.	❌
hooks - completionHandler	Allows you to retrieve the Share Receipt ID within the hook function and prevents the automatic redirection to Session Redirect URI.	❌
locale	Specifies the the localisation for Yoti QR/button. Default is en.	❌
skinId	The theme to be used for the webshare rendering.	❌
Finally, the domain and port pair where the button is deployed (i.e. https://localhost:8000) must match the one that you have configured in Yoti Hub. This prevents other web sites from embedding your Yoti button

Modal QR
The modal QR code option has a button which when clicked opens a modal pop out window with the QR code present. There are three tabs, describing how to scan the QR code, The QR code & attributes to be shared and about Yoti.


<head>
  <script src="https://www.yoti.com/share/client/v2"></script>
</head>

<body>
  <!-- Yoti element will be rendered inside this DOM node -->
  <div id="xxx"></div>

  <!-- This script snippet will also be required in your HTML body -->
  <script>
    const loadYoti = async () => {
      const { Yoti } = window;
      if (Yoti) {
        console.info('Waiting for Yoti...');
        await Yoti.ready()
        console.info('Yoti is now ready');
      } else {
        console.error('Yoti client was not found!');
      }
    }

    const createYotiWebShare = async () => {
      const { Yoti } = window;
      if (Yoti) {
        await Yoti.createWebShare({
          name: 'test-share',
          domId: 'xxx',
          sdkId: 'xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          hooks: {
            sessionIdResolver: onSessionIdResolver,
            errorListener: onErrorListener
          }
        })
      }
    }

    async function onSessionIdResolver() {
      // Make a call to your backend, and return a 'sessionId'
      const response = await fetch('https://localhost:3000/sessions', { method: 'POST' });
      const data = await response.json();
      return data.sessionId;
    }

    function onErrorListener(...data) {
      console.warn('onErrorListener:', ...data);
    }

    const start = async () => {
      await loadYoti();
      await createYotiWebShare();
    }

    start().catch((e) => console.error(`Could not create Yoti WebShare: `, e));
  </script>
</body>

Create a share session
First, you need to create a Yoti share session by specifying a policy and other session configuration. In order to retrieve the share receipt via a webhook endpoint, you have to enable the notifications.

The process to create a session is described here.

Request a QR code
In order to create a Yoti QR, you have to request a new QR code from the share session. To do this, use the following code:

yotiClient.createShareQrCode(sessionId)
  .then((shareQrCode) => {
  	const qrCodeId = shareQrCode.getId();
		const qrCodeUri = shareQrCode.getUri();
  }).catch((error) => {
    console.error(error.message);
  });

  A Yoti QR code contains an ID and URI and is returned in following form:

  {
    "id": "qr.v2.TSicHeyZQ1ODdtX0XSXEpQ",
    "uri": "https://code.yoti.com/CAEaHHFyLnYyLlRTaWNIZXlaUTFPRGR0WDBYU1hFcFEwAg=="
}

Render the Yoti QR
The above QR code URI must be transformed into a Yoti QR before it can be scanned with the Yoti app. Yoti provides a simple API endpoint to transform this URI into an official Yoti QR image - This is important to establish trust between your user base and Yoti.


POST https://api.yoti.com/api/v1/qrcodes/image

Header	Value	Description
Accept	
The follow Accept values can be provided in the header

image/svg+xml
image/png
Returns a formatted QR code as an svg or png
Content-Type	application/json	Sets the correct content type

The request body should be formed as JSON, specifying a URL (mandatory) and an image size (optional).

{
	"url": "https://code.yoti.com/<YotiCode>"
  "size": 200 // Optional
}

Field	Type	Value
url	string	This is the URI returned from requesting a Yoti QR
size	number	This is an optional parameter for specifying QR size
skinId	string	Allows the QR to be displayed in either a Yoti only theme, or Digital ID Connect brand. DIDC is only applicable for UK usage.

Error codes

Code	Description	Resolution
400	Missing url field in the request body	Ensure to POST a JSON body containing a url
406	Empty Accept header	Send a request Accept header with the required image return type
406	An Accept header was sent with an invalid return type	
Ensure the Accept header is one of

image/svg+xml
image/png

Receive the Receipt id
After the user scans a Yoti QR and completes the share, a webhook notification is sent to the endpoint specified in the Share session. This will be trigged in the case of either a Completed or Failed share. The JSON notification will contain the receipt id and an optional error code. Example of these are provided here.

Retrieve the profile
Now, you can use the receipt id to decrypt the user share in your backend and retrieve the profile attributes. This process is explained on this page.

Completion handler
Yoti webshare provides a way to avoid automatic redirection on share completion by using a hook function. This can also be used to retrieve the Receipt ID and run your own code logic. For example - you can send the Receipt ID to your backend and use it to decrypt the share receipt. Based on the shared user attributes, you can also render your own UI which is especially helpful for non-browser integrations.

Javascript
hooks: {
  // optional, prevents redirection when specified
  completionHandler: (receiptId) => {
    // can send the `receiptId` to the server or do something else
    console.log(receiptId);
  },   
},
Copy
Query parameters
You can append query params to the landing page URL that displays the Yoti button. These will be added to the callback URL.

For example if you load the landing page containing the Yoti button as follows:

https://example.com/?iso=test&user_id=6667

The query parameters (iso=test&user_id=6667) will be returned in the callback URL.


