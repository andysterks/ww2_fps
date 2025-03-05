const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);

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
        methods: ["GET", "POST"]
    },
    transports: ['polling', 'websocket']
});

// Store connected players
const players = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Initialize player data
    players.set(socket.id, {
        id: socket.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        isSprinting: false
    });
    
    // Send current players list when requested
    socket.on('request-players', () => {
        console.log('Player requested players list');
        const playersList = Array.from(players.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
        console.log('Sending players list:', playersList);
        socket.emit('players-list', playersList);
    });
    
    // Handle player updates
    socket.on('player-update', (data) => {
        // Update player data in our records
        const player = players.get(socket.id);
        if (player) {
            Object.assign(player, data);
            
            // Broadcast to all other players
            socket.broadcast.emit('player-update', {
                id: socket.id,
                ...data
            });
        }
    });
    
    // Handle player actions (shooting, etc.)
    socket.on('player-action', (data) => {
        socket.broadcast.emit('player-action', {
            id: socket.id,
            ...data
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`Player disconnected: ${socket.id}, reason: ${reason}`);
        
        // Remove player from our records
        players.delete(socket.id);
        
        // Notify other players
        io.emit('player-left', { id: socket.id });
    });
    
    // Notify other players about the new player
    socket.broadcast.emit('player-joined', {
        id: socket.id,
        position: players.get(socket.id).position,
        rotation: players.get(socket.id).rotation
    });
});

// Error handling for the io server
io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 