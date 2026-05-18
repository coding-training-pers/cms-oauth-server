const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://coding-training-pers.github.io/ourlifeabroad/admin/';

app.get('/auth', (req, res) => {
  const authURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user&redirect_uri=${encodeURIComponent(REDIRECT_URL)}`;
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
    
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}',
              '${REDIRECT_URL}'
            );
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});

app.listen(PORT, () => {
  console.log(`OAuth server listening on port ${PORT}`);
});