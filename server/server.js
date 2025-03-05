const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize Socket.IO
const io = new Server(httpServer, {
    path: '/socket.io/',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    connectTimeout: 20000,
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:8080", "http://127.0.0.1:8080"],
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Store connected players
const players = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Send current players list to new player
    socket.on('request-players', () => {
        const playersList = Array.from(players.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
        socket.emit('players-list', playersList);
    });
    
    // Handle player updates
    socket.on('player-update', (data) => {
        // Update player data
        players.set(socket.id, data);
        
        // Broadcast to all other players
        socket.broadcast.emit('player-update', {
            id: socket.id,
            ...data
        });
    });
    
    // Handle player actions (shooting, etc.)
    socket.on('player-action', (data) => {
        // Broadcast the action to all other players
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
        io.emit('player-left', socket.id);
    });
    
    // Error handling
    socket.on('error', (error) => {
        console.error(`Socket ${socket.id} error:`, error);
    });
    
    // Notify other players about the new player
    socket.broadcast.emit('player-joined', {
        id: socket.id
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