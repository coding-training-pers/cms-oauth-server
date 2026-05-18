const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const CMS_URL = process.env.REDIRECT_URL || 'https://coding-training-pers.github.io/ourlifeabroad/admin/';

// L'URL de callback doit pointer vers CE serveur, pas vers le CMS
const CALLBACK_URL = `https://ourlifeabroad-oauth.onrender.com/callback`;

app.get('/auth', (req, res) => {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user&redirect_uri=${encodeURIComponent(CALLBACK_URL)}`;
  res.redirect(authURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  
  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const token = tokenResponse.data.access_token;
    
    // Format correct pour Decap CMS
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Authenticating...</title>
        </head>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                console.log("Received message:", e);
                window.opener.postMessage(
                  "authorization:github:success:" + JSON.stringify({
                    token: "${token}",
                    provider: "github"
                  }),
                  e.origin
                );
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:github", "*");
            })();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});