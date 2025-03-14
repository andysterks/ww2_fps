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
            direction: playerData.direction || { x: 0, y: 0, z: 0 },
            verticalLook: playerData.verticalLook || 0,
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
        // Validate the data first
        if (!playerData || typeof playerData !== 'object') {
            console.error(`Invalid player data received from ${socket.id}:`, playerData);
            return;
        }

        // Update player data in our records
        if (players[socket.id]) {
            // Validate position before storing
            const isValidPosition = playerData.position && 
                                  typeof playerData.position.x === 'number' && !isNaN(playerData.position.x) &&
                                  typeof playerData.position.y === 'number' && !isNaN(playerData.position.y) &&
                                  typeof playerData.position.z === 'number' && !isNaN(playerData.position.z);
            
            // Validate direction vector instead of rotation
            const isValidDirection = playerData.direction && 
                                  typeof playerData.direction.x === 'number' && !isNaN(playerData.direction.x) &&
                                  typeof playerData.direction.y === 'number' && !isNaN(playerData.direction.y) &&
                                  typeof playerData.direction.z === 'number' && !isNaN(playerData.direction.z);
            
            // Update position if valid
            if (isValidPosition) {
                players[socket.id].position = playerData.position;
            } else if (playerData.position) {
                console.error(`Invalid position data received from ${socket.id}:`, playerData.position);
            }
            
            // Update direction if valid
            if (isValidDirection) {
                players[socket.id].direction = playerData.direction;
                
                // Log direction values occasionally to help with debugging
                if (Math.random() < 0.01) { // ~1% of updates
                    console.log(`Player ${socket.id} direction:`, playerData.direction);
                }
            } else if (playerData.direction) {
                console.error(`Invalid direction data received from ${socket.id}:`, playerData.direction);
                // Keep existing direction
            }
            
            // Handle vertical look for rifle aiming
            if (typeof playerData.verticalLook === 'number' && !isNaN(playerData.verticalLook)) {
                players[socket.id].verticalLook = playerData.verticalLook;
            }
            
            // Update movement flags
            players[socket.id].moveForward = playerData.moveForward || false;
            players[socket.id].moveBackward = playerData.moveBackward || false;
            players[socket.id].moveLeft = playerData.moveLeft || false;
            players[socket.id].moveRight = playerData.moveRight || false;
            players[socket.id].isSprinting = playerData.isSprinting || false;
            // Update aiming state
            players[socket.id].isAimingDownSights = playerData.isAimingDownSights || false;
            players[socket.id].timestamp = playerData.timestamp || Date.now();
            
            // Create a clean copy of the player data before broadcasting
            const cleanPlayerData = {
                id: socket.id,
                position: players[socket.id].position,
                direction: players[socket.id].direction,
                verticalLook: players[socket.id].verticalLook,
                moveForward: players[socket.id].moveForward,
                moveBackward: players[socket.id].moveBackward,
                moveLeft: players[socket.id].moveLeft,
                moveRight: players[socket.id].moveRight,
                isSprinting: players[socket.id].isSprinting,
                isAimingDownSights: players[socket.id].isAimingDownSights,
                timestamp: players[socket.id].timestamp
            };
            
            // Broadcast to all other players
            socket.broadcast.emit('playerUpdate', cleanPlayerData);
        }
    });
    
    // Handle player hit events
    socket.on('playerHit', (hitData) => {
        console.log(`Player ${hitData.targetId} was hit by ${socket.id}`);
        
        // Validate that both players exist
        if (players[socket.id] && players[hitData.targetId]) {
            // Send hit notification to the target player
            io.to(hitData.targetId).emit('hitByPlayer', {
                shooterId: socket.id,
                hitPosition: hitData.hitPosition,
                hitIntensity: hitData.hitIntensity || 1.0
            });
            
            // Broadcast hit event to all other players for visual effects
            socket.broadcast.emit('playerHitVisual', {
                shooterId: socket.id,
                targetId: hitData.targetId,
                hitPosition: hitData.hitPosition
            });
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