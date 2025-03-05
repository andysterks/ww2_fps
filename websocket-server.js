const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Store connected players
const players = new Map();

console.log('WebSocket server started on port 8080');

// Handle new connections
wss.on('connection', (ws) => {
    // Generate a unique ID for this player
    const playerId = uuidv4();
    
    console.log(`New player connected: ${playerId}`);
    
    // Store the player connection
    players.set(playerId, {
        ws,
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
    ws.send(JSON.stringify({
        type: 'init',
        id: playerId
    }));
    
    // Send the new player information about all existing players
    players.forEach((player, id) => {
        if (id !== playerId) {
            ws.send(JSON.stringify({
                type: 'player-joined',
                id,
                position: player.position,
                rotation: player.rotation
            }));
        }
    });
    
    // Broadcast to all other players that a new player has joined
    broadcastToOthers(playerId, {
        type: 'player-joined',
        id: playerId,
        position: players.get(playerId).position,
        rotation: players.get(playerId).rotation
    });
    
    // Handle messages from this player
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Update player data
            if (data.type === 'update') {
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
                    broadcastToOthers(playerId, {
                        type: 'player-update',
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
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`);
        
        // Remove the player
        players.delete(playerId);
        
        // Broadcast to all other players that this player has left
        broadcastToAll({
            type: 'player-left',
            id: playerId
        });
    });
});

// Broadcast a message to all players except the specified one
function broadcastToOthers(excludePlayerId, message) {
    players.forEach((player, id) => {
        if (id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

// Broadcast a message to all players
function broadcastToAll(message) {
    players.forEach((player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

// Clean up inactive players (those who haven't sent updates in a while)
setInterval(() => {
    const now = Date.now();
    const timeout = 30000; // 30 seconds
    
    players.forEach((player, id) => {
        if (now - player.lastUpdate > timeout) {
            console.log(`Player timed out: ${id}`);
            
            // Close the connection
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.close();
            }
            
            // Remove the player
            players.delete(id);
            
            // Broadcast to all other players that this player has left
            broadcastToAll({
                type: 'player-left',
                id
            });
        }
    });
}, 10000); // Check every 10 seconds 