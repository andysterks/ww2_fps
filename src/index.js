import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { io } from 'socket.io-client';
import { audioManager } from './audio.js';

// Import the Player class from its module
import Player from './components/player/german/Player.js';

console.log("Script loaded");

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM loaded, initializing game...");
        
        // Add a click handler to the document body to check if the pointer lock is working
        document.body.addEventListener('click', () => {
            console.log("DEBUG: Document body clicked, pointerLockElement:", document.pointerLockElement);
        });
        
        // Create a simple test scene to see if Three.js is working
        const testScene = () => {
            console.log("Creating test scene");
            
            // Create scene, camera, and renderer
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            
            // Set up renderer
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);
            
            // Create a simple cube
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            
            // Position camera
            camera.position.z = 5;
            
            // Animation function
            const animate = () => {
                requestAnimationFrame(animate);
                
                // Rotate cube
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                
                // Render scene
                renderer.render(scene, camera);
            };
            
            // Start animation
            animate();
            
            console.log("Test scene created and running");
        };
        
        // Uncomment to run the test scene instead of the full game
        // return testScene();
        
        // Create game container if it doesn't exist
        let gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.warn("Game container not found, creating one");
            gameContainer = document.createElement('div');
            gameContainer.id = 'game-container';
            gameContainer.style.width = '100%';
            gameContainer.style.height = '100%';
            gameContainer.style.position = 'absolute';
            gameContainer.style.top = '0';
            gameContainer.style.left = '0';
            document.body.appendChild(gameContainer);
        }
        
        // Create HUD elements if they don't exist
        let hudContainer = document.getElementById('hud');
        if (!hudContainer) {
            console.warn("HUD container not found, creating one");
            hudContainer = document.createElement('div');
            hudContainer.id = 'hud';
            hudContainer.style.position = 'absolute';
            hudContainer.style.top = '0';
            hudContainer.style.left = '0';
            hudContainer.style.width = '100%';
            hudContainer.style.height = '100%';
            hudContainer.style.pointerEvents = 'none';
            document.body.appendChild(hudContainer);
            
            // Create crosshair
            const crosshair = document.createElement('div');
            crosshair.id = 'crosshair';
            crosshair.textContent = '+';
            crosshair.style.position = 'absolute';
            crosshair.style.top = '50%';
            crosshair.style.left = '50%';
            crosshair.style.transform = 'translate(-50%, -50%)';
            crosshair.style.color = 'white';
            crosshair.style.fontSize = '24px';
            hudContainer.appendChild(crosshair);
            
            // Create scope overlay for aiming down sights
            const scopeOverlay = document.createElement('div');
            scopeOverlay.id = 'scope-overlay';
            scopeOverlay.className = 'hidden';
            scopeOverlay.style.position = 'absolute';
            scopeOverlay.style.top = '0';
            scopeOverlay.style.left = '0';
            scopeOverlay.style.width = '100%';
            scopeOverlay.style.height = '100%';
            scopeOverlay.style.pointerEvents = 'none';
            
            // Create iron sight elements - these are visual aids to help with alignment
            // Front sight post - thin vertical line
            const frontSightPost = document.createElement('div');
            frontSightPost.className = 'front-sight-post';
            frontSightPost.style.position = 'absolute';
            frontSightPost.style.top = '50%';
            frontSightPost.style.left = '50%';
            frontSightPost.style.transform = 'translate(-50%, -50%)';
            frontSightPost.style.width = '1px';
            frontSightPost.style.height = '12px';
            frontSightPost.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            frontSightPost.style.zIndex = '12';
            scopeOverlay.appendChild(frontSightPost);
            
            // Front sight protective wings
            const leftWing = document.createElement('div');
            leftWing.className = 'front-sight-wing';
            leftWing.style.position = 'absolute';
            leftWing.style.top = '50%';
            leftWing.style.left = 'calc(50% - 8px)';
            leftWing.style.transform = 'translateY(-50%)';
            leftWing.style.width = '2px';
            leftWing.style.height = '12px';
            leftWing.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            leftWing.style.zIndex = '11';
            scopeOverlay.appendChild(leftWing);
            
            const rightWing = document.createElement('div');
            rightWing.className = 'front-sight-wing';
            rightWing.style.position = 'absolute';
            rightWing.style.top = '50%';
            rightWing.style.left = 'calc(50% + 6px)';
            rightWing.style.transform = 'translateY(-50%)';
            rightWing.style.width = '2px';
            rightWing.style.height = '12px';
            rightWing.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            rightWing.style.zIndex = '11';
            scopeOverlay.appendChild(rightWing);
            
            // Rear sight V-notch
            const rearSight = document.createElement('div');
            rearSight.className = 'rear-sight';
            rearSight.style.position = 'absolute';
            rearSight.style.bottom = 'calc(50% + 20px)'; // Position below center
            rearSight.style.left = '50%';
            rearSight.style.transform = 'translateX(-50%)';
            rearSight.style.width = '16px';
            rearSight.style.height = '8px';
            rearSight.style.overflow = 'hidden';
            rearSight.style.zIndex = '10';
            
            // Create V-notch using CSS
            const vNotch = document.createElement('div');
            vNotch.style.position = 'absolute';
            vNotch.style.bottom = '0';
            vNotch.style.left = '0';
            vNotch.style.width = '0';
            vNotch.style.height = '0';
            vNotch.style.borderLeft = '8px solid transparent';
            vNotch.style.borderRight = '8px solid transparent';
            vNotch.style.borderBottom = '8px solid rgba(0, 0, 0, 0.9)';
            rearSight.appendChild(vNotch);
            
            scopeOverlay.appendChild(rearSight);
            
            // Add vignette effect - darkens the edges of the screen when aiming
            const vignette = document.createElement('div');
            vignette.className = 'vignette';
            vignette.style.position = 'absolute';
            vignette.style.top = '0';
            vignette.style.left = '0';
            vignette.style.width = '100%';
            vignette.style.height = '100%';
            vignette.style.background = 'radial-gradient(circle, transparent 65%, rgba(0, 0, 0, 0.7) 100%)';
            vignette.style.pointerEvents = 'none';
            vignette.style.zIndex = '9';
            scopeOverlay.appendChild(vignette);
            
            // Add slight blur effect to simulate focus on the sights
            const focusEffect = document.createElement('div');
            focusEffect.className = 'focus-effect';
            focusEffect.style.position = 'absolute';
            focusEffect.style.top = '0';
            focusEffect.style.left = '0';
            focusEffect.style.width = '100%';
            focusEffect.style.height = '100%';
            focusEffect.style.backdropFilter = 'blur(1px)';
            focusEffect.style.WebkitBackdropFilter = 'blur(1px)';
            focusEffect.style.zIndex = '8';
            scopeOverlay.appendChild(focusEffect);
            
            hudContainer.appendChild(scopeOverlay);
            
            // Create debug info container
            const debugInfo = document.createElement('div');
            debugInfo.id = 'debug-info';
            debugInfo.style.position = 'absolute';
            debugInfo.style.bottom = '50px';
            debugInfo.style.left = '20px';
            debugInfo.style.color = 'white';
            debugInfo.style.backgroundColor = 'rgba(0,0,0,0.5)';
            debugInfo.style.padding = '5px';
            debugInfo.style.fontSize = '12px';
            debugInfo.style.display = 'none';
            hudContainer.appendChild(debugInfo);
        }
        
        // Display a message on screen to confirm the script is running
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'absolute';
        debugDiv.style.top = '50px';
        debugDiv.style.left = '50px';
        debugDiv.style.color = 'white';
        debugDiv.style.backgroundColor = 'black';
        debugDiv.style.padding = '10px';
        debugDiv.style.zIndex = '1000';
        debugDiv.textContent = 'Game initializing...';
        document.body.appendChild(debugDiv);
        
        // Create a simple Three.js scene directly
        console.log("DEBUG: About to create SimpleGame instance");
        const simpleGame = new SimpleGame();
        console.log("DEBUG: SimpleGame instance created:", simpleGame);
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

class SimpleGame {
    constructor() {
        console.log("DEBUG: Initializing SimpleGame");
        
        try {
            // Initialize audio system
            console.log("DEBUG: Initializing audio system");
            audioManager.init();
            
            // Initialize properties
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.controls = null;
            this.animationFrameId = null;
            this.lastFrameTime = performance.now();
            this.frameCounter = 0;
            this.debugMode = true;
            
            // Register as the active game instance if no other instance is active
            if (!window.gameInstance) {
                console.log("DEBUG: Registering SimpleGame as the active game instance");
                window.gameInstance = this;
            } else {
                console.log("DEBUG: Another game instance is already active");
            }
            
            // Initialize players collection as an object (not a Map)
            this.players = {};
            this.localPlayer = null;
            
            // Network properties
            this.socket = null;
            this.lastNetworkUpdateTime = 0;
            
            // Movement flags
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
            this.isSprinting = false;
            this.isAimingDownSights = false;
            
            // New recoil implementation
            this.recoil = {
                active: false,
                startTime: 0,
                duration: 300, // ms
                weaponOffset: new THREE.Vector3(0, 0, 0),
                weaponRotation: new THREE.Euler(0, 0, 0),
                intensity: 0,
                recoveryRate: 0.1
            };
            
            // Physics variables
            this.velocity = new THREE.Vector3();
            this.direction = new THREE.Vector3();
            this.playerSpeed = 5.0;
            this.sprintMultiplier = 2.0;
            this.isRunning = false;
            
            // Set up renderer
            console.log("DEBUG: Setting up renderer");
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(this.renderer.domElement);
            
            // Set up camera and controls
            console.log("DEBUG: Setting up camera position");
            this.camera.position.y = 1.6; // Eye level
            console.log("DEBUG: Creating pointer lock controls");
            
            // Create PointerLockControls
            this.controls = new PointerLockControls(this.camera, document.body);
            
            // Log controls properties
            console.log("DEBUG: Controls created:", {
                isLocked: this.controls.isLocked,
                hasControls: !!this.controls,
                hasMoveForward: typeof this.controls.moveForward === 'function',
                hasMoveRight: typeof this.controls.moveRight === 'function'
            });
            
            // Add controls to scene to ensure they're properly initialized
            console.log("DEBUG: Adding controls to scene");
            this.scene.add(this.controls.getObject());
            
            // Create weapon model - but don't add it to the scene yet
            this.weaponModel = this.createSimpleWeaponModel();
            
            // IMPORTANT: Add weapon model to camera, not scene
            console.log("DEBUG: Adding weapon model to camera");
            this.camera.add(this.weaponModel);
            
            // Create test environment
            console.log("DEBUG: Creating test environment");
            this.createSimpleTestEnvironment();
            
            // Set up event listeners
            console.log("DEBUG: Setting up event listeners");
            this.setupEventListeners();
            
            // Create local player
            console.log("DEBUG: Creating local player");
            this.createLocalPlayer();
            
            // Start animation loop
            console.log("DEBUG: Starting animation loop");
            this.animate();
            
            console.log("DEBUG: Game initialized successfully");
        } catch (error) {
            console.error("DEBUG: Error initializing game:", error);
            this.showErrorMessage(error);
        }
    }
    
    // Create the local player
    createLocalPlayer() {
        console.log("DEBUG: Creating local player");
        
        try {
            // Create local player with ID 'local-player' (will be updated with socket ID later)
            const initialPosition = { 
                x: this.camera ? this.camera.position.x : 0, 
                y: this.camera ? this.camera.position.y : 1.6, 
                z: this.camera ? this.camera.position.z : 0 
            };
            
            console.log("DEBUG: Initial player position:", initialPosition);
            
            // Create the local player
            this.localPlayer = new Player('local-player', this, true, {
                ...initialPosition,
                z: -1
            });
            
            // Create the player model
            this.localPlayer.createModel();
            
            // Store in players object
            this.players['local-player'] = this.localPlayer;
            
            console.log("DEBUG: Local player created successfully");
            
            // Initialize network after creating local player
            console.log("DEBUG: Initializing network after local player creation");
            this.initNetwork();
        } catch (error) {
            console.error("DEBUG: Error creating local player:", error);
            
            // Try to recover by creating a minimal player
            try {
                console.log("DEBUG: Attempting to create minimal local player");
                this.localPlayer = new Player('local-player', this, true, { x: 0, y: 1.6, z: 0 });
                this.players['local-player'] = this.localPlayer;
                
                // Initialize network
                this.initNetwork();
            } catch (recoveryError) {
                console.error("DEBUG: Recovery failed:", recoveryError);
            }
        }
    }
    
    // Create some test remote players (for development)
    createTestRemotePlayers() {
        // Only create test players if we're in test mode or not connected to a server
        if (this.socket && this.socket.connected) {
            console.log("Connected to real server, skipping test players");
            return;
        }
        
        console.log("DEBUG: Creating test remote players");
        
        // Create 3 test remote players at different positions
        const positions = [
            { x: 0, y: 0, z: -5 },  // Directly in front
            { x: -3, y: 0, z: -5 }, // To the left
            { x: 3, y: 0, z: -5 }   // To the right
        ];
        
        positions.forEach((pos, index) => {
            const playerId = `remote-player-${index}`;
            console.log(`DEBUG: Creating test player ${playerId} at position:`, pos);
            
            const remotePlayer = new Player(playerId, this, false, pos);
            remotePlayer.createModel();
            
            // Ensure the model is visible and properly positioned
            if (remotePlayer.model) {
                remotePlayer.model.position.copy(remotePlayer.position);
                remotePlayer.model.visible = true;
                console.log(`DEBUG: Player ${playerId} model position:`, remotePlayer.model.position);
                
                // Log the rifle position
                const rifle = remotePlayer.model.getObjectByName('playerModelRifle');
                if (rifle) {
                    console.log(`DEBUG: Player ${playerId} rifle position (local):`, rifle.position);
                    
                    // Calculate world position
                    const worldPosition = new THREE.Vector3();
                    rifle.getWorldPosition(worldPosition);
                    console.log(`DEBUG: Player ${playerId} rifle position (world):`, worldPosition);
                }
            }
            
            this.players.set(playerId, remotePlayer);
            console.log(`DEBUG: Test remote player ${playerId} created and added to players map`);
        });
        
        // Log the total number of players
        console.log(`DEBUG: Total players in game: ${this.players.size}`);
        
        // Log all players' positions
        this.players.forEach((player, id) => {
            console.log(`DEBUG: Player ${id} position:`, player.position);
            if (player.model) {
                console.log(`DEBUG: Player ${id} model position:`, player.model.position);
            }
        });
    }
    
    // Initialize network functionality
    initNetwork() {
        console.log("DEBUG: Initializing network connection");
        
        try {
            // Connect to the server
            console.log("DEBUG: Attempting to connect to server...");
            
            // Use socket.io for WebSocket communication
            const serverUrl = window.location.hostname === 'localhost' ? 
                'http://localhost:3000' : // Use explicit URL when running locally
                `${window.location.protocol}//${window.location.hostname}:3000`; // Use port 3000 for network connections
            
            console.log('DEBUG: Connecting to server at:', serverUrl);
            
            this.socket = io(serverUrl, {
                reconnectionAttempts: 5,
                timeout: 10000
            });
            
            console.log("DEBUG: Socket object created:", this.socket);
            
            // Set up connection event handlers
            this.socket.on('connect', () => {
                console.log("DEBUG: Connected to server with ID:", this.socket.id);
                
                // Update local player ID to match socket ID
                if (this.localPlayer) {
                    const oldId = this.localPlayer.id;
                    this.localPlayer.id = this.socket.id;
                    
                    // Update players collection
                    delete this.players[oldId];
                    this.players[this.socket.id] = this.localPlayer;
                    
                    console.log(`DEBUG: Updated local player ID from ${oldId} to ${this.socket.id}`);
                }
                
                // Send initial player data
                const playerData = {
                    id: this.socket.id,
                    position: this.localPlayer.getPosition(),
                    rotation: this.localPlayer.getRotation()
                };
                
                console.log("DEBUG: Sending initial player data:", playerData);
                this.socket.emit('playerJoin', playerData);
            });
            
            this.socket.on('connect_error', (error) => {
                console.error("DEBUG: Connection error:", error);
            });
            
            this.socket.on('connect_timeout', () => {
                console.error("DEBUG: Connection timeout");
            });
            
            this.socket.on('disconnect', (reason) => {
                console.log("DEBUG: Disconnected from server, reason:", reason);
            });
            
            // Handle player join events
            this.socket.on('playerJoined', (playerData) => {
                // Skip if it's us
                if (playerData.id === this.socket.id) return;
                
                console.log(`DEBUG: Player joined: ${playerData.id}`);
                console.log(`DEBUG: Position: ${JSON.stringify(playerData.position)}`);
                console.log(`DEBUG: Direction: ${JSON.stringify(playerData.direction)}`);
                
                // Create a new player object for this player
                const remotePlayer = this.addRemotePlayer(playerData.id, playerData.position);
                
                // Set the initial direction
                if (playerData.direction) {
                    if (!remotePlayer.directionVector) {
                        remotePlayer.directionVector = new THREE.Vector3();
                    }
                    remotePlayer.directionVector.set(
                        playerData.direction.x,
                        playerData.direction.y,
                        playerData.direction.z
                    );
                }
                
                // Set vertical look angle
                if (typeof playerData.verticalLook === 'number') {
                    remotePlayer.verticalLookAngle = playerData.verticalLook;
                }
                
                // Set movement flags and aiming state
                remotePlayer.moveForward = playerData.moveForward || false;
                remotePlayer.moveBackward = playerData.moveBackward || false;
                remotePlayer.moveLeft = playerData.moveLeft || false;
                remotePlayer.moveRight = playerData.moveRight || false;
                remotePlayer.isSprinting = playerData.isSprinting || false;
                remotePlayer.isAimingDownSights = playerData.isAimingDownSights || false;
            });
            
            // Handle existing players
            this.socket.on('existingPlayers', (players) => {
                console.log("DEBUG: Existing players data received:", players);
                
                players.forEach(player => {
                    // Don't add ourselves
                    if (player.id === this.socket.id) {
                        console.log("DEBUG: Ignoring own player in existing players list");
                        return;
                    }
                    
                    console.log("DEBUG: Adding existing remote player:", player.id);
                    this.addRemotePlayer(player.id, player.position);
                });
            });
            
            // Handle player leave events
            this.socket.on('playerLeft', (playerId) => {
                console.log("DEBUG: Player left event received:", playerId);
                this.removePlayer(playerId);
            });
            
            // Handle player hit events
            this.socket.on('hitByPlayer', (hitData) => {
                console.log("DEBUG: Hit by player event received:", hitData);
                
                // Apply screen vibration effect to indicate being hit
                this.applyHitEffect(hitData.hitIntensity || 1.0);
                
                // Play hit sound
                audioManager.play('gunshot', { volume: 0.3 });
            });
            
            // Handle player hit visual events (for spectators)
            this.socket.on('playerHitVisual', (hitData) => {
                console.log("DEBUG: Player hit visual event received:", hitData);
                
                // Show visual effect at hit position if we can see it
                if (hitData.hitPosition) {
                    const hitPosition = new THREE.Vector3(
                        hitData.hitPosition.x,
                        hitData.hitPosition.y,
                        hitData.hitPosition.z
                    );
                    
                    // Create a small blood effect at the hit position
                    this.createBloodEffect(hitPosition);
                }
            });
            
            // Handle player updates
            this.socket.on('playerUpdate', (playerData) => {
                // Don't update ourselves
                if (playerData.id === this.socket.id) return;
                
                const player = this.players[playerData.id];
                if (player) {
                    console.log(`DEBUG: Received update for player ${playerData.id}`);
                    player.updateFromNetwork(
                        playerData.position, 
                        playerData.direction,
                        playerData.verticalLook,
                        playerData.moveForward, 
                        playerData.moveBackward, 
                        playerData.moveLeft, 
                        playerData.moveRight, 
                        playerData.isSprinting, 
                        playerData.isAimingDownSights
                    );
                } else {
                    console.warn(`DEBUG: Received update for unknown player: ${playerData.id}`);
                    // Add player if we don't know them yet
                    this.addRemotePlayer(playerData.id, playerData.position);
                }
            });
            
            console.log("DEBUG: Network event handlers set up");
            
            // Start sending regular updates
            this.lastNetworkUpdateTime = performance.now();
            
            console.log("DEBUG: Network initialization complete");
        } catch (error) {
            console.error("DEBUG: Error initializing network:", error);
        }
    }
    
    // Send network update to server
    sendNetworkUpdate() {
        try {
            if (!this.socket || !this.socket.connected) {
                console.warn("DEBUG: Cannot send network update - socket not connected");
                return;
            }
            
            if (!this.localPlayer) {
                console.warn("DEBUG: Cannot send network update - local player not initialized");
                return;
            }
            
            // Get current camera position
            const position = {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            };
            
            // NEW APPROACH: Calculate and send the forward direction vector instead of rotation
            // This is the direction the player is facing
            const forwardVector = new THREE.Vector3(0, 0, -1);
            forwardVector.applyQuaternion(this.camera.quaternion);
            forwardVector.normalize(); // Ensure it's normalized
            
            const direction = {
                x: forwardVector.x,
                y: forwardVector.y,
                z: forwardVector.z
            };
            
            // Also send vertical look for rifle aiming
            const verticalLook = this.camera.rotation.x;
            
            // Log forward vector occasionally
            if (this.frameCounter % 120 === 0) {
                console.log("DEBUG: Sending direction vector:", direction);
                console.log("DEBUG: Vertical look:", verticalLook);
            }
            
            // Create player data with timestamp for better synchronization
            const playerData = {
                id: this.socket.id,
                position: position,
                direction: direction,
                verticalLook: verticalLook,
                // Include movement flags for smoother animations
                moveForward: this.moveForward,
                moveBackward: this.moveBackward,
                moveLeft: this.moveLeft,
                moveRight: this.moveRight,
                isSprinting: this.isSprinting,
                // Include aiming state
                isAimingDownSights: this.isAimingDownSights,
                timestamp: Date.now()
            };
            
            this.socket.emit('playerUpdate', playerData);
        } catch (error) {
            console.error("ERROR: Failed to send network update", error);
        }
    }
    
    // Add a remote player to the game
    addRemotePlayer(playerId, position) {
        console.log("DEBUG: Adding remote player:", playerId, "at position:", position);
        
        try {
            // Check if player already exists
            if (this.players[playerId]) {
                console.warn("DEBUG: Player already exists:", playerId);
                return this.players[playerId];
            }
            
            // Ensure position is valid
            const safePosition = {
                x: position && !isNaN(position.x) ? position.x : 0,
                y: position && !isNaN(position.y) ? position.y : 1.6,
                z: position && !isNaN(position.z) ? position.z : 0
            };
            
            console.log("DEBUG: Creating remote player with position:", safePosition);
            
            // Create new player
            const player = new Player(playerId, this, false, safePosition);
            
            // Create model
            const playerModel = player.createModel();
            
            // Add to scene if model was created successfully
            if (playerModel) {
                console.log("DEBUG: Adding remote player model to scene");
                this.scene.add(playerModel);
                
                // Make sure model is visible
                playerModel.visible = true;
                
                // IMPORTANT: For remote players, we need to adjust the y-position
                // The model's origin is at the bottom of the feet, but the player's position is at eye level
                // So we need to set the model's position to the player's position, but with y=0
                playerModel.position.set(
                    safePosition.x,
                    0, // Set y to 0 to place feet on the ground
                    safePosition.z
                );
                
                console.log("DEBUG: Remote player model added to scene successfully");
                console.log("DEBUG: Model position:", playerModel.position.clone());
            } else {
                console.error("DEBUG: Remote player model creation failed");
            }
            
            // Store in players object
            this.players[playerId] = player;
            console.log("DEBUG: Remote player added successfully, total players:", Object.keys(this.players).length);
            
            return player;
        } catch (error) {
            console.error("DEBUG: Error adding remote player:", error);
            return null;
        }
    }
    
    // Remove a player from the game
    removePlayer(playerId) {
        console.log("DEBUG: Removing player:", playerId);
        
        try {
            const player = this.players[playerId];
            if (!player) {
                console.warn("DEBUG: Player not found:", playerId);
                return;
            }
            
            // Remove from scene
            if (player.model) {
                console.log("DEBUG: Removing player model from scene");
                this.scene.remove(player.model);
            }
            
            // Remove from players object
            delete this.players[playerId];
            console.log("DEBUG: Player removed successfully, remaining players:", Object.keys(this.players).length);
        } catch (error) {
            console.error("DEBUG: Error removing player:", error);
        }
    }

    // Main animation loop
    animate() {
        try {
            // Request next frame
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
            
            // Calculate delta time
            const now = performance.now();
            const delta = (now - this.lastFrameTime) / 1000; // Convert to seconds
            this.lastFrameTime = now;
            
            // Increment frame counter
            this.frameCounter++;
            
            // Always run the game loop, even if not in pointer lock
            try {
                // Make sure scene is visible
                if (!this.scene.visible) {
                    console.warn('Scene was not visible, making it visible');
                    this.scene.visible = true;
                }
                
                // Check if scene has any children
                if (this.scene.children.length === 0) {
                    console.warn('Scene has no children, recreating environment');
                    this.createSimpleTestEnvironment();
                }
                
                // Make sure all objects in the scene are visible
                if (this.frameCounter % 10 === 0) { // Check less frequently to avoid performance issues
                    this.scene.traverse(object => {
                        if (object.visible !== undefined && !object.visible) {
                            console.warn('Found invisible object, making it visible:', object.type);
                            object.visible = true;
                        }
                    });
                }
                
                // Check if pointer is locked
                if (document.pointerLockElement === document.body) {
                    if (!this.isRunning) {
                        console.log("DEBUG: Pointer lock detected, setting isRunning to true");
                        this.isRunning = true;
                    }
                } else {
                    if (this.isRunning) {
                        console.log("DEBUG: Pointer lock lost, setting isRunning to false");
                        this.isRunning = false;
                    }
                }
                
                // Handle the floating rifle if it exists
                try {
                    if (this.floatingRifle && this.camera) {
                        // Calculate distance from player to rifle for info display only
                        const playerPosition = new THREE.Vector3();
                        this.camera.getWorldPosition(playerPosition);
                        const riflePosition = new THREE.Vector3(0, 1.5, -5); // Rifle's fixed position
                        const distanceToRifle = playerPosition.distanceTo(riflePosition);
                        
                        // Update info text with distance
                        this.updateRifleInfoText(distanceToRifle);
                        
                        // Adjust light intensity based on proximity
                        const rifleLight = this.scene.getObjectByName("rifleSpotlight");
                        if (rifleLight) {
                            rifleLight.intensity = 0.8 + (0.7 * (1 - Math.min(1, distanceToRifle / 8)));
                        }
                    }
                } catch (error) {
                    console.error('ERROR: Failed to update floating rifle:', error);
                }
                
                // Update weapon position based on movement and aiming
                try {
                    this.updateWeaponPosition();
                    
                    // We no longer need camera recoil recovery since we're not directly modifying camera rotation
                    // The screen shake effect is handled by setTimeout in applyScreenShake
                    // And weapon recoil is handled in updateWeaponPosition
                } catch (error) {
                    console.error('ERROR: Failed to update weapon position:', error);
                }
                
                // Update player position - always call this, even if not in pointer lock
                try {
                    this.updatePlayerPosition(delta);
                } catch (error) {
                    console.error('ERROR: Failed to update player position:', error);
                }
                
                // Update remote players
                try {
                    // Log number of players
                    if (this.frameCounter % 60 === 0) {
                        console.log("DEBUG: Number of players:", Object.keys(this.players).length);
                        
                        // Log all players
                        for (const playerId in this.players) {
                            const player = this.players[playerId];
                            console.log(`DEBUG: Player ${playerId}:`, {
                                isLocal: player.isLocal,
                                position: player.position ? player.position.clone() : 'undefined',
                                hasModel: !!player.model
                            });
                        }
                    }
                    
                    // Update all remote players
                    for (const playerId in this.players) {
                        const player = this.players[playerId];
                        if (player && !player.isLocal) {
                            try {
                                player.update(delta);
                                
                                // Make sure model is visible and in the scene
                                if (player.model) {
                                    if (!player.model.parent) {
                                        console.log(`DEBUG: Adding model for player ${playerId} to scene`);
                                        this.scene.add(player.model);
                                    }
                                    
                                    player.model.visible = true;
                                }
                            } catch (playerError) {
                                console.error(`ERROR: Failed to update remote player ${playerId}:`, playerError);
                            }
                        }
                    }
                } catch (error) {
                    console.error('ERROR: Failed to update remote players:', error);
                }
                
                // Send network updates at a fixed interval
                try {
                    if (this.socket && this.socket.connected && this.localPlayer) {
                        const networkUpdateInterval = 50; // 20 updates per second
                        if (now - this.lastNetworkUpdateTime > networkUpdateInterval) {
                            this.sendNetworkUpdate();
                            this.lastNetworkUpdateTime = now;
                        }
                    }
                } catch (error) {
                    console.error('ERROR: Failed to send network update:', error);
                }
                
                // Update debug info
                try {
                    if (this.debugMode) {
                        this.updateDebugInfo();
                    }
                } catch (error) {
                    console.error('ERROR: Failed to update debug info:', error);
                }
                
                // Render scene
                try {
                    // Clear the renderer
                    this.renderer.clear();
                    
                    // Render scene
                    this.renderer.render(this.scene, this.camera);
                    
                    if (this.frameCounter % 60 === 0) {
                        console.log('DEBUG: Frame rendered successfully');
                        console.log('DEBUG: isRunning:', this.isRunning, 'controls.isLocked:', this.controls ? this.controls.isLocked : 'controls not initialized');
                    }
                } catch (error) {
                    console.error('ERROR: Failed to render scene:', error);
                }
            } catch (innerError) {
                console.error('ERROR: Inner animation loop error:', innerError);
            }
        } catch (outerError) {
            console.error('CRITICAL ERROR: Outer animation loop error:', outerError);
            
            // Try to recover by restarting the animation loop
            if (!this.recoveryAttempted) {
                console.log('Attempting to recover from critical error...');
                this.recoveryAttempted = true;
                
                // Force a new animation frame
                requestAnimationFrame(this.animate.bind(this));
            } else {
                console.error('Recovery failed, animation loop stopped');
                
                // Display error message on screen
                this.showErrorMessage(outerError);
            }
        }
    }

    // Show error message on screen
    showErrorMessage(error) {
        try {
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.borderRadius = '5px';
            errorDiv.style.fontFamily = 'Arial, sans-serif';
            errorDiv.style.fontSize = '16px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '1000';
            errorDiv.innerHTML = `
                <h2>Game Error</h2>
                <p>${error.message}</p>
                <p>Please refresh the page to try again.</p>
                <button onclick="location.reload()">Refresh</button>
            `;
            document.body.appendChild(errorDiv);
        } catch (e) {
            // Last resort - alert
            alert(`Game error: ${error.message}. Please refresh the page.`);
        }
    }

    // Update weapon position based on movement and aiming
    updateWeaponPosition() {
        if (!this.weaponModel) return;

        // Default position (hip fire)
        let targetPosition = new THREE.Vector3(0.3, -0.3, -0.6);
        let targetRotation = new THREE.Euler(0, 0, 0);

        if (this.isAimingDownSights) {
            // Adjusted position for aiming down sights - bring weapon closer to eye level
            targetPosition = new THREE.Vector3(0, -0.08, -0.2);
            // Slight tilt for more realistic sight picture
            targetRotation = new THREE.Euler(0, -0.01, 0);
        }
        
        // Handle recoil animation
        if (this.recoil.active) {
            const now = performance.now();
            const elapsedTime = now - this.recoil.startTime;
            const recoilProgress = Math.min(1, elapsedTime / this.recoil.duration);
            
            // Calculate recoil effect based on progress
            if (recoilProgress < 0.3) {
                // Initial recoil phase (0-30% of duration) - weapon kicks back
                const kickPhaseProgress = recoilProgress / 0.3; // 0 to 1 during kick phase
                
                if (this.isAimingDownSights) {
                    // When aiming down sights, recoil should be more precise but still visible
                    targetPosition.y -= this.recoil.intensity * 0.3 * kickPhaseProgress;
                    targetPosition.z += this.recoil.intensity * 0.5 * kickPhaseProgress;
                    targetRotation.x += this.recoil.intensity * 0.8 * kickPhaseProgress;
                } else {
                    // Hip fire recoil is more exaggerated
                    targetPosition.y -= this.recoil.intensity * 0.2 * kickPhaseProgress;
                    targetPosition.z += this.recoil.intensity * 0.3 * kickPhaseProgress;
                    targetRotation.x += this.recoil.intensity * 0.5 * kickPhaseProgress;
                    // Add slight random horizontal rotation for hip fire
                    targetRotation.y += (Math.random() - 0.5) * 0.05 * this.recoil.intensity * kickPhaseProgress;
                }
            } else {
                // Recovery phase (30-100% of duration) - weapon returns to position
                const recoveryPhaseProgress = (recoilProgress - 0.3) / 0.7; // 0 to 1 during recovery
                
                // Gradually reduce recoil effect during recovery
                const recoveryFactor = 1 - recoveryPhaseProgress;
                
                if (this.isAimingDownSights) {
                    targetPosition.y -= this.recoil.intensity * 0.3 * recoveryFactor;
                    targetPosition.z += this.recoil.intensity * 0.5 * recoveryFactor;
                    targetRotation.x += this.recoil.intensity * 0.8 * recoveryFactor;
                } else {
                    targetPosition.y -= this.recoil.intensity * 0.2 * recoveryFactor;
                    targetPosition.z += this.recoil.intensity * 0.3 * recoveryFactor;
                    targetRotation.x += this.recoil.intensity * 0.5 * recoveryFactor;
                }
            }
            
            // End recoil if duration is complete
            if (elapsedTime >= this.recoil.duration) {
                this.recoil.active = false;
                console.log("DEBUG: Recoil animation complete");
            }
        }

        // Smooth transition between positions
        this.weaponModel.position.lerp(targetPosition, 0.1);
        
        // Apply rotation changes with smooth interpolation
        this.weaponModel.rotation.x = THREE.MathUtils.lerp(this.weaponModel.rotation.x, targetRotation.x, 0.1);
        this.weaponModel.rotation.y = THREE.MathUtils.lerp(this.weaponModel.rotation.y, targetRotation.y, 0.1);
        this.weaponModel.rotation.z = THREE.MathUtils.lerp(this.weaponModel.rotation.z, targetRotation.z, 0.1);

        // Add subtle weapon sway when moving
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            const swayAmount = 0.02;
            const swaySpeed = 4;
            this.weaponModel.position.y += Math.sin(Date.now() * 0.01 * swaySpeed) * swayAmount;
            this.weaponModel.position.x += Math.sin(Date.now() * 0.005 * swaySpeed) * swayAmount * 0.5;
        }
    }

    // Helper method to get world position of an object
    getWorldPosition(object) {
        const worldPosition = new THREE.Vector3();
        object.getWorldPosition(worldPosition);
        return worldPosition;
    }

    // Update player position
    updatePlayerPosition(delta) {
        try {
            if (!delta) {
                console.warn('Delta time is missing or zero, using default value');
                delta = 0.016; // Default to 60fps
            }
    
            // Initialize velocity and direction if they don't exist
            if (!this.velocity) this.velocity = new THREE.Vector3();
            if (!this.direction) this.direction = new THREE.Vector3();
            
            // Initialize player speed if it doesn't exist
            if (!this.playerSpeed) this.playerSpeed = 5.0;
            if (!this.sprintMultiplier) this.sprintMultiplier = 2.0;
    
            // Handle player movement even if controls aren't locked
            if (this.isRunning) {
                // Calculate movement speed based on sprint state
                const speed = this.isSprinting ? this.playerSpeed * this.sprintMultiplier : this.playerSpeed;
                
                // Calculate movement direction
                this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
                this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
                this.direction.normalize(); // Normalize for consistent speed in all directions
                
                if (this.frameCounter % 60 === 0) {
                    console.log('DEBUG: Movement flags:', {
                        forward: this.moveForward,
                        backward: this.moveBackward,
                        left: this.moveLeft,
                        right: this.moveRight,
                        sprint: this.isSprinting
                    });
                    console.log('DEBUG: Direction:', this.direction);
                    console.log('DEBUG: Speed:', speed);
                }
                
                // Apply movement to controls
                if (this.controls) {
                    // Check if any movement keys are pressed
                    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
                    
                    if (isMoving) {
                        if (this.moveForward || this.moveBackward) {
                            // Check if moveForward method exists on controls
                            if (typeof this.controls.moveForward === 'function') {
                                this.controls.moveForward(this.direction.z * speed * delta);
                            } else {
                                console.error('ERROR: controls.moveForward is not a function');
                                // Fallback: manually move the camera
                                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                                this.camera.position.addScaledVector(dir, this.direction.z * speed * delta);
                            }
                        }
                        
                        if (this.moveLeft || this.moveRight) {
                            // Check if moveRight method exists on controls
                            if (typeof this.controls.moveRight === 'function') {
                                this.controls.moveRight(this.direction.x * speed * delta);
                            } else {
                                console.error('ERROR: controls.moveRight is not a function');
                                // Fallback: manually move the camera
                                const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
                                this.camera.position.addScaledVector(right, this.direction.x * speed * delta);
                            }
                        }
                        
                        if (this.frameCounter % 60 === 0) {
                            console.log('DEBUG: Camera position after movement:', this.camera.position);
                        }
                    }
                } else {
                    console.error('ERROR: Controls not initialized');
                }
            }
            
            // Update local player position if it exists
            if (this.localPlayer) {
                this.localPlayer.update(delta);
            }
            
            // Send network updates at fixed intervals
            if (this.socket && this.socket.connected && this.localPlayer) {
                const now = performance.now();
                if (!this.lastNetworkUpdateTime) this.lastNetworkUpdateTime = now;
                
                const networkUpdateInterval = 100; // 10 updates per second
                if (now - this.lastNetworkUpdateTime > networkUpdateInterval) {
                    this.sendNetworkUpdate();
                    this.lastNetworkUpdateTime = now;
                }
            }
        } catch (error) {
            console.error('ERROR: Failed to update player position:', error);
        }
    }

    // Create a simple test environment
    createSimpleTestEnvironment() {
        console.log("Creating test environment");
        
        try {
            // Add ambient light
            console.log("Adding ambient light");
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            // Add directional light (sun)
            console.log("Adding directional light");
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 50, 50);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);
            
            // Set up shadow properties
            console.log("Setting up shadow properties");
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            
            // Create ground
            console.log("Creating ground");
            const groundGeometry = new THREE.PlaneGeometry(100, 100);
            const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = 0;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Create a simple road
            console.log("Creating road");
            const roadGeometry = new THREE.PlaneGeometry(5, 100);
            const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const road = new THREE.Mesh(roadGeometry, roadMaterial);
            road.rotation.x = -Math.PI / 2;
            road.position.y = 0.01; // Slightly above ground to prevent z-fighting
            road.receiveShadow = true;
            this.scene.add(road);
            
            // Add some buildings
            console.log("Adding buildings");
            this.createBuilding(10, 0, -20, 0x8B4513);
            this.createBuilding(-10, 0, -15, 0xA0522D);
            this.createBuilding(15, 0, -30, 0xCD853F);
            
            // Add a floating Kar98 rifle for examination
            console.log("Adding floating Kar98 rifle");
            this.createFloatingKar98Rifle();
            
            console.log("Test environment created successfully");
        } catch (error) {
            console.error("Error creating test environment:", error);
        }
    }
    
    // Helper method to create a simple building
    createBuilding(x, y, z, color) {
        const width = 5 + Math.random() * 3;
        const height = 5 + Math.random() * 5;
        const depth = 5 + Math.random() * 3;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        building.position.set(x, y + height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        
        this.scene.add(building);
    }

    // Create a floating Kar98 rifle for examination
    createFloatingKar98Rifle() {
        console.log("Creating floating Kar98 rifle for examination");
        
        try {
            // Create a copy of the Kar98 rifle model
            const floatingRifle = this.createSimpleWeaponModel();
            
            // Name it for easy reference
            floatingRifle.name = "floatingKar98Rifle";
            
            // Position it in the environment - slightly below eye level
            // Assuming player eye level is around 1.7 units
            floatingRifle.position.set(0, 1.5, -5); // 5 units in front of the starting position
            
            // Set a fixed rotation - horizontal with slight angle for better viewing
            floatingRifle.rotation.set(0, Math.PI / 6, 0);
            
            // Scale it up slightly for better visibility
            floatingRifle.scale.set(2, 2, 2);
            
            // Create a display platform for the rifle
            const platformGeometry = new THREE.CylinderGeometry(1, 1.2, 0.1, 16);
            const platformMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                metalness: 0.7,
                roughness: 0.2,
                emissive: 0x222222
            });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(0, 0.05, -5); // Position below the rifle
            platform.receiveShadow = true;
            platform.name = "rifleDisplayPlatform";
            this.scene.add(platform);
            
            // Add a subtle glow effect around the rifle (static, no animation)
            const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffcc,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
            glowSphere.position.copy(floatingRifle.position);
            glowSphere.scale.set(3, 3, 5); // Elongated to cover the rifle
            glowSphere.name = "rifleGlowEffect";
            this.scene.add(glowSphere);
            
            // Store reference to glow effect
            this.rifleGlowEffect = glowSphere;
            
            // Add to scene
            this.scene.add(floatingRifle);
            
            // Store reference
            this.floatingRifle = floatingRifle;
            
            // Add a subtle point light to highlight the rifle
            const rifleLight = new THREE.PointLight(0xffffcc, 0.8, 5);
            rifleLight.position.set(0, 1.7, -5);
            rifleLight.name = "rifleSpotlight";
            this.scene.add(rifleLight);
            
            // Add a small info text using HTML overlay
            this.addRifleInfoText();
            
            console.log("Floating Kar98 rifle created successfully");
            return floatingRifle;
        } catch (error) {
            console.error("Error creating floating Kar98 rifle:", error);
            return null;
        }
    }
    
    // Add an HTML overlay with information about the rifle
    addRifleInfoText() {
        const infoDiv = document.createElement('div');
        infoDiv.id = 'rifle-info';
        infoDiv.style.position = 'absolute';
        infoDiv.style.bottom = '20px';
        infoDiv.style.left = '50%';
        infoDiv.style.transform = 'translateX(-50%)';
        infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        infoDiv.style.color = 'white';
        infoDiv.style.padding = '10px 20px';
        infoDiv.style.borderRadius = '5px';
        infoDiv.style.fontFamily = 'Arial, sans-serif';
        infoDiv.style.fontSize = '14px';
        infoDiv.style.textAlign = 'center';
        infoDiv.style.zIndex = '1000';
        infoDiv.style.pointerEvents = 'none'; // Don't block mouse events
        infoDiv.innerHTML = 'Karabiner 98k - German Bolt-Action Rifle<br>Walk around to examine the weapon from all angles';
        
        document.body.appendChild(infoDiv);
    }
    
    // Update the rifle info text with distance information
    updateRifleInfoText(distance) {
        const infoDiv = document.getElementById('rifle-info');
        if (infoDiv) {
            // Format distance to 1 decimal place
            const formattedDistance = distance.toFixed(1);
            
            // Simple info text without interaction hints
            const infoText = `Karabiner 98k - German Bolt-Action Rifle<br>
                             Walk around to examine the weapon from all angles<br>
                             <span style="font-size: 12px; color: #aaa;">Distance: ${formattedDistance} meters</span>`;
            
            // Update the HTML
            infoDiv.innerHTML = infoText;
            
            // Simple color change based on proximity
            if (distance < 3) {
                infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            } else {
                infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            }
        }
    }

    // Set up event listeners for user input
    setupEventListeners() {
        console.log("DEBUG: Setting up event listeners");
        
        try {
            // Handle window resize
            window.addEventListener('resize', this.onWindowResize.bind(this));
            console.log("DEBUG: Added resize event listener");
            
            // Handle pointer lock changes
            document.addEventListener('pointerlockchange', () => {
                console.log("DEBUG: Pointer lock change event fired");
                console.log("DEBUG: pointerLockElement:", document.pointerLockElement);
                
                if (document.pointerLockElement === document.body) {
                    console.log("DEBUG: Pointer lock acquired");
                    this.isRunning = true;
                } else {
                    console.log("DEBUG: Pointer lock released");
                    this.isRunning = false;
                }
            });
            
            // Handle mouse buttons for shooting and aiming
            document.addEventListener('mousedown', (event) => {
                console.log("DEBUG: Mouse button pressed:", event.button);
                
                // Handle left-click (button 0)
                if (event.button === 0) {
                    // Only request pointer lock if not already locked
                    if (document.pointerLockElement !== document.body) {
                        console.log("DEBUG: Requesting pointer lock on document.body");
                        
                        // Request pointer lock on the document body
                        document.body.requestPointerLock = document.body.requestPointerLock || 
                                                          document.body.mozRequestPointerLock ||
                                                          document.body.webkitRequestPointerLock;
                        
                        document.body.requestPointerLock();
                    } else {
                        // If pointer is already locked, handle shooting
                        console.log("DEBUG: Pointer already locked, attempting to shoot");
                        this.shoot();
                    }
                }
                // Handle right-click (button 2)
                else if (event.button === 2) {
                    // Prevent the default context menu from appearing
                    event.preventDefault();
                    
                    // Only handle if pointer is locked
                    if (document.pointerLockElement === document.body) {
                        console.log("DEBUG: Right-click detected, toggling aim down sights");
                        
                        // Toggle aiming down sights
                        this.isAimingDownSights = !this.isAimingDownSights;
                        console.log('DEBUG: Aiming down sights:', this.isAimingDownSights);
                        
                        // Update local player if available
                        if (this.localPlayer) {
                            // Update the player's aiming state
                            this.localPlayer.isAimingDownSights = this.isAimingDownSights;
                        }
                    }
                }
            });
            
            // Prevent context menu from appearing
            document.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
            
            // Handle keyboard events for movement
            document.addEventListener('keydown', (event) => {
                console.log('DEBUG: Key pressed:', event.code);
                
                switch (event.code) {
                    case 'KeyW':
                        console.log('DEBUG: Forward movement started');
                        this.moveForward = true;
                        break;
                    case 'KeyS':
                        console.log('DEBUG: Backward movement started');
                        this.moveBackward = true;
                        break;
                    case 'KeyA':
                        console.log('DEBUG: Left movement started');
                        this.moveLeft = true;
                        break;
                    case 'KeyD':
                        console.log('DEBUG: Right movement started');
                        this.moveRight = true;
                        break;
                    case 'ShiftLeft':
                    case 'ShiftRight':
                        console.log('DEBUG: Sprint started');
                        this.isSprinting = true;
                        break;
                    case 'KeyF':
                        // F key is no longer used for aiming down sights
                        // It can be repurposed for another action if needed
                        break;
                }
                
                // Update local player movement flags
                if (this.localPlayer) {
                    console.log('DEBUG: Updating local player movement flags');
                    this.localPlayer.setMovementFlags(
                        this.moveForward,
                        this.moveBackward,
                        this.moveLeft,
                        this.moveRight,
                        this.isSprinting
                    );
                }
            });
            
            document.addEventListener('keyup', (event) => {
                console.log('DEBUG: Key released:', event.code);
                
                switch (event.code) {
                    case 'KeyW':
                        console.log('DEBUG: Forward movement stopped');
                        this.moveForward = false;
                        break;
                    case 'KeyS':
                        console.log('DEBUG: Backward movement stopped');
                        this.moveBackward = false;
                        break;
                    case 'KeyA':
                        console.log('DEBUG: Left movement stopped');
                        this.moveLeft = false;
                        break;
                    case 'KeyD':
                        console.log('DEBUG: Right movement stopped');
                        this.moveRight = false;
                        break;
                    case 'ShiftLeft':
                    case 'ShiftRight':
                        console.log('DEBUG: Sprint stopped');
                        this.isSprinting = false;
                        break;
                }
                
                // Update local player movement flags
                if (this.localPlayer) {
                    console.log('DEBUG: Updating local player movement flags');
                    this.localPlayer.setMovementFlags(
                        this.moveForward,
                        this.moveBackward,
                        this.moveLeft,
                        this.moveRight,
                        this.isSprinting
                    );
                }
            });
            
            console.log("DEBUG: Event listeners set up successfully");
        } catch (error) {
            console.error("DEBUG: Error setting up event listeners:", error);
        }
    }
    
    // Handle shooting
    shoot() {
        console.log("DEBUG: Shoot method called");
        
        // Check if we're in a valid state to shoot
        if (!this.isRunning || !document.pointerLockElement) {
            console.log("DEBUG: Cannot shoot - game not running or pointer not locked");
            return;
        }
        
        // Play appropriate sound based on aiming state
        if (this.isAimingDownSights) {
            console.log("DEBUG: Playing Kar98 gunshot sound (aiming down sights)");
            audioManager.play('kar98_shot');
            
            // Apply stronger recoil when aiming down sights for more noticeable effect
            this.applyRecoil(0.15);
        } else {
            console.log("DEBUG: Playing regular gunshot sound");
            audioManager.play('gunshot');
            
            // Apply standard recoil when hip firing
            this.applyRecoil(0.1);
        }
        
        // Create bullet impact
        this.createBulletImpact();
    }
    
    // Apply recoil effect to the weapon
    applyRecoil(amount) {
        console.log("DEBUG: Applying recoil effect with new implementation");
        
        // Set recoil parameters
        this.recoil.intensity = amount;
        this.recoil.active = true;
        this.recoil.startTime = performance.now();
        
        // Store current weapon position and rotation for recovery
        if (this.weaponModel) {
            this.recoil.weaponOffset.copy(this.weaponModel.position);
            this.recoil.weaponRotation.copy(this.weaponModel.rotation);
        }
        
        // Instead of directly modifying camera rotation, we'll apply recoil
        // only to the weapon model and use a screen shake effect
        this.applyScreenShake(amount);
    }
    
    // Apply a screen shake effect instead of directly modifying camera rotation
    applyScreenShake(intensity) {
        // Create a subtle screen shake effect
        if (this.camera) {
            // Apply a quick upward impulse to the camera
            const impulse = new THREE.Vector3(
                (Math.random() - 0.5) * 0.01 * intensity, // Slight random horizontal movement
                intensity * 0.02,                         // Upward movement
                0
            );
            
            // Apply impulse to camera position
            this.camera.position.add(impulse);
            
            // Schedule a quick recovery of camera position
            setTimeout(() => {
                this.camera.position.sub(impulse);
            }, 50);
        }
    }
    
    // Create bullet impact when shooting
    createBulletImpact() {
        console.log("DEBUG: Creating bullet impact");
        
        // Create a raycaster for bullet trajectory
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Collect all objects that could be hit
        const sceneObjects = [...this.scene.children];
        
        // Add player models to the list of objects that can be hit
        const playerModels = [];
        for (const playerId in this.players) {
            const player = this.players[playerId];
            // Skip local player - can't shoot yourself
            if (player.isLocal) continue;
            
            // Add player model to the list if it exists
            if (player.model) {
                playerModels.push({
                    playerId: playerId,
                    model: player.model
                });
                sceneObjects.push(player.model);
            }
        }
        
        // Check for intersections with all objects
        const intersects = raycaster.intersectObjects(sceneObjects, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            console.log("DEBUG: Bullet hit object at", hit.point);
            
            // Check if the hit object is a player model
            let hitPlayer = null;
            for (const playerInfo of playerModels) {
                if (hit.object.isDescendantOf && hit.object.isDescendantOf(playerInfo.model)) {
                    hitPlayer = playerInfo;
                    break;
                }
                
                // Alternative check if isDescendantOf is not available
                let parent = hit.object;
                while (parent) {
                    if (parent === playerInfo.model) {
                        hitPlayer = playerInfo;
                        break;
                    }
                    parent = parent.parent;
                }
                
                if (hitPlayer) break;
            }
            
            if (hitPlayer) {
                console.log(`DEBUG: Hit player ${hitPlayer.playerId} at`, hit.point);
                
                // Send hit event to server
                if (this.socket && this.socket.connected) {
                    this.socket.emit('playerHit', {
                        targetId: hitPlayer.playerId,
                        hitPosition: {
                            x: hit.point.x,
                            y: hit.point.y,
                            z: hit.point.z
                        },
                        hitIntensity: this.isAimingDownSights ? 1.5 : 1.0 // More damage when aiming
                    });
                }
                
                // Create blood particle effect instead of regular impact
                this.createBloodEffect(hit.point);
            } else {
                // Regular environment hit
                // Create bullet hole
                const bulletHoleMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                
                const bulletHole = new THREE.Mesh(
                    new THREE.CircleGeometry(0.03, 8),
                    bulletHoleMaterial
                );
                
                // Position slightly off the surface to prevent z-fighting
                bulletHole.position.copy(hit.point);
                bulletHole.position.add(hit.face.normal.multiplyScalar(0.01));
                
                // Orient to face normal
                bulletHole.lookAt(new THREE.Vector3().copy(hit.point).add(hit.face.normal));
                
                // Add to scene
                this.scene.add(bulletHole);
                
                // Create impact particles
                this.createImpactParticles(hit.point, hit.face.normal);
            }
        } else {
            console.log("DEBUG: Bullet didn't hit anything");
        }
    }
    
    // Create blood effect for player hits
    createBloodEffect(position) {
        console.log("DEBUG: Creating blood effect at", position);
        
        // Create blood particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Create blood particle material (red)
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xcc0000,
            size: 0.05,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        // Set initial positions
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Create velocity array for particles
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            velocities.push(velocity);
        }
        
        // Animate particles
        const startTime = performance.now();
        const animateParticles = () => {
            const positions = particles.geometry.attributes.position.array;
            const elapsed = performance.now() - startTime;
            
            // Update particle positions
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y - 0.01; // Add gravity
                positions[i * 3 + 2] += velocities[i].z;
                
                // Slow down particles
                velocities[i].multiplyScalar(0.95);
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particles.material.opacity = 1.0 - elapsed / 500;
            
            // Remove particles after 0.5 seconds
            if (elapsed < 500) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        // Start animation
        requestAnimationFrame(animateParticles);
    }
    
    // Create particles for bullet impact
    createImpactParticles(position, normal) {
        console.log("DEBUG: Creating impact particles");
        
        // Create a simple version of impact particles
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.05,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        // Set initial positions
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Create velocity array for particles
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3 + 0.2, // Slight upward bias
                (Math.random() - 0.5) * 0.3
            );
            
            // Adjust velocity to spray outward from impact
            velocity.add(normal.clone().multiplyScalar(0.1));
            velocities.push(velocity);
        }
        
        // Animate particles
        const startTime = performance.now();
        const animateParticles = () => {
            const positions = particles.geometry.attributes.position.array;
            const elapsed = performance.now() - startTime;
            
            // Update particle positions
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y - 0.01; // Add gravity
                positions[i * 3 + 2] += velocities[i].z;
                
                // Slow down particles
                velocities[i].multiplyScalar(0.9);
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particles.material.opacity = 1.0 - elapsed / 500;
            
            // Remove particles after 0.5 seconds
            if (elapsed < 500) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        // Start animation
        requestAnimationFrame(animateParticles);
    }
    
    // Update debug information display
    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) return;
        
        // Calculate effective speed
        const effectiveSpeed = this.isSprinting ? this.playerSpeed * this.sprintMultiplier : this.playerSpeed;
        
        // Get static player speed
        const staticPlayerSpeed = 2.0;
        
        // Check if player is moving
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        
        // Get player position
        const position = this.camera.position;
        
        // Build debug info string
        let info = `
            FPS: ${(1000 / (performance.now() - this.prevTime)).toFixed(1)}<br>
            Player Speed: ${effectiveSpeed.toFixed(1)} (${this.isSprinting ? 'Sprinting' : 'Walking'})<br>
            Static Player Speed: ${staticPlayerSpeed.toFixed(1)}<br>
            Moving: ${isMoving ? 'Yes' : 'No'}<br>
            Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})<br>
            Movement System: Direct control<br>
        `;
        
        // Add remote player info
        let remotePlayers = '';
        
        // Check if this.players exists and is an object
        if (this.players && typeof this.players === 'object') {
            // Use Object.entries to iterate over the players object
            Object.entries(this.players).forEach(([id, player]) => {
                if (player && !player.isLocal && player.position) {
                    remotePlayers += `<br>- ${id}: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)})`;
                }
            });
        }
        
        if (remotePlayers) {
            info += `<br>Remote Players:${remotePlayers}`;
        }
        
        // Update the debug info display
        debugInfo.innerHTML = info;
    }

    // Create a simple weapon model
    createSimpleWeaponModel() {
        console.log("DEBUG: Creating detailed Kar98 rifle model");
        const weaponGroup = new THREE.Group();
        weaponGroup.name = "playerWeapon"; // Give it a unique name
        
        try {
            // Load textures for wood and metal
            const textureLoader = new THREE.TextureLoader();
            const woodTexture = textureLoader.load('assets/textures/wood2.jpg',
                () => console.log('DEBUG: Wood texture loaded successfully'),
                undefined,
                (err) => console.error('ERROR: Failed to load wood texture', err)
            );
            const metalTexture = textureLoader.load('textures/metal.jpg',
                () => console.log('DEBUG: Metal texture loaded successfully'),
                undefined,
                (err) => console.error('ERROR: Failed to load metal texture', err)
            );

            // Main wooden stock with texture
            const stockGeometry = new THREE.BoxGeometry(0.06, .04, .6);
            const stockMaterial = new THREE.MeshStandardMaterial({ 
                map: woodTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            console.log('DEBUG: Stock material properties:', stockMaterial);
            const stock = new THREE.Mesh(stockGeometry, stockMaterial);
            stock.position.set(0, 0.02, -0.3);
            console.log('DEBUG: Stock position:', stock.position);
            stock.name = "weaponStock";
            weaponGroup.add(stock);

            // Stock grip with texture
            const gripGeometry = new THREE.BoxGeometry(0.06, .04, .08);
            const gripMaterial = new THREE.MeshStandardMaterial({ 
                map: woodTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            const grip = new THREE.Mesh(gripGeometry, gripMaterial);
            grip.position.set(0, -.003, .02);
            grip.rotation.x = Math.PI / 7;
            grip.name = "weaponGrip";
            weaponGroup.add(grip);

            // Butt with texture
            const buttGeometry = new THREE.BoxGeometry(0.06, .04, .08);
            const buttMaterial = new THREE.MeshStandardMaterial({ 
                map: woodTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            const butt = new THREE.Mesh(buttGeometry, buttMaterial);
            butt.position.set(0, -.03, .09);
            butt.rotation.x = Math.PI / 12;
            butt.name = "weaponButt";
            weaponGroup.add(butt);

            // Barrel with texture
            const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.8, 16);
            const barrelMaterial = new THREE.MeshStandardMaterial({ 
                map: metalTexture,
                roughness: 0.5,
                metalness: 0.8
            });
            console.log('DEBUG: Barrel material properties:', barrelMaterial);
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0.03, -0.35);
            console.log('DEBUG: Barrel position:', barrel.position);
            barrel.name = "weaponBarrel";
            weaponGroup.add(barrel);

            // Bolt sleeve group
            const boltSleeveGroup = new THREE.Group();
            boltSleeveGroup.name = "weaponBoltSleeveGroup";
            weaponGroup.add(boltSleeveGroup);
            boltSleeveGroup.position.set(-.04, .025, -0.09);

            // Bolt sleeve
            const boltSleeveGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
            const boltMaterial = new THREE.MeshStandardMaterial({ 
                map: metalTexture,
                roughness: 0.3,
                metalness: 0.9
            });
            const boltSleeve = new THREE.Mesh(boltSleeveGeometry, boltMaterial);
            boltSleeve.rotation.x = Math.PI / 2;
            boltSleeve.position.set(0.04, 0.019, .05);
            boltSleeve.name = "weaponBoltSleeve";
            boltSleeveGroup.add(boltSleeve);  

            // Bolt group
            const boltGroup = new THREE.Group();
            boltGroup.name = "weaponBoltGroup";
            weaponGroup.add(boltGroup);
            boltGroup.position.set(-0.02, 0.023, -0.09);

            // Bolt mechanism with texture
            const boltGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
            console.log('DEBUG: Bolt material properties:', boltMaterial);
            const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
            bolt.rotation.z = Math.PI / 2;
            bolt.position.set(0.04, 0.019, .05);
            console.log('DEBUG: Bolt position:', bolt.position);
            bolt.name = "weaponBolt";
            boltGroup.add(bolt);

            // Bolt handle with texture
            const boltHandleGeometry = new THREE.CylinderGeometry(0.007, 0.007, 0.05, 8);
            const boltHandle = new THREE.Mesh(boltHandleGeometry, boltMaterial);

            // Position it at the end of the bolt
            boltHandle.position.set(0.065, 0.002, .05);

            // Rotate it to a 45-degree angle (default cylinder is vertical)
            boltHandle.rotation.z = Math.PI / 4; // 45 degrees in radians

            boltHandle.name = "weaponBoltHandle";
            boltGroup.add(boltHandle);

            // add ball at end of bolt handle
            const boltHandleBallGeometry = new THREE.SphereGeometry(0.01, 8, 8);
            const boltHandleBall = new THREE.Mesh(boltHandleBallGeometry, boltMaterial);
            boltHandleBall.position.set(0.083, -0.015, .05);
            boltHandleBall.name = "weaponBoltHandleBall";
            boltGroup.add(boltHandleBall);

            // Create detailed iron sights
            this.createDetailedKar98IronSights(weaponGroup);

            // Create a simple trigger group
            const triggerGroup = new THREE.Group();
            triggerGroup.name = "weaponTriggerGroup";
            weaponGroup.add(triggerGroup);

            // Create a simple trigger
            const triggerGeometry = new THREE.BoxGeometry(0.005, 0.01, 0.005);
            const trigger = new THREE.Mesh(triggerGeometry, boltMaterial);
            trigger.position.set(-0.02, -0.006, -.034);
            trigger.name = "weaponTrigger";
            triggerGroup.add(trigger);

            // Position the weapon in front of the camera
            weaponGroup.position.set(0.25, -0.25, -0.5);
            weaponGroup.rotation.y = Math.PI / 8;
            console.log('DEBUG: Weapon group position:', weaponGroup.position);
            console.log('DEBUG: Weapon group rotation:', weaponGroup.rotation);

            console.log("DEBUG: Detailed Kar98 model created successfully:", weaponGroup);
            console.log("DEBUG: Weapon position:", weaponGroup.position);
            console.log("DEBUG: Weapon rotation:", weaponGroup.rotation);

            // Add ambient light to ensure the model is visible
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            weaponGroup.add(ambientLight);

            // Add directional light to create shadows and highlights
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0, 1, 0);
            weaponGroup.add(directionalLight);

            // IMPORTANT: Do not add to scene here, it will be added to the camera later
            return weaponGroup;
        } catch (error) {
            console.error("DEBUG: Failed to create detailed Kar98 model:", error);
            
            // Fallback to a simple model if the detailed one fails
            console.log("DEBUG: Creating fallback simple weapon model");
            const fallbackGroup = new THREE.Group();
            fallbackGroup.name = "fallbackWeapon";
            
            // Main rifle body
            const rifleBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.05, 0.6),
                new THREE.MeshBasicMaterial({ color: 0x5c3a21 }) // Brown wood color
            );
            rifleBody.name = "fallbackBody";
            fallbackGroup.add(rifleBody);
            
            // Barrel
            const barrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8),
                new THREE.MeshBasicMaterial({ color: 0x444444 }) // Dark metal color
            );
            barrel.rotation.x = Math.PI / 2;
            barrel.position.z = -0.35;
            barrel.position.y = 0.01;
            barrel.name = "fallbackBarrel";
            fallbackGroup.add(barrel);
            
            // Position the weapon in front of the camera
            fallbackGroup.position.set(0.25, -0.25, -0.5);
            fallbackGroup.rotation.y = Math.PI / 8;
            
            console.log("DEBUG: Fallback model created:", fallbackGroup);
            
            // IMPORTANT: Do not add to scene here, it will be added to the camera later
            
            return fallbackGroup;
        }
    }
    
    // Create detailed iron sights for the Kar98
    createDetailedKar98IronSights(weaponGroup) {
        // curved housing for the front sight
        const vectA = new THREE.Vector3(.1,.05,-.09); //origin
        const vectB = new THREE.Vector3(.1,.05,-.09); //tangent
        const vectC = new THREE.Vector3(.1,.05,-.09); //destination

        const curve = new THREE.QuadraticBezierCurve3(vectA,vectB,vectC);
        const mesh = new THREE.Mesh( new THREE.TubeGeometry( curve, 20, 1, 2, false ) );
        mesh.position.set(0,0.09,-.19);
        mesh.name = "frontSightHousing";
        weaponGroup.add(mesh);

        // Front sight housing (the metal base that holds the front sight)
        const frontSightHousingGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.02);
        const sightMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Dark metal color
        const frontSightHousing = new THREE.Mesh(frontSightHousingGeometry, sightMaterial);
        frontSightHousing.position.set(0, 0.06, -0.7);
        weaponGroup.add(frontSightHousing);
        
        // Front sight post (the thin vertical blade you align with the target)
        const frontSightPostGeometry = new THREE.BoxGeometry(0.002, 0.02, 0.002); // Thinner and shorter
        const frontSightPost = new THREE.Mesh(frontSightPostGeometry, sightMaterial);
        frontSightPost.position.set(0, 0.07, -0.7); // Lowered further
        frontSightPost.name = "frontSightPost"; // Name it for easy reference
        weaponGroup.add(frontSightPost);
        
        // Front sight protective wings (the metal pieces that protect the front sight)
        const frontSightWingGeometry = new THREE.BoxGeometry(0.01, 0.02, 0.002); // Shorter height
        
        // Left wing
        const leftWing = new THREE.Mesh(frontSightWingGeometry, sightMaterial);
        leftWing.position.set(-0.015, 0.07, -0.7); // Match front sight position
        weaponGroup.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(frontSightWingGeometry, sightMaterial);
        rightWing.position.set(0.015, 0.07, -0.7); // Match front sight position
        weaponGroup.add(rightWing);
        
        // Rear sight base (the metal piece that holds the rear sight)
        const rearSightBaseGeometry = new THREE.BoxGeometry(0.05, 0.01, 0.03);
        const rearSightBase = new THREE.Mesh(rearSightBaseGeometry, sightMaterial);
        rearSightBase.position.set(0, 0.05, -0.13);
        weaponGroup.add(rearSightBase);
        
        // Rear sight aperture (the V-notch or hole you look through)
        // For Kar98, we'll create a V-notch style rear sight
        const rearSightNotchGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 3); // Wider triangular prism
        const rearSightNotch = new THREE.Mesh(rearSightNotchGeometry, sightMaterial);
        rearSightNotch.rotation.x = Math.PI / 2;
        rearSightNotch.rotation.z = Math.PI; // Rotate to get the V shape pointing up
        rearSightNotch.position.set(0, 0.065, -0.1); // Slightly higher than front sight
        rearSightNotch.name = "rearSightAperture"; // Name it for easy reference
        weaponGroup.add(rearSightNotch);
        
        //console.log('DEBUG: Iron sights created with front sight at', frontSightPost.position, 'and rear sight at', rearSightNotch.position);
        
        return weaponGroup;
    }

    // Log scene hierarchy
    logSceneHierarchy(scene) {
        const hierarchy = [];
        this.traverseScene(scene, hierarchy);
        console.log('Scene hierarchy:', hierarchy.join('\n'));
    }

    traverseScene(object, hierarchy) {
        if (object instanceof THREE.Group) {
            const children = object.children;
            hierarchy.push(`${object.name || 'Group'} (${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)})`);
            children.forEach(child => this.traverseScene(child, hierarchy));
        } else if (object instanceof THREE.Mesh) {
            hierarchy.push(`${object.name || 'Mesh'} (${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)})`);
        }
    }

    // Handle window resize
    onWindowResize() {
        this.camera.left = window.innerWidth * -0.5;
        this.camera.right = window.innerWidth * 0.5;
        this.camera.top = window.innerHeight * 0.5;
        this.camera.bottom = window.innerHeight * -0.5;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Apply screen vibration effect when hit by another player
    applyHitEffect(intensity) {
        console.log("DEBUG: Applying hit effect with intensity:", intensity);
        
        // Create a more intense screen shake effect than the recoil
        if (this.camera) {
            // Apply a series of random impulses to simulate being hit
            const applyShake = (iteration, maxIterations, baseIntensity) => {
                if (iteration >= maxIterations) return;
                
                // Calculate decreasing intensity
                const currentIntensity = baseIntensity * (1 - iteration / maxIterations);
                
                // Create random impulse
                const impulse = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05 * currentIntensity,
                    (Math.random() - 0.5) * 0.05 * currentIntensity,
                    0
                );
                
                // Apply impulse to camera position
                this.camera.position.add(impulse);
                
                // Schedule recovery and next shake
                setTimeout(() => {
                    // Remove the impulse
                    this.camera.position.sub(impulse);
                    
                    // Apply next shake after a short delay
                    setTimeout(() => {
                        applyShake(iteration + 1, maxIterations, baseIntensity);
                    }, 50);
                }, 50);
            };
            
            // Start the shake effect with 5 iterations
            applyShake(0, 5, intensity);
            
            // Add a red flash overlay to indicate damage
            this.showDamageOverlay(intensity);
        }
    }
    
    // Show a red flash overlay to indicate taking damage
    showDamageOverlay(intensity) {
        // Create or get the damage overlay element
        let overlay = document.getElementById('damage-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'damage-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = 'background-color 0.1s ease-in, background-color 0.5s ease-out';
            overlay.style.zIndex = '1000';
            document.body.appendChild(overlay);
        }
        
        // Set the overlay opacity based on hit intensity
        const opacity = Math.min(0.6, intensity * 0.3);
        overlay.style.backgroundColor = `rgba(255, 0, 0, ${opacity})`;
        
        // Fade out the overlay
        setTimeout(() => {
            overlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        }, 100);
    }
}