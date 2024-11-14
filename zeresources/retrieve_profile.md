Retrieve the profile
Retrieving a profile involves retrieving a Receipt ID, and decrypting it to get the user profile.

After the user scans a QR code and share their profile, the webshare script will perform an redirection from the QR code page to your redirect URI, passing the receipt Id as a query string parameter. This receipt id is URL encoded and should be decoded before being used with the Yoti SDK.

For a Redirect URI set as https://your-redirect-uri in the Share session configuration, the returned URL would look like the following: https://your-redirect-uri?receiptId=.

Yoti will automatically prefix this URL with domain name specified in your Yoti Hub app.

When your web application receives the receipt id via the defined endpoint as a query string parameter, you can easily retrieve the user profile. The user profile object provides a set of user attributes corresponding to the attributes that you request in the share session.

SDK process
When you pass the receipt id to the Yoti Identity Client object, the SDK does the following:

Decrypts the wrapped receipt key attribute, using the application private key.
Uses the decrypted key to decrypt the other party profile content attribute.
Decodes the decrypted profile and returns it to your application.
The profile attributes are central to the SDK and allow you to see and work with the information that your users share with you.

Webhook notifications
If the webhook endpoint is provided during the Share session creation, the notifications will be sent for each share performed by the end-user. These will also contain the Receipt ID that can be used to retrieve the decrypted user profile.

The notifications will be sent in the following format:

COMPLETED:

JSON
{
    "id": "ss.v2.ChZV8h5GZTlLT1JrSzc5QkVMc1F0a9JR3gkyLmxkNS5nYnI=",
    "status": "COMPLETED",
    "created": "2023-08-01T13:21:06.389Z",
    "updated": "2023-08-01T13:22:48.284Z",
    "receipt": {
        "id": "RPA4ZvOZ/xIRhIeHh9Jw9HNpEK//610kEpCbZmQwNZlZ6H6w41VUlDQWn+4p7Lk"
    }
}
Copy
FAILED:

JSON
{
    "id": "ss.v2.ChYwYk5mSG9sdlJSbWNFQ1VJHw4kYlZ3EgkzLmxkNS5nYnI=",
    "status": "FAILED",
    "created": "2023-08-02T08:33:23.326Z",
    "updated": "2023-08-02T08:34:40.885Z",
    "receipt": {
      "id": "FYWI8nE8GAo8xMBVprPCG78J4TaWsW+prX5DEj9WN0eEROlg7avAP/ZAlJmlP3C1",
      "error": "MANDATORY_DOCUMENT_NOT_PROVIDED"
    }
}
Copy
Session status
A webhook notification is triggered based on the Session state, which could be one of the following:

Status	Description
COMPLETED	The share associated with the session was completed (with success receipt available).
FAILED	The share associated with the session was completed (with failure receipt available).
CANCELLED	Mobile app requested the session to be cancelled (before share was completed).
EXPIRED	The share associated with the session was never completed (no receipt available).
ERROR	A "catch-all" status for unexpected/unrecoverable errors that might happen during execution (e.g. we get a receipt but the service fails to parse it, required parameter not present).
Type to search, ESC to discardType to search, ESC to discardType to search, ESC to discard
Was