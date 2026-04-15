const fs = require('fs');
fetch('https://exposex-frontend.onrender.com/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!match) return console.log('No JS bundle found in HTML.');
    const jsUrl = 'https://exposex-frontend.onrender.com' + match[1];
    console.log('Fetching JS bundle:', jsUrl);
    return fetch(jsUrl);
  })
  .then(r => r.text())
  .then(js => {
    // Check if the JS contains the literal Render backend URL
    const hasRenderUrl = js.includes('exposex-backend.onrender.com');
    console.log('Contains Render Backend URL:', hasRenderUrl);
    // Check if it's falling back to localhost or /api
    const hasLocalhost = js.includes('localhost:5000');
    console.log('Contains Localhost:', hasLocalhost);
  })
  .catch(console.error);
