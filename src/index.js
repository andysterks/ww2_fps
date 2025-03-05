import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { io } from 'socket.io-client';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM loaded, initializing game...");
        // Create a simple Three.js scene directly
        const simpleGame = new SimpleGame();
    } catch (error) {
        console.error("Error initializing game:", error);
        // Display error on screen for debugging
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.color = 'red';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.zIndex = '1000';
        errorDiv.textContent = `Game initialization error: ${error.message}`;
        document.body.appendChild(errorDiv);
    }
});

// Player class to manage individual player instances
class Player {
    constructor(id, game, isLocal = false, initialPosition = { x: 0, y: 0, z: 0 }) {
        this.id = id;
        this.game = game;
        this.isLocal = isLocal;
        
        // Position and rotation
        this.position = new THREE.Vector3(initialPosition.x, initialPosition.y, initialPosition.z);
        this.rotation = new THREE.Euler(0, 0, 0);
        
        // For interpolation
        this.targetPosition = new THREE.Vector3(initialPosition.x, initialPosition.y, initialPosition.z);
        this.targetRotation = new THREE.Euler(0, 0, 0);
        
        // 3D model
        this.model = null;
        
        // Animation properties
        this.legSwing = 0;
        this.armSwing = 0;
        
        // Movement flags for animation
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
    }

    // Create the player model (German soldier)
    createModel() {
        // Create a group to hold all player parts
        this.model = new THREE.Group();
        
        // Materials
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
        const uniformMaterial = new THREE.MeshLambertMaterial({ color: 0x5d5d5d }); // Field gray for German uniform
        const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a }); // Darker gray for helmet
        
        // Head (slightly larger than a standard LEGO head for better visibility)
        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.4, 8),
            skinMaterial
        );
        head.position.y = 1.6;
        head.name = 'head';
        this.model.add(head);
        
        // Helmet (German Stahlhelm style)
        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            helmetMaterial
        );
        helmet.position.y = 1.8;
        helmet.name = 'helmet';
        this.model.add(helmet);
        
        // Helmet brim
        const helmetBrim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8),
            helmetMaterial
        );
        helmetBrim.position.y = 1.65;
        helmetBrim.name = 'helmetBrim';
        this.model.add(helmetBrim);
        
        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.4),
            uniformMaterial
        );
        torso.position.y = 1.1;
        torso.name = 'torso';
        this.model.add(torso);
        
        // Belt
        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.1, 0.45),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        belt.position.y = 0.75;
        belt.name = 'belt';
        this.model.add(belt);
        
        // Left arm
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.6, 0.25),
            uniformMaterial
        );
        leftArm.position.set(0.525, 1.1, 0);
        leftArm.name = 'leftArm';
        this.model.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.6, 0.25),
            uniformMaterial
        );
        rightArm.position.set(-0.525, 1.1, 0);
        rightArm.name = 'rightArm';
        this.model.add(rightArm);
        
        // Left leg
        const leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.7, 0.3),
            uniformMaterial
        );
        leftLeg.position.set(0.2, 0.35, 0);
        leftLeg.name = 'leftLeg';
        this.model.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.7, 0.3),
            uniformMaterial
        );
        rightLeg.position.set(-0.2, 0.35, 0);
        rightLeg.name = 'rightLeg';
        this.model.add(rightLeg);
        
        // Add a simple rifle (Kar98k style)
        const rifle = new THREE.Group();
        rifle.name = 'rifle';
        
        // Rifle body
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 1.2),
            new THREE.MeshLambertMaterial({ color: 0x5c2e00 })
        );
        rifleBody.position.z = 0.6;
        rifle.add(rifleBody);
        
        // Rifle barrel
        const rifleBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        rifleBarrel.rotation.x = Math.PI / 2;
        rifleBarrel.position.z = 1.1;
        rifle.add(rifleBarrel);
        
        // Position the rifle in the right hand
        rifle.position.set(-0.6, 1.1, 0.2);
        rifle.rotation.y = Math.PI / 4;
        this.model.add(rifle);
        
        // Add the model to the scene
        if (this.game && this.game.scene) {
            this.game.scene.add(this.model);
        }
        
        // If this is the local player, hide the model since we're in first person
        if (this.isLocal) {
            this.model.visible = false;
        }
        
        // Set initial position
        this.model.position.copy(this.position);
        this.model.position.y = 0; // Keep y at 0 to ensure feet are on ground
        this.model.rotation.y = this.rotation.y;
    }

    // Update player position and rotation based on controls (for local player)
    // or based on network data (for remote players)
    update(delta) {
        if (this.isLocal) {
            // Local player's position is controlled by the camera/controls
            // We just need to update our stored position for network sync
            if (this.game && this.game.camera) {
                this.position.copy(this.game.camera.position);
                this.rotation.y = this.game.camera.rotation.y;
            }
        } else {
            // Remote player - interpolate towards target position for smoother movement
            const LERP_FACTOR = 0.2; // Adjust for smoother/faster interpolation
            
            // Interpolate position
            this.position.lerp(this.targetPosition, LERP_FACTOR);
            
            // Interpolate rotation (simple Y rotation for now)
            this.rotation.y += LERP_FACTOR * ((this.targetRotation.y - this.rotation.y + Math.PI) % (Math.PI * 2) - Math.PI);
            
            // Animate the model if it exists
            if (this.model) {
                // Determine if the player is moving based on movement flags
                const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
                
                // Only animate if the player is moving
                if (isMoving) {
                    // Calculate animation speed based on whether sprinting
                    const animSpeed = this.isSprinting ? 15 : 10;
                    
                    // Update leg and arm swing based on a sine wave
                    this.legSwing += delta * animSpeed;
                    this.armSwing = this.legSwing;
                    
                    // Apply animations to the model parts
                    if (this.model.children) {
                        this.model.children.forEach(part => {
                            if (part.name === 'leftLeg') {
                                part.rotation.x = Math.sin(this.legSwing) * 0.5;
                            } else if (part.name === 'rightLeg') {
                                part.rotation.x = Math.sin(this.legSwing + Math.PI) * 0.5;
                            } else if (part.name === 'leftArm') {
                                part.rotation.x = Math.sin(this.armSwing + Math.PI) * 0.5;
                            } else if (part.name === 'rightArm') {
                                part.rotation.x = Math.sin(this.armSwing) * 0.5;
                            }
                        });
                    }
                } else {
                    // Reset animations if not moving
                    if (this.model.children) {
                        this.model.children.forEach(part => {
                            if (['leftLeg', 'rightLeg', 'leftArm', 'rightArm'].includes(part.name)) {
                                part.rotation.x = 0;
                            }
                        });
                    }
                }
                
                // Update the model's position and rotation
                this.model.position.copy(this.position);
                this.model.position.y = 0; // Keep y at 0 to ensure feet are on ground
                this.model.rotation.y = this.rotation.y;
            }
        }
    }
    
    // Set movement flags based on input (for local player)
    setMovementFlags(forward, backward, left, right, sprinting) {
        this.moveForward = forward;
        this.moveBackward = backward;
        this.moveLeft = left;
        this.moveRight = right;
        this.isSprinting = sprinting;
    }
    
    // Update player position based on network data (for remote players)
    updateFromNetwork(position, rotation) {
        // Store the raw position and rotation from the network
        if (position) {
            // Set the target position for interpolation
            this.targetPosition.set(position.x, position.y, position.z);
        }
        
        if (rotation) {
            // Set the target rotation for interpolation
            this.targetRotation.set(rotation.x, rotation.y, rotation.z);
        }
        
        // If this is the local player, we don't update the model
        // as it's controlled by the camera
        if (this.isLocal) return;
        
        // For remote players, if the model exists, update it immediately
        // This will be smoothed by the interpolation in the update method
        if (this.model) {
            console.log(`Updating remote player ${this.id} to position:`, position);
        }
    }

    // Serialize player data for network transmission
    serialize() {
        return {
            id: this.id,
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
            },
            moveForward: this.moveForward,
            moveBackward: this.moveBackward,
            moveLeft: this.moveLeft,
            moveRight: this.moveRight,
            isSprinting: this.isSprinting
        };
    }

    getPosition() {
        return {
            x: this.position.x,
            y: this.position.y,
            z: this.position.z
        };
    }

    getRotation() {
        return {
            x: this.rotation.x,
            y: this.rotation.y,
            z: this.rotation.z
        };
    }
}

class SimpleGame {
    constructor() {
        try {
            console.log("Initializing game");
            
            // Initialize properties
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            
            // Set up renderer
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Find game container
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                console.error("Game container not found!");
                return;
            }
            
            // Append renderer to container
            gameContainer.appendChild(this.renderer.domElement);
            
            // Set up camera and controls
            this.camera.position.y = 1.6; // Eye level
            this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
            
            // Add controls to scene to ensure they're properly initialized
            this.scene.add(this.controls.getObject());
            
            // Movement variables
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
            this.isSprinting = false;
            this.sprintMultiplier = 2.0; // Increased from 1.5 for more noticeable sprint
            
            // Physics variables
            this.velocity = new THREE.Vector3();
            this.direction = new THREE.Vector3();
            this.playerSpeed = 2.0; // Reduced from 5.0 for better matching with static player
            this.prevTime = performance.now();
            
            // Animation variables
            this.animationClock = 0;
            
            // Debug mode
            this.debugMode = true;
            
            // Players collection
            this.players = new Map();
            
            // Create a simple test environment
            this.createSimpleTestEnvironment();
            
            // Create local player
            this.createLocalPlayer();
            
            // Initialize network (before creating test players)
            this.initNetwork();
            
            // Create some test remote players (only if not connected to real server)
            this.createTestRemotePlayers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start animation loop
            this.animate();
            
            console.log("Game initialized successfully");
        } catch (error) {
            console.error("Error initializing game:", error);
        }
    }
    
    // Create the local player
    createLocalPlayer() {
        const localPlayerId = 'local-player';
        // Set y to the camera height (1.6) for the local player
        const localPlayer = new Player(localPlayerId, this, true);
        localPlayer.createModel();
        this.players.set(localPlayerId, localPlayer);
        this.localPlayer = localPlayer;
        
        console.log("Local player created with ID:", localPlayerId);
    }
    
    // Create some test remote players (for development)
    createTestRemotePlayers() {
        // Only create test players if we're in test mode or not connected to a server
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("Connected to real server, skipping test players");
            return;
        }
        
        console.log("Creating test remote players");
        
        // Create 3 test remote players at different positions
        const positions = [
            { x: 5, y: 0, z: -15 },
            { x: -5, y: 0, z: -10 },
            { x: 0, y: 0, z: -20 }
        ];
        
        positions.forEach((pos, index) => {
            const playerId = `remote-player-${index}`;
            const remotePlayer = new Player(playerId, this, false, pos);
            remotePlayer.createModel();
            this.players.set(playerId, remotePlayer);
            
            console.log("Test remote player created with ID:", playerId);
        });
    }
    
    // Initialize network functionality
    initNetwork() {
        // Connect to the server
        console.log('Connecting to server...');
        
        // Use socket.io for WebSocket communication
        this.socket = io('http://localhost:3000');
        
        // Set up event listeners for socket.io
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket.id);
            
            // Send initial player data
            this.sendNetworkUpdate();
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('player-joined', (data) => {
            console.log('Player joined:', data.id);
            this.addRemotePlayer(data.id, data.position);
        });
        
        this.socket.on('player-left', (data) => {
            console.log('Player left:', data.id);
            this.removePlayer(data.id);
        });
        
        this.socket.on('player-update', (message) => {
            // Update an existing player
            const player = this.players.get(message.id);
            if (player) {
                // Log the position update for debugging
                console.log(`Received position update for player ${message.id}:`, message.position);
                
                // Update the player's position and rotation
                player.updateFromNetwork(message.position, message.rotation);
                
                // Update movement flags
                player.setMovementFlags(
                    message.moveForward,
                    message.moveBackward,
                    message.moveLeft,
                    message.moveRight,
                    message.isSprinting
                );
            } else {
                // If we don't have this player yet, add them
                console.log(`Received update for unknown player ${message.id}, adding them`);
                this.addRemotePlayer(message.id, message.position);
                
                // Update their rotation and movement flags
                const newPlayer = this.players.get(message.id);
                if (newPlayer) {
                    newPlayer.updateFromNetwork(message.position, message.rotation);
                    newPlayer.setMovementFlags(
                        message.moveForward,
                        message.moveBackward,
                        message.moveLeft,
                        message.moveRight,
                        message.isSprinting
                    );
                }
            }
        });
        
        // Set network update interval (milliseconds)
        this.networkUpdateInterval = 50; // Increased frequency for smoother movement
        this.lastNetworkUpdate = 0;
    }

    // Remove a player from the game
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            console.log(`Removing player ${playerId}`);
            
            // Remove the player's model from the scene
            if (player.model && this.scene) {
                this.scene.remove(player.model);
            }
            
            // Remove the player from our map
            this.players.delete(playerId);
        }
    }
}
