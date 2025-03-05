const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'sounds'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Endpoint to save sound files
app.post('/save-sound', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log(`File saved: ${req.file.path}`);
    res.json({ success: true, path: req.file.path });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create HTTP server
const server = require('http').createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true // Allow Engine.IO 3 compatibility
});

// Store connected players
const players = new Map();

console.log('Socket.IO server initialized');

// Handle new connections
io.on('connection', (socket) => {
    // Generate a unique ID for this player
    const playerId = uuidv4();
    
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
    socket.emit('init', {
        id: playerId
    });
    
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
    
    // Handle updates from this player
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
        io.emit('player-left', {
            id: playerId
        });
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
            player.socket.disconnect(true);
            
            // Remove the player
            players.delete(id);
            
            // Broadcast to all other players that this player has left
            io.emit('player-left', {
                id
            });
        }
    });
}, 10000); // Check every 10 seconds

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
