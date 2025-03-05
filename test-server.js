const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

// Serve static files from the src directory
app.use(express.static(path.join(__dirname, 'src')));

// Serve node_modules for Three.js
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve the root directory for index.html
app.use(express.static(path.join(__dirname)));

// Route for the tools landing page
app.get('/tools', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index-tools.html'));
});

// Route for the simple test page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'test.html'));
});

// Route for the diagnostic tool
app.get('/diagnostic', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'diagnostic.html'));
});

// Route for the code analyzer
app.get('/analyzer', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'analyzer.html'));
});

// Route for the browser compatibility checker
app.get('/browser-check', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'browser-check.html'));
});

// Route for the original game
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Test server running at http://localhost:${port}`);
    console.log(`Open your browser to http://localhost:${port}/tools to access all diagnostic tools`);
    console.log(`Open your browser to http://localhost:${port} to view the simple test scene`);
    console.log(`Open your browser to http://localhost:${port}/diagnostic to run the diagnostic tool`);
    console.log(`Open your browser to http://localhost:${port}/analyzer to run the code analyzer`);
    console.log(`Open your browser to http://localhost:${port}/browser-check to run the browser compatibility checker`);
    console.log(`Open your browser to http://localhost:${port}/game to run the original game`);
}); 