import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { io } from 'socket.io-client';

console.log("Script loaded");

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM loaded, initializing game...");
        
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
        console.log(`Creating model for player ${this.id}`);
        
        try {
            // Create a group to hold all player parts
            console.log("Creating model group");
            this.model = new THREE.Group();
            
            // Materials
            console.log("Creating materials");
            const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xd4b78f }); // Warmer skin tone
            const uniformMaterial = new THREE.MeshLambertMaterial({ color: 0x3b3c36 }); // Feldgrau (German field gray)
            const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a }); // Dark gray for helmet
            const leatherMaterial = new THREE.MeshLambertMaterial({ color: 0x342920 }); // Dark brown for leather
            const blackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Black for boots and equipment
            
            // Head (slightly more oval)
            console.log("Creating head");
            const head = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.4, 0.35),
                skinMaterial
            );
            head.position.y = 1.6;
            head.name = 'head';
            this.model.add(head);
            
            // Helmet (more accurate Stahlhelm shape)
            console.log("Creating helmet");
            const helmet = new THREE.Group();
            
            // Main helmet dome
            const helmetDome = new THREE.Mesh(
                new THREE.BoxGeometry(0.45, 0.25, 0.45),
                helmetMaterial
            );
            helmetDome.position.y = 1.8;
            helmet.add(helmetDome);
            
            // Helmet brim (wider and angled)
            const helmetBrim = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.05, 0.55),
                helmetMaterial
            );
            helmetBrim.position.y = 1.7;
            helmet.add(helmetBrim);
            
            // Helmet neck guard (characteristic of Stahlhelm)
            const neckGuard = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.1, 0.2),
                helmetMaterial
            );
            neckGuard.position.set(0, 1.7, 0.2);
            helmet.add(neckGuard);
            
            this.model.add(helmet);
            
            // Torso (more detailed uniform)
            const torso = new THREE.Group();
            
            // Main jacket
            const jacket = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.9, 0.35),
                uniformMaterial
            );
            jacket.position.y = 1.1;
            torso.add(jacket);
            
            // Collar
            const collar = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 0.15, 0.4),
                uniformMaterial
            );
            collar.position.y = 1.45;
            torso.add(collar);
            
            // Belt
            const belt = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 0.1, 0.4),
                leatherMaterial
            );
            belt.position.y = 0.75;
            torso.add(belt);
            
            // Equipment pouches
            const leftPouch = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.2, 0.15),
                leatherMaterial
            );
            leftPouch.position.set(0.3, 0.75, 0.2);
            torso.add(leftPouch);
            
            const rightPouch = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.2, 0.15),
                leatherMaterial
            );
            rightPouch.position.set(-0.3, 0.75, 0.2);
            torso.add(rightPouch);
            
            this.model.add(torso);
            
            // Arms (with proper uniform sleeves)
            const leftArm = new THREE.Group();
            const leftArmUpper = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.4, 0.2),
                uniformMaterial
            );
            leftArm.add(leftArmUpper);
            
            const leftArmLower = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.4, 0.18),
                uniformMaterial
            );
            leftArmLower.position.y = -0.4;
            leftArm.add(leftArmLower);
            
            leftArm.position.set(0.4, 1.3, 0);
            leftArm.name = 'leftArm';
            this.model.add(leftArm);
            
            const rightArm = new THREE.Group();
            const rightArmUpper = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.4, 0.2),
                uniformMaterial
            );
            rightArm.add(rightArmUpper);
            
            const rightArmLower = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.4, 0.18),
                uniformMaterial
            );
            rightArmLower.position.y = -0.4;
            rightArm.add(rightArmLower);
            
            rightArm.position.set(-0.4, 1.3, 0);
            rightArm.name = 'rightArm';
            this.model.add(rightArm);
            
            // Legs (with proper uniform trousers and boots)
            const leftLeg = new THREE.Group();
            const leftThigh = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.4, 0.25),
                uniformMaterial
            );
            leftLeg.add(leftThigh);
            
            const leftCalf = new THREE.Mesh(
                new THREE.BoxGeometry(0.23, 0.4, 0.23),
                uniformMaterial
            );
            leftCalf.position.y = -0.4;
            leftLeg.add(leftCalf);
            
            // Boot
            const leftBoot = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.15, 0.3),
                blackMaterial
            );
            leftBoot.position.y = -0.65;
            leftLeg.add(leftBoot);
            
            leftLeg.position.set(0.15, 0.65, 0);
            leftLeg.name = 'leftLeg';
            this.model.add(leftLeg);
            
            const rightLeg = new THREE.Group();
            const rightThigh = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.4, 0.25),
                uniformMaterial
            );
            rightLeg.add(rightThigh);
            
            const rightCalf = new THREE.Mesh(
                new THREE.BoxGeometry(0.23, 0.4, 0.23),
                uniformMaterial
            );
            rightCalf.position.y = -0.4;
            rightLeg.add(rightCalf);
            
            // Boot
            const rightBoot = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.15, 0.3),
                blackMaterial
            );
            rightBoot.position.y = -0.65;
            rightLeg.add(rightBoot);
            
            rightLeg.position.set(-0.15, 0.65, 0);
            rightLeg.name = 'rightLeg';
            this.model.add(rightLeg);
            
            // Add a detailed Kar98k rifle
            const rifle = new THREE.Group();
            rifle.name = 'rifle';
            
            // Wooden stock
            const rifleStock = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.8, 0.08),
                new THREE.MeshLambertMaterial({ color: 0x4a3520 }) // Dark wood color
            );
            rifle.add(rifleStock);
            
            // Metal barrel
            const rifleBarrel = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.9, 0.08),
                new THREE.MeshLambertMaterial({ color: 0x2a2a2a }) // Dark metal
            );
            rifleBarrel.position.y = 0.85;
            rifle.add(rifleBarrel);
            
            // Bolt mechanism
            const rifleBolt = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.15, 0.05),
                new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
            );
            rifleBolt.position.set(0.06, 0.7, 0);
            rifle.add(rifleBolt);
            
            // Front sight
            const frontSight = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.08, 0.02),
                new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
            );
            frontSight.position.set(0, 1.25, 0);
            rifle.add(frontSight);
            
            // Position rifle diagonally across body
            rifle.rotation.z = -Math.PI / 8;
            rifle.rotation.y = Math.PI / 16;
            rifle.position.set(-0.2, 1.0, -0.1);
            this.model.add(rifle);
            
            // Add a gas mask container (characteristic of German soldiers)
            const gasMaskContainer = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.25, 0.15),
                leatherMaterial
            );
            gasMaskContainer.position.set(0.35, 0.9, 0.2);
            this.model.add(gasMaskContainer);
            
            // Add bread bag
            const breadBag = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.2, 0.15),
                new THREE.MeshLambertMaterial({ color: 0x5c4033 })
            );
            breadBag.position.set(-0.35, 0.9, 0.2);
            this.model.add(breadBag);
            
            // Add the model to the scene
            if (this.game && this.game.scene) {
                console.log(`Adding model for player ${this.id} to scene`);
                this.game.scene.add(this.model);
                
                // Set initial position
                this.model.position.copy(this.position);
                this.model.position.y = 0; // Keep y at 0 to ensure feet are on ground
                this.model.rotation.y = this.rotation.y;
                
                // If this is the local player, hide the model since we're in first person
                if (this.isLocal) {
                    console.log("Local player - hiding model");
                    this.model.visible = false;
                } else {
                    console.log(`Remote player ${this.id} - model visible at position:`, this.model.position);
                }
            } else {
                console.error(`Cannot add model for player ${this.id} - game or scene not available`);
            }
            
            console.log(`Model creation complete for player ${this.id}`);
        } catch (error) {
            console.error(`Error creating model for player ${this.id}:`, error);
        }
    }

    // Update player position and rotation based on controls (for local player)
    // or based on network data (for remote players)
    update(delta) {
        if (this.isLocal) {
            // Local player's position is controlled by the camera/controls
            if (this.game && this.game.camera) {
                this.position.copy(this.game.camera.position);
                this.rotation.y = this.game.camera.rotation.y;
            }
        } else {
            // Remote player - use improved interpolation
            const LERP_FACTOR = Math.min(1, delta * 15); // Adjust interpolation speed
            
            // Interpolate position with improved smoothing
            this.position.lerp(this.targetPosition, LERP_FACTOR);
            
            // Interpolate rotation with improved smoothing
            const deltaRotation = this.targetRotation.y - this.rotation.y;
            const adjustedRotation = deltaRotation > Math.PI ? deltaRotation - Math.PI * 2 : 
                                   deltaRotation < -Math.PI ? deltaRotation + Math.PI * 2 : 
                                   deltaRotation;
            this.rotation.y += adjustedRotation * LERP_FACTOR;
            
            // Update model position and rotation
            if (this.model) {
                this.model.position.copy(this.position);
                this.model.position.y = 0; // Keep y at 0 to ensure feet are on ground
                this.model.rotation.y = this.rotation.y;
                
                // Animate the model based on movement
                this.animateModel(delta);
            }
        }
    }
    
    // Separate method for model animation
    animateModel(delta) {
        if (!this.model || !this.model.children) return;
        
        const isMoving = 
            this.position.distanceTo(this.targetPosition) > 0.01 ||
            Math.abs(this.rotation.y - this.targetRotation.y) > 0.01;
        
        if (isMoving) {
            // Calculate animation speed
            const animSpeed = this.isSprinting ? 15 : 10;
            
            // Update animation timers
            if (!this.legSwing) this.legSwing = 0;
            if (!this.armSwing) this.armSwing = 0;
            
            this.legSwing += delta * animSpeed;
            this.armSwing = this.legSwing;
            
            // Apply animations
            this.model.children.forEach(part => {
                switch(part.name) {
                    case 'leftLeg':
                        part.rotation.x = Math.sin(this.legSwing) * 0.5;
                        break;
                    case 'rightLeg':
                        part.rotation.x = Math.sin(this.legSwing + Math.PI) * 0.5;
                        break;
                    case 'leftArm':
                        part.rotation.x = Math.sin(this.armSwing + Math.PI) * 0.5;
                        break;
                    case 'rightArm':
                        part.rotation.x = Math.sin(this.armSwing) * 0.5;
                        break;
                }
            });
        } else {
            // Reset animations when not moving
            this.model.children.forEach(part => {
                if (['leftLeg', 'rightLeg', 'leftArm', 'rightArm'].includes(part.name)) {
                    part.rotation.x = 0;
                }
            });
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
        if (!this.isLocal) {
            const timestamp = Date.now();
            
            // Store the position update with timestamp
            if (!this.positionBuffer) {
                this.positionBuffer = [];
            }
            
            this.positionBuffer.push({
                position: new THREE.Vector3(position.x, position.y, position.z),
                rotation: new THREE.Euler(rotation.x, rotation.y, rotation.z),
                timestamp
            });
            
            // Keep only the last 10 updates
            while (this.positionBuffer.length > 10) {
                this.positionBuffer.shift();
            }
            
            // Set immediate target for interpolation
            this.targetPosition.set(position.x, position.y, position.z);
            this.targetRotation.set(rotation.x, rotation.y, rotation.z);
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
            
            // Update debug message
            const debugDiv = document.querySelector('div[style*="Game initializing"]');
            if (debugDiv) {
                debugDiv.textContent = 'Setting up scene...';
            }
            
            // Initialize properties
            console.log("Creating scene");
            this.scene = new THREE.Scene();
            console.log("Creating camera");
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            console.log("Creating renderer");
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Setting up renderer...';
            }
            
            // Set up renderer
            console.log("Setting renderer size");
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            console.log("Enabling shadow maps");
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Find game container
            console.log("Finding game container");
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                console.error("Game container not found!");
                
                // Update debug message
                const debugDiv = document.querySelector('div[style*="Setting up"]');
                if (debugDiv) {
                    debugDiv.textContent = 'ERROR: Game container not found!';
                    debugDiv.style.color = 'red';
                }
                
                // Create game container if it doesn't exist
                console.log("Creating new game container");
                const newContainer = document.createElement('div');
                newContainer.id = 'game-container';
                newContainer.style.width = '100%';
                newContainer.style.height = '100%';
                newContainer.style.position = 'absolute';
                newContainer.style.top = '0';
                newContainer.style.left = '0';
                document.body.appendChild(newContainer);
                
                // Update debug message
                if (debugDiv) {
                    debugDiv.textContent = 'Created missing game container';
                    debugDiv.style.color = 'orange';
                }
                
                // Use the newly created container
                this.gameContainer = newContainer;
            } else {
                console.log("Game container found");
                this.gameContainer = gameContainer;
            }
            
            // Append renderer to container
            console.log("Appending renderer to container");
            this.gameContainer.appendChild(this.renderer.domElement);
            
            // Set up camera and controls
            console.log("Setting up camera position");
            this.camera.position.y = 1.6; // Eye level
            console.log("Creating pointer lock controls");
            this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Setting up controls...';
            }
            
            // Add controls to scene to ensure they're properly initialized
            console.log("Adding controls to scene");
            this.scene.add(this.controls.getObject());
            
            // Movement variables
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
            this.isSprinting = false;
            this.sprintMultiplier = 2.0; // Increased from 1.5 for more noticeable sprint
            this.isRunning = false; // Game state (paused/running)
            
            // Physics variables
            this.velocity = new THREE.Vector3();
            this.direction = new THREE.Vector3();
            this.playerSpeed = 2.0; // Reduced from 5.0 for better matching with static player
            this.prevTime = performance.now();
            this.lastFrameTime = performance.now();
            
            // Animation variables
            this.animationClock = 0;
            
            // Debug mode
            this.debugMode = true;
            
            // Players collection
            this.players = new Map();
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Creating environment...';
            }
            
            // Create a simple test environment
            this.createSimpleTestEnvironment();
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Creating local player...';
            }
            
            // Create local player
            this.createLocalPlayer();
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Initializing network...';
            }
            
            // Initialize network (before creating test players)
            try {
                this.initNetwork();
            } catch (error) {
                console.error("Error initializing network:", error);
                
                // Update debug message
                if (debugDiv) {
                    debugDiv.textContent = 'Network error, continuing with offline mode...';
                    debugDiv.style.color = 'orange';
                }
            }
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Creating test players...';
            }
            
            // Create some test remote players (for development)
            this.createTestRemotePlayers();
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Setting up event listeners...';
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Starting animation loop...';
            }
            
            // Start animation loop
            this.animate();
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Game initialized successfully!';
                debugDiv.style.color = 'green';
                
                // Hide debug message after 5 seconds
                setTimeout(() => {
                    debugDiv.style.opacity = '0';
                    debugDiv.style.transition = 'opacity 1s';
                }, 5000);
            }
            
            console.log("Game initialized successfully");
        } catch (error) {
            console.error("Error initializing game:", error);
        }
    }
    
    // Create the local player
    createLocalPlayer() {
        console.log("Creating local player");
        
        try {
            const localPlayerId = 'local-player';
            console.log("Creating local player with ID:", localPlayerId);
            
            // Set y to the camera height (1.6) for the local player
            const localPlayer = new Player(localPlayerId, this, true);
            console.log("Local player instance created");
            
            // Create the player model
            console.log("Creating local player model");
            localPlayer.createModel();
            console.log("Local player model created");
            
            // Add to players collection
            this.players.set(localPlayerId, localPlayer);
            this.localPlayer = localPlayer;
            
            console.log("Local player created successfully");
        } catch (error) {
            console.error("Error creating local player:", error);
        }
    }
    
    // Create some test remote players (for development)
    createTestRemotePlayers() {
        // Only create test players if we're in test mode or not connected to a server
        if (this.socket && this.socket.connected) {
            console.log("Connected to real server, skipping test players");
            return;
        }
        
        console.log("Creating test remote players");
        
        // Create 3 test remote players at different positions
        const positions = [
            { x: 0, y: 0, z: -5 },  // Directly in front
            { x: -3, y: 0, z: -5 }, // To the left
            { x: 3, y: 0, z: -5 }   // To the right
        ];
        
        positions.forEach((pos, index) => {
            const playerId = `remote-player-${index}`;
            console.log(`Creating test player ${playerId} at position:`, pos);
            
            const remotePlayer = new Player(playerId, this, false, pos);
            remotePlayer.createModel();
            
            // Ensure the model is visible and properly positioned
            if (remotePlayer.model) {
                remotePlayer.model.position.copy(remotePlayer.position);
                remotePlayer.model.visible = true;
                console.log(`Player ${playerId} model position:`, remotePlayer.model.position);
            }
            
            this.players.set(playerId, remotePlayer);
            console.log(`Test remote player ${playerId} created and added to players map`);
        });
        
        // Log the total number of players
        console.log(`Total players in game: ${this.players.size}`);
        
        // Log all players' positions
        this.players.forEach((player, id) => {
            console.log(`Player ${id} position:`, player.position);
            if (player.model) {
                console.log(`Player ${id} model position:`, player.model.position);
            }
        });
    }
    
    // Initialize network functionality
    initNetwork() {
        // Connect to the server
        console.log('Connecting to server...');
        
        try {
            // Use socket.io for WebSocket communication
            const serverUrl = window.location.hostname === 'localhost' ? 
                'http://localhost:3000' : // Use explicit URL when running locally
                `${window.location.protocol}//${window.location.hostname}:3000`; // Use port 3000 for network connections
            
            console.log('Connecting to server at:', serverUrl);
            
            // Create socket instance with updated configuration
            this.socket = io(serverUrl, {
                path: '/socket.io/',
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                autoConnect: true,
                forceNew: true,
                withCredentials: true
            });
            
            // Debug connection state
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                console.log('Current transport:', this.socket.io.engine?.transport?.name);
                console.log('Connection details:', {
                    url: serverUrl,
                    protocol: window.location.protocol,
                    hostname: window.location.hostname,
                    port: window.location.port
                });
            });

            this.socket.on('connect_timeout', () => {
                console.error('Connection timeout');
            });

            this.socket.on('connect', () => {
                console.log('Connected to server with ID:', this.socket.id);
                console.log('Using transport:', this.socket.io.engine.transport.name);
                
                // Remove any existing test players
                this.players.forEach((player, id) => {
                    if (id !== 'local-player' && !player.isLocal) {
                        this.removePlayer(id);
                    }
                });
                
                // Update local player ID to match socket ID
                if (this.localPlayer) {
                    this.localPlayer.id = this.socket.id;
                }
                
                // Request current players list from server
                this.socket.emit('request-players');
            });
            
            // Handle receiving current players list
            this.socket.on('players-list', (players) => {
                console.log('Received players list:', players);
                players.forEach(player => {
                    if (player.id !== this.socket.id && !this.players.has(player.id)) {
                        this.addRemotePlayer(player.id, player.position);
                    }
                });
            });
            
            // Handle new player joining
            this.socket.on('player-joined', (data) => {
                console.log('Player joined:', data);
                if (data.id !== this.socket.id && !this.players.has(data.id)) {
                    this.addRemotePlayer(data.id, data.position || { x: 0, y: 0, z: 0 });
                }
            });
            
            // Handle player leaving
            this.socket.on('player-left', (data) => {
                console.log('Player left:', data);
                if (data.id && this.players.has(data.id)) {
                    this.removePlayer(data.id);
                }
            });
            
            // Handle player updates
            this.socket.on('player-update', (data) => {
                if (data.id === this.socket.id) return; // Ignore our own updates
                
                const player = this.players.get(data.id);
                if (player && !player.isLocal) {
                    console.log(`Updating player ${data.id} position:`, data.position);
                    player.updateFromNetwork(data.position, data.rotation);
                    player.setMovementFlags(
                        data.moveForward,
                        data.moveBackward,
                        data.moveLeft,
                        data.moveRight,
                        data.isSprinting
                    );
                }
            });
            
            // Set network update interval
            this.networkUpdateInterval = 50; // 20 updates per second
            this.lastNetworkUpdate = 0;
            
        } catch (error) {
            console.error("Error initializing network:", error);
        }
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

    // Main animation loop
    animate() {
        // Request next frame
        requestAnimationFrame(() => this.animate());
        
        try {
            // Calculate delta time
            const now = performance.now();
            const delta = (now - this.lastFrameTime) / 1000;
            this.lastFrameTime = now;
            
            // Skip if game is paused
            if (!this.isRunning) return;
            
            // Handle player movement
            if (this.controls.isLocked) {
                // Calculate movement speed based on sprint state
                const speed = this.isSprinting ? this.playerSpeed * this.sprintMultiplier : this.playerSpeed;
                
                // Calculate movement direction
                this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
                this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
                this.direction.normalize(); // Normalize for consistent speed in all directions
                
                // Apply movement to controls
                if (this.moveForward || this.moveBackward) {
                    this.controls.moveForward(this.direction.z * speed * delta);
                }
                if (this.moveLeft || this.moveRight) {
                    this.controls.moveRight(this.direction.x * speed * delta);
                }
            }
            
            // Update all players
            this.players.forEach(player => {
                player.update(delta);
            });
            
            // Send network updates at fixed intervals
            if (this.socket && this.socket.connected && this.localPlayer) {
                const timeSinceLastUpdate = now - this.lastNetworkUpdate;
                if (timeSinceLastUpdate > this.networkUpdateInterval) {
                    this.sendNetworkUpdate();
                    this.lastNetworkUpdate = now;
                }
            }
            
            // Update debug info if enabled
            if (this.debugMode) {
                this.updateDebugInfo();
            }
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            // Update frame counter for debugging
            if (!this.frameCounter) {
                this.frameCounter = 0;
            }
            this.frameCounter++;
            
            // Log every 60 frames
            if (this.frameCounter % 60 === 0) {
                console.log(`Frame ${this.frameCounter} rendered`);
            }
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    }

    // Send local player data to the network
    sendNetworkUpdate() {
        if (!this.socket || !this.socket.connected || !this.localPlayer) return;
        
        // Get the local player's position and rotation
        const position = this.localPlayer.getPosition();
        const rotation = this.localPlayer.getRotation();
        
        // Send the player's current state to the server
        this.socket.emit('player-update', {
            id: this.socket.id, // Include the player's ID
            position,
            rotation,
            // Include movement flags for smoother animations
            moveForward: this.moveForward,
            moveBackward: this.moveBackward,
            moveLeft: this.moveLeft,
            moveRight: this.moveRight,
            isSprinting: this.isSprinting,
            timestamp: Date.now() // Add timestamp for interpolation
        });
        
        // Debug log
        console.log('Sent position update:', position);
    }

    // Add a remote player to the game
    addRemotePlayer(playerId, position) {
        console.log(`Adding remote player ${playerId} at position:`, position);
        
        // Ensure position is at ground level (y=0)
        const groundedPosition = {
            x: position.x,
            y: 0, // Always set y to 0 to ensure feet are on ground
            z: position.z
        };
        
        const remotePlayer = new Player(playerId, this, false, groundedPosition);
        remotePlayer.createModel();
        this.players.set(playerId, remotePlayer);
        
        console.log(`Remote player ${playerId} added successfully`);
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

    // Set up event listeners for user input
    setupEventListeners() {
        console.log("Setting up event listeners");
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Handle pointer lock
        const gameContainer = document.getElementById('game-container');
        
        gameContainer.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
                this.isRunning = true;
                
                // Enable debug info if in debug mode
                if (this.debugMode) {
                    const debugInfo = document.getElementById('debug-info');
                    if (debugInfo) {
                        debugInfo.style.display = 'block';
                    }
                }
            }
        });
        
        this.controls.addEventListener('lock', () => {
            console.log("Controls locked");
        });
        
        this.controls.addEventListener('unlock', () => {
            console.log("Controls unlocked");
            this.isRunning = false;
            
            // Hide debug info when controls are unlocked
            const debugInfo = document.getElementById('debug-info');
            if (debugInfo) {
                debugInfo.style.display = 'none';
            }
        });
        
        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'ShiftLeft':
                    this.isSprinting = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'ShiftLeft':
                    this.isSprinting = false;
                    break;
            }
        });
        
        console.log("Event listeners set up");
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
        this.players.forEach((player, id) => {
            if (!player.isLocal) {
                remotePlayers += `<br>- ${id}: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)})`;
            }
        });
        
        if (remotePlayers) {
            info += `<br>Remote Players:${remotePlayers}`;
        }
        
        // Update the debug info display
        debugInfo.innerHTML = info;
    }
}