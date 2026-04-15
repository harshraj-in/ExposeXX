const fs = require('fs');

function replaceInFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/import axios from 'axios';/g, "import apiClient from '../api/apiClient';");
    content = content.replace(/axios\.get\('\/api\//g, "apiClient.get('/");
    content = content.replace(/axios\.post\('\/api\//g, "apiClient.post('/");
    content = content.replace(/axios\.get\(`\/api\//g, "apiClient.get(`/");
    content = content.replace(/axios\.post\(`\/api\//g, "apiClient.post(`/");
    fs.writeFileSync(path, content);
}

const pages = ['Home.jsx', 'TrackReport.jsx', 'Scoreboard.jsx', 'PublicMap.jsx', 'AIAdvisor.jsx'];
pages.forEach(p => replaceInFile('d:/harsh badwa/frontend/src/pages/' + p));

const comps = ['MapInsightPanel.jsx'];
comps.forEach(c => replaceInFile('d:/harsh badwa/frontend/src/components/' + c));

const apiFile = 'd:/harsh badwa/frontend/src/api/apiClient.js';
let apiContent = fs.readFileSync(apiFile, 'utf8');
apiContent = apiContent.replace("baseURL: import.meta.env.VITE_API_BASE_URL || '/api'", "baseURL: import.meta.env.VITE_API_BASE_URL || 'https://exposex-backend.onrender.com/api'");
fs.writeFileSync(apiFile, apiContent);
console.log("Everything updated!");
