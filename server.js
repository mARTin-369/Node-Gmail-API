const express = require('express');
const app = express()
const controller = require('./controller')

app.use(express.json());

// First route to authorize the api to get permissions to access to the gmail account
app.get('/authorize-app', controller.authorizeApp)

// Callback re-direct for authentication token on signin
app.get('/oauth2callback', controller.oauth2callback)

// Get an array of unread emails
app.get('/get-unread-emails', controller.getUnreadEmails)

app.listen(3000, controller.startServer)