const {google} = require('googleapis');
const {promisify} = require('util');
const gmail = google.gmail('v1');
const fs = require('fs');

const readFileAsync = promisify(fs.readFile);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
let content, credentials, clientSecret, clientId, redirectUrl, oauth2Client, authUrl;

module.exports.startServer = async () => {
    // extract gmail api credentials
    content = await readFileAsync(__dirname + '/client_secret.json');
    credentials = JSON.parse(content);
    clientSecret = credentials.web.client_secret;
    clientId = credentials.web.client_id;
    redirectUrl = credentials.web.redirect_uris[0];
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

    authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    console.log('Server Started ....')
}

module.exports.authorizeApp = async (req, res) => {
    res.json({ message: "Authorize this app by visiting this url", authUrl: authUrl})
    // console.log("Authorization url sent");
}

module.exports.oauth2callback = async (req, res) => {
    code = req.query.code
    if(code) {
        // console.log("Token received")
        try {
            const {tokens} = await oauth2Client.getToken(code)
            res.json({ message: 'Authentication successful', tokens: tokens })
        } catch(err) {
            res.status(500).json({ message: err.message })
            console.log('Error while trying to retrieve access token', err);
        }
    } else {
        res.status(403).json({ message: "Authentication failed" })
    }
}

module.exports.getUnreadEmails = async (req, res) => {
    tokens = {
        access_token: req.headers['access-token'],
        refresh_token: req.headers['refresh-token']
    }
    
    try {
        // console.log(tokens);
        oauth2Client.credentials = tokens;

        // Fetch ids of unread messages
        let mails = await gmail.users.messages.list({
            auth: oauth2Client,
            userId: "me",
            q: "is:unread",
            maxResults: 10
        });

        // Fetch details from message ids
        let messages = mails.data.messages
        messages = await Promise.all(
            messages.map(async (message) => {
                let res = await gmail.users.messages.get({
                    auth: oauth2Client,
                    userId: "me",
                    id: message.id,
                    fields: "id, labelIds, snippet"
                });
                return res.data
            })
        )
        res.json(messages)
    } catch(err) {
        res.status(500).json({ message: err.message })
        console.log('Error in getting emails: ', err);
    }  
}