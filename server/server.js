const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize Socket.IO with updated configuration
const io = new Server(httpServer, {
    path: '/socket.io/',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    connectTimeout: 20000,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["content-type"]
    },
    transports: ['websocket', 'polling']
});

// Store connected players
const players = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Handle player join
    socket.on('playerJoin', (playerData) => {
        console.log(`Player joined: ${socket.id}`, playerData);
        
        // Store player data
        players[socket.id] = {
            id: socket.id,
            position: playerData.position || { x: 0, y: 0, z: 0 },
            rotation: playerData.rotation || { x: 0, y: 0, z: 0 },
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            isSprinting: false,
            isAimingDownSights: false,
            timestamp: Date.now()
        };
        
        // Send existing players to the new player
        const existingPlayers = Object.values(players).filter(p => p.id !== socket.id);
        console.log('Sending existing players to new player:', existingPlayers);
        socket.emit('existingPlayers', existingPlayers);
        
        // Notify other players about the new player
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });
    
    // Handle player updates
    socket.on('playerUpdate', (playerData) => {
        // Update player data in our records
        if (players[socket.id]) {
            // Update position and rotation
            players[socket.id].position = playerData.position;
            players[socket.id].rotation = playerData.rotation;
            
            // Update movement flags
            players[socket.id].moveForward = playerData.moveForward || false;
            players[socket.id].moveBackward = playerData.moveBackward || false;
            players[socket.id].moveLeft = playerData.moveLeft || false;
            players[socket.id].moveRight = playerData.moveRight || false;
            players[socket.id].isSprinting = playerData.isSprinting || false;
            // Update aiming state
            players[socket.id].isAimingDownSights = playerData.isAimingDownSights || false;
            players[socket.id].timestamp = playerData.timestamp || Date.now();
            
            // Broadcast to all other players
            socket.broadcast.emit('playerUpdate', players[socket.id]);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`Player disconnected: ${socket.id}, reason: ${reason}`);
        
        // Remove player from our records
        delete players[socket.id];
        
        // Notify other players
        io.emit('playerLeft', socket.id);
    });
});

// Error handling for the io server
io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
});

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`For local access, use: http://localhost:${PORT}`);
    console.log('For network access, use your computer\'s IP address');
}); 