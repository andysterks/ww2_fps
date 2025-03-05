const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Serve static files from the current directory
app.use(express.static('.'));

// Create a Socket.IO server
const io = new Server(server);

// Store connected players
const players = new Map();

console.log('Starting server...');

// Handle new connections
io.on('connection', (socket) => {
    // Generate a unique ID for this player
    const playerId = socket.id;
    
    console.log(`New player connected: ${playerId}`);
    
    // Store the player connection
    players.set(playerId, {
        socket,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        isSprinting: false,
        lastUpdate: Date.now()
    });
    
    // Send the player their ID
    socket.emit('init', { id: playerId });
    
    // Send the new player information about all existing players
    players.forEach((player, id) => {
        if (id !== playerId) {
            socket.emit('player-joined', {
                id,
                position: player.position,
                rotation: player.rotation
            });
        }
    });
    
    // Broadcast to all other players that a new player has joined
    socket.broadcast.emit('player-joined', {
        id: playerId,
        position: players.get(playerId).position,
        rotation: players.get(playerId).rotation
    });
    
    // Handle player updates
    socket.on('player-update', (data) => {
        try {
            const player = players.get(playerId);
            if (player) {
                player.position = data.position;
                player.rotation = data.rotation;
                player.moveForward = data.moveForward;
                player.moveBackward = data.moveBackward;
                player.moveLeft = data.moveLeft;
                player.moveRight = data.moveRight;
                player.isSprinting = data.isSprinting;
                player.lastUpdate = Date.now();
                
                // Broadcast the update to all other players
                socket.broadcast.emit('player-update', {
                    id: playerId,
                    position: data.position,
                    rotation: data.rotation,
                    moveForward: data.moveForward,
                    moveBackward: data.moveBackward,
                    moveLeft: data.moveLeft,
                    moveRight: data.moveRight,
                    isSprinting: data.isSprinting
                });
            }
        } catch (error) {
            console.error('Error processing update:', error);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${playerId}`);
        
        // Remove the player
        players.delete(playerId);
        
        // Broadcast to all other players that this player has left
        io.emit('player-left', { id: playerId });
    });
});

// Clean up inactive players (those who haven't sent updates in a while)
setInterval(() => {
    const now = Date.now();
    const timeout = 30000; // 30 seconds
    
    players.forEach((player, id) => {
        if (now - player.lastUpdate > timeout) {
            console.log(`Player timed out: ${id}`);
            
            // Disconnect the socket
            if (player.socket.connected) {
                player.socket.disconnect(true);
            }
            
            // Remove the player
            players.delete(id);
            
            // Broadcast to all other players that this player has left
            io.emit('player-left', { id });
        }
    });
}, 10000); // Check every 10 seconds

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 