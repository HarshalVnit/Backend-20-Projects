const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

// 1. Initialize Express
const app = express();

// Tell Express to serve our HTML file to anyone who visits the website
app.use(express.static(path.join(__dirname, 'public')));

// 2. The Marriage: Create a core HTTP server out of Express
const server = http.createServer(app);

// Attach the WebSocket server to the exact same HTTP server!
const wss = new WebSocket.Server({ server });

// 3. The WebSocket Logic (Exact same as Phase 3)
wss.on('connection', (ws) => {
    console.log("🔌 New browser connected!");
    ws.send(JSON.stringify({ status: 'info', data: 'Connected to Compiler API.' }));

    ws.on('message', async (message) => {
        const userCode = message.toString();
        const fileName = `temp_${Date.now()}.js`; 
        await fs.writeFile(fileName, userCode);
        
        const startTime = Date.now();
        const child = spawn('node', [fileName]);

        // The Cage
        const cageTimer = setTimeout(() => {
            child.kill('SIGTERM');
            ws.send(JSON.stringify({ status: 'error', data: '\n🚨 SECURITY ALERT: Execution Timeout' }));
        }, 3000);

        // The Pulse (Live Streams)
        child.stdout.on('data', (data) => {
            ws.send(JSON.stringify({ status: 'output', data: data.toString() }));
        });

        child.stderr.on('data', (data) => {
            ws.send(JSON.stringify({ status: 'error', data: data.toString() }));
        });

        // The Cleanup
        child.on('close', (code) => {
            clearTimeout(cageTimer);
            const executionTime = Date.now() - startTime;
            ws.send(JSON.stringify({ 
                status: 'finished', 
                time: executionTime 
            }));
            fs.unlink(fileName).catch(console.error);
        });
    });
});

// 4. Start listening on Port 3000
server.listen(3000, () => {
    console.log("🚀 Code Compiler running on http://localhost:3000");
});