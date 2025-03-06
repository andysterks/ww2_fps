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
        // Validate and sanitize data
        const validatedData = {
            id: socket.id,
            position: data.position ? {
                x: Number(data.position.x) || 0,
                y: Number(data.position.y) || 0,
                z: Number(data.position.z) || 0
            } : null,
            rotation: data.rotation ? {
                x: Number(data.rotation.x) || 0,
                y: Number(data.rotation.y) || 0,
                z: Number(data.rotation.z) || 0
            } : null,
            moveForward: Boolean(data.moveForward),
            moveBackward: Boolean(data.moveBackward),
            moveLeft: Boolean(data.moveLeft),
            moveRight: Boolean(data.moveRight),
            isSprinting: Boolean(data.isSprinting)
        };

        // Update player data in our records
        const player = players.get(socket.id);
        if (player) {
            Object.assign(player, validatedData);
            
            // Broadcast to all other players
            socket.broadcast.emit('player-update', validatedData);
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
const HOST = '0.0.0.0'; // Listen on all network interfaces
httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log('For local access, use: http://localhost:${PORT}');
    console.log('For network access, use your computer\'s IP address');
}); 