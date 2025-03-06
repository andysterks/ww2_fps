import { io } from 'socket.io-client';
import * as THREE from 'three';
import { createGermanSoldier } from '../../models/characters/german_soldier';

/**
 * NetworkManager class handles all multiplayer networking functionality
 */
export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.players = new Map();
        this.lastUpdateTime = performance.now();
        this.updateInterval = 50; // Send updates every 50ms
        
        // Initialize socket connection
        this.init();
    }
    
    init() {
        // Connect to the Socket.IO server
        this.socket = io('/', {
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        });
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.socket.emit('request-players');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.players.clear();
        });
        
        // Player events
        this.socket.on('players-list', (playersList) => {
            console.log('Received players list:', playersList);
            this.updatePlayersList(playersList);
        });
        
        this.socket.on('player-joined', (data) => {
            console.log('Player joined:', data);
            this.addPlayer(data);
        });
        
        this.socket.on('player-left', (data) => {
            console.log('Player left:', data);
            this.removePlayer(data.id);
        });
        
        this.socket.on('player-update', (data) => {
            this.updatePlayer(data);
        });
        
        this.socket.on('player-action', (data) => {
            this.handlePlayerAction(data);
        });
    }
    
    updatePlayersList(playersList) {
        // Clear existing players
        this.players.clear();
        
        // Add each player
        playersList.forEach(playerData => {
            if (playerData.id !== this.socket.id) {
                this.addPlayer(playerData);
            }
        });
    }
    
    addPlayer(data) {
        if (data.id === this.socket.id) return;
        
        // Create German soldier model
        const playerModel = createGermanSoldier();
        playerModel.scale.set(1.5, 1.5, 1.5); // Scale up the model a bit
        
        // Set initial position and rotation
        if (data.position) {
            playerModel.position.set(
                data.position.x || 0,
                data.position.y || 0,
                data.position.z || 0
            );
        }
        
        if (data.rotation) {
            playerModel.rotation.set(
                data.rotation.x || 0,
                data.rotation.y || 0,
                data.rotation.z || 0
            );
        }
        
        // Add to scene
        this.game.scene.add(playerModel);
        
        // Store player data
        this.players.set(data.id, {
            mesh: playerModel,
            lastUpdate: performance.now(),
            position: new THREE.Vector3().copy(playerModel.position),
            rotation: new THREE.Euler().copy(playerModel.rotation),
            targetPosition: new THREE.Vector3().copy(playerModel.position),
            targetRotation: new THREE.Euler().copy(playerModel.rotation),
            quaternion: new THREE.Quaternion(),
            targetQuaternion: new THREE.Quaternion()
        });
    }
    
    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            this.game.scene.remove(player.mesh);
            this.players.delete(id);
        }
    }
    
    updatePlayer(data) {
        const player = this.players.get(data.id);
        if (player) {
            // Update target position
            if (data.position) {
                player.targetPosition.set(
                    data.position.x || player.targetPosition.x,
                    data.position.y || player.targetPosition.y,
                    data.position.z || player.targetPosition.z
                );
            }
            
            // Update target rotation
            if (data.rotation) {
                player.targetRotation.set(
                    data.rotation.x || player.targetRotation.x,
                    data.rotation.y || player.targetRotation.y,
                    data.rotation.z || player.targetRotation.z
                );
                // Convert Euler to Quaternion for smoother interpolation
                player.targetQuaternion.setFromEuler(player.targetRotation);
            }
            
            player.lastUpdate = performance.now();
        }
    }
    
    handlePlayerAction(data) {
        const player = this.players.get(data.id);
        if (player) {
            // Handle player actions (shooting, etc.)
            // TODO: Implement action handling
        }
    }
    
    update(deltaTime) {
        // Send local player updates
        const currentTime = performance.now();
        if (currentTime - this.lastUpdateTime > this.updateInterval) {
            this.sendUpdate();
            this.lastUpdateTime = currentTime;
        }
        
        // Update remote players with interpolation
        this.players.forEach(player => {
            const t = Math.min((currentTime - player.lastUpdate) / this.updateInterval, 1);
            
            // Interpolate position
            player.mesh.position.lerpVectors(player.position, player.targetPosition, t);
            player.position.copy(player.mesh.position);
            
            // Interpolate rotation using quaternions for smoother rotation
            player.quaternion.slerpQuaternions(
                player.mesh.quaternion,
                player.targetQuaternion,
                t
            );
            player.mesh.quaternion.copy(player.quaternion);
            
            // Update Euler angles from quaternion
            player.rotation.setFromQuaternion(player.quaternion);
        });
    }
    
    sendUpdate() {
        if (!this.socket || !this.game.player) return;
        
        // Get camera holder position and rotation
        const position = this.game.player.cameraHolder.position;
        const rotation = this.game.player.cameraHolder.rotation;
        
        // Send update to server
        this.socket.emit('player-update', {
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            rotation: {
                x: rotation.x,
                y: rotation.y,
                z: rotation.z
            },
            moveForward: this.game.player.moveForward,
            moveBackward: this.game.player.moveBackward,
            moveLeft: this.game.player.moveLeft,
            moveRight: this.game.player.moveRight,
            isSprinting: this.game.player.isSprinting
        });
    }
}

export default NetworkManager; 