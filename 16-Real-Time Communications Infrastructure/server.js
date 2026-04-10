const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // Import Socket.io
const path = require('path');

// 1. Initialize Express and the HTTP Server
const app = express();
const server = http.createServer(app);

// 2. Initialize Socket.io and attach it to the HTTP server
const io = new Server(server);//for phase 1 we are currently working on one single server,but in future we will work on rooms .

// Serve the static frontend files
app.use(express.static(path.join(__dirname, 'public')));// This will serve index.html and any other static assets in the 'public' folder

// 3. Import our custom Socket logic and pass the 'io' engine to it
const socketHandler = require('./sockets/socketHandler');
socketHandler(io);

// 
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Secure Messaging Server running on http://localhost:${PORT}`);
});