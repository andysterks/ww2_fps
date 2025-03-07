import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { io } from 'socket.io-client';

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

    // Create a 3D model for the player
    createModel() {
        console.log(`DEBUG: Creating model for player ${this.id}`);
        try {
            // Create a group for the player model
            this.model = new THREE.Group();
            this.model.name = `player-${this.id}`;
            
            // Create a simple material for the player
            const uniformMaterial = new THREE.MeshLambertMaterial({ 
                color: this.isLocal ? 0x0000ff : 0xff0000 
            });
            
            // Head
            const head = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                uniformMaterial
            );
            head.position.y = 1.75;
            head.name = 'head';
            this.model.add(head);
            
            // Body
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.8, 0.3),
                uniformMaterial
            );
            body.position.y = 1.1;
            body.name = 'body';
            this.model.add(body);
            
            // Left arm
            const leftArm = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.7, 0.2),
                uniformMaterial
            );
            leftArm.position.set(0.4, 1.1, 0);
            leftArm.name = 'leftArm';
            this.model.add(leftArm);
            
            // Right arm
            const rightArm = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.7, 0.2),
                uniformMaterial
            );
            rightArm.position.set(-0.4, 1.1, 0);
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
            console.log('DEBUG: Creating Kar98k rifle for player model');
            const rifle = new THREE.Group();
            rifle.name = 'playerModelRifle';
            
            // Rifle body
            const rifleBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 1.2),
                new THREE.MeshLambertMaterial({ color: 0x5c2e00 })
            );
            rifleBody.position.z = 0.6;
            rifleBody.name = 'playerModelRifleBody';
            rifle.add(rifleBody);
            
            // Rifle barrel
            const rifleBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            rifleBarrel.rotation.x = Math.PI / 2;
            rifleBarrel.position.z = 1.1;
            rifleBarrel.name = 'playerModelRifleBarrel';
            rifle.add(rifleBarrel);
            
            // Position the rifle in the right hand
            rifle.position.set(-0.6, 1.1, 0.2);
            rifle.rotation.y = Math.PI / 4;
            console.log('DEBUG: Rifle position:', rifle.position);
            console.log('DEBUG: Rifle rotation:', rifle.rotation);
            this.model.add(rifle);
            
            // Add the model to the scene
            if (this.game && this.game.scene) {
                console.log(`DEBUG: Adding model for player ${this.id} to scene`);
                this.game.scene.add(this.model);
                
                // Set initial position
                this.model.position.copy(this.position);
                this.model.position.y = 0; // Keep y at 0 to ensure feet are on ground
                this.model.rotation.y = this.rotation.y;
                console.log(`DEBUG: Player model position:`, this.model.position);
                
                // If this is the local player, hide the model since we're in first person
                if (this.isLocal) {
                    console.log("DEBUG: Local player - hiding model");
                    this.model.visible = false;
                } else {
                    console.log(`DEBUG: Remote player ${this.id} - model visible at position:`, this.model.position);
                }
            } else {
                console.error(`DEBUG: Cannot add model for player ${this.id} - game or scene not available`);
            }
            
            console.log(`DEBUG: Model creation complete for player ${this.id}`);
        } catch (error) {
            console.error(`DEBUG: Error creating model for player ${this.id}:`, error);
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
            console.log("DEBUG: SimpleGame constructor called");
            
            // Update debug message
            const debugDiv = document.querySelector('div[style*="Game initializing"]');
            if (debugDiv) {
                debugDiv.textContent = 'Setting up scene...';
            }
            
            // Initialize properties
            console.log("DEBUG: Creating scene");
            this.scene = new THREE.Scene();
            console.log("DEBUG: Creating camera");
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            console.log("DEBUG: Creating renderer");
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            
            // Camera settings
            this.defaultFOV = 75;
            this.aimingFOV = 45;
            this.aimingDownSightsFOV = 55; // Moderate zoom for iron sights
            this.isAimingDownSights = false;
            this.hasShownAimingMessage = false; // Track if we've shown the aiming message
            
            // Create weapon model - but don't add it to the scene yet
            console.log("DEBUG: About to create Kar98 model");
            this.weaponModel = this.createSimpleWeaponModel();
            console.log("DEBUG: Kar98 model created:", this.weaponModel);
            console.log("DEBUG: Weapon parent after creation:", this.weaponModel.parent ? this.weaponModel.parent.name : 'none');
            
            // IMPORTANT: Add weapon model to camera, not scene
            console.log("DEBUG: Adding weapon model to camera");
            this.camera.add(this.weaponModel);
            console.log("DEBUG: Weapon model parent after adding to camera:", this.weaponModel.parent ? this.weaponModel.parent.name : 'none');
            
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
            
            // Use document.body for pointer lock controls instead of renderer.domElement
            console.log("DEBUG: Creating PointerLockControls with document.body");
            this.controls = new PointerLockControls(this.camera, document.body);
            
            // Log controls properties
            console.log("DEBUG: Controls created:", {
                isLocked: this.controls.isLocked,
                hasControls: !!this.controls,
                hasMoveForward: typeof this.controls.moveForward === 'function',
                hasMoveRight: typeof this.controls.moveRight === 'function',
                domElement: this.controls.domElement
            });
            
            // Update debug message
            if (debugDiv) {
                debugDiv.textContent = 'Setting up controls...';
            }
            
            // Add controls to scene to ensure they're properly initialized
            console.log("DEBUG: Adding controls to scene");
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
        requestAnimationFrame(() => this.animate.call(this));
        
        // Calculate delta time
        const now = performance.now();
        const delta = (now - (this.lastFrameTime || now)) / 1000;
        this.lastFrameTime = now;
        
        // Initialize frame counter if not exists
        if (!this.frameCounter) this.frameCounter = 0;
        this.frameCounter++;
        
        // Limit logging to avoid console spam
        if (this.frameCounter % 60 === 0) {
            console.log('Animation frame, delta:', delta, 'isAimingDownSights:', this.isAimingDownSights);
            console.log('DEBUG: isRunning:', this.isRunning, 'controls.isLocked:', this.controls ? this.controls.isLocked : 'controls not initialized');
            console.log('DEBUG: Movement flags:', {
                moveForward: this.moveForward,
                moveBackward: this.moveBackward,
                moveLeft: this.moveLeft,
                moveRight: this.moveRight,
                isSprinting: this.isSprinting
            });
        }
        
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
            
            // Update weapon position based on movement and aiming
            this.updateWeaponPosition();
            
            // Update player position - always call this, even if not in pointer lock
            this.updatePlayerPosition(delta);
            
            // Update debug info
            if (this.debugMode) {
                this.updateDebugInfo();
            }
            
            // Log scene children count occasionally
            if (this.frameCounter % 60 === 0) {
                console.log('Scene children count:', this.scene.children.length);
                console.log('Camera position:', this.camera.position);
                console.log('Camera rotation:', this.camera.rotation);
                console.log('DEBUG: isRunning:', this.isRunning, 'controls.isLocked:', this.controls ? this.controls.isLocked : 'controls not initialized');
            }
            
            // Clear the renderer
            this.renderer.clear();
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            if (this.frameCounter % 60 === 0) {
                console.log('Frame rendered successfully');
            }
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    }

    // Update weapon position based on movement and aiming
    updateWeaponPosition() {
        if (!this.weaponModel) {
            console.log('DEBUG: No weapon model to update in updateWeaponPosition');
            return;
        }
        
        console.log('DEBUG: Updating weapon position, isAimingDownSights:', this.isAimingDownSights);
        console.log('DEBUG: Current weapon model:', this.weaponModel);
        console.log('DEBUG: Current weapon position:', this.weaponModel.position);
        console.log('DEBUG: Current weapon rotation:', this.weaponModel.rotation);
        console.log('DEBUG: Weapon model parent:', this.weaponModel.parent ? this.weaponModel.parent.name : 'none');
        
        // Get world position of weapon
        const worldPosition = new THREE.Vector3();
        this.weaponModel.getWorldPosition(worldPosition);
        console.log('DEBUG: Weapon world position:', worldPosition);
        
        try {
            // Always update weapon position, even if game is not running
            if (this.isAimingDownSights) {
                // Aiming down sights position for Kar98
                // Position the weapon so that the iron sights align with the center of the screen
                const oldPosition = this.weaponModel.position.clone();
                const oldRotation = this.weaponModel.rotation.clone();
                
                // IMPORTANT: Make sure the weapon is a child of the camera
                if (this.weaponModel.parent !== this.camera) {
                    console.log('DEBUG: Weapon model is not a child of camera, reparenting');
                    
                    // Remove from current parent
                    if (this.weaponModel.parent) {
                        this.weaponModel.parent.remove(this.weaponModel);
                    }
                    
                    // Add to camera
                    this.camera.add(this.weaponModel);
                }
                
                // Position for proper iron sight alignment
                // Move the weapon up and closer to the camera
                this.weaponModel.position.set(
                    0,        // Centered horizontally
                    -0.01,    // Raised to align sights with center of screen
                    -0.22     // Closer to camera for better sight picture
                );
                
                // Rotate the weapon to be straight ahead with slight upward tilt
                this.weaponModel.rotation.set(
                    0.01,     // Slight upward tilt to align sights
                    0,        // No yaw
                    0         // No roll
                );
                
                console.log('DEBUG: Weapon position changed from', oldPosition, 'to', this.weaponModel.position);
                console.log('DEBUG: Weapon rotation changed from', oldRotation, 'to', this.weaponModel.rotation);
                
                // Get updated world position of weapon
                const newWorldPosition = new THREE.Vector3();
                this.weaponModel.getWorldPosition(newWorldPosition);
                console.log('DEBUG: Weapon new world position:', newWorldPosition);
                
                // Find front and rear sights to ensure they're visible
                let frontSightFound = false;
                let rearSightFound = false;
                
                this.weaponModel.traverse(child => {
                    if (child.name === "frontSightPost") {
                        frontSightFound = true;
                        child.visible = true;
                        console.log('DEBUG: Front sight found:', child);
                        
                        // Get world position of front sight
                        const frontSightWorldPos = new THREE.Vector3();
                        child.getWorldPosition(frontSightWorldPos);
                        console.log('DEBUG: Front sight world position:', frontSightWorldPos);
                    }
                    if (child.name === "rearSightAperture") {
                        rearSightFound = true;
                        child.visible = true;
                        console.log('DEBUG: Rear sight found:', child);
                        
                        // Get world position of rear sight
                        const rearSightWorldPos = new THREE.Vector3();
                        child.getWorldPosition(rearSightWorldPos);
                        console.log('DEBUG: Rear sight world position:', rearSightWorldPos);
                    }
                });
                
                console.log('DEBUG: Front sight found:', frontSightFound, 'Rear sight found:', rearSightFound);
                
                // Change camera FOV for zoom effect - use a moderate zoom for iron sights
                const oldFOV = this.camera.fov;
                this.camera.fov = this.aimingDownSightsFOV || 55; // Less extreme zoom for iron sights
                this.camera.updateProjectionMatrix();
                console.log('DEBUG: Camera FOV changed from', oldFOV, 'to', this.camera.fov);
                
                // Hide remote players when aiming down sights to avoid confusion
                this.players.forEach((player, id) => {
                    if (!player.isLocal && player.model) {
                        player.model.visible = false;
                        console.log(`DEBUG: Hiding remote player ${id} while aiming down sights`);
                    }
                });
                
                // Log detailed position and rotation of iron sights
                this.weaponModel.traverse(child => {
                    if (child.name === "frontSightPost" || child.name === "rearSightAperture") {
                        console.log(`DEBUG: ${child.name} position:`, child.position);
                        console.log(`DEBUG: ${child.name} rotation:`, child.rotation);
                    }
                });

                // Log camera settings during aiming
                console.log('DEBUG: Camera FOV during aiming:', this.camera.fov);
                console.log('DEBUG: Camera position during aiming:', this.camera.position);
                console.log('DEBUG: Camera rotation during aiming:', this.camera.rotation);
                
            } else {
                // Hip position
                const oldPosition = this.weaponModel.position.clone();
                const oldRotation = this.weaponModel.rotation.clone();
                
                // IMPORTANT: Make sure the weapon is a child of the camera
                if (this.weaponModel.parent !== this.camera) {
                    console.log('DEBUG: Weapon model is not a child of camera, reparenting');
                    
                    // Remove from current parent
                    if (this.weaponModel.parent) {
                        this.weaponModel.parent.remove(this.weaponModel);
                    }
                    
                    // Add to camera
                    this.camera.add(this.weaponModel);
                }
                
                this.weaponModel.position.set(
                    0.25,   // Offset to the right
                    -0.25,  // Lower position
                    -0.5    // Further from camera
                );
                this.weaponModel.rotation.set(
                    0,              // No pitch
                    Math.PI / 8,    // Slight angle
                    0               // No roll
                );
                
                console.log('DEBUG: Weapon position changed from', oldPosition, 'to', this.weaponModel.position);
                console.log('DEBUG: Weapon rotation changed from', oldRotation, 'to', this.weaponModel.rotation);
                
                // Get updated world position of weapon
                const newWorldPosition = new THREE.Vector3();
                this.weaponModel.getWorldPosition(newWorldPosition);
                console.log('DEBUG: Weapon new world position:', newWorldPosition);
                
                // Reset camera FOV
                const oldFOV = this.camera.fov;
                this.camera.fov = this.defaultFOV || 75;
                this.camera.updateProjectionMatrix();
                console.log('DEBUG: Camera FOV changed from', oldFOV, 'to', this.camera.fov);
                
                // Show remote players when not aiming down sights
                this.players.forEach((player, id) => {
                    if (!player.isLocal && player.model) {
                        player.model.visible = true;
                        console.log(`DEBUG: Showing remote player ${id} when not aiming down sights`);
                    }
                });
            }
            
            // Make sure weapon is visible
            this.weaponModel.visible = true;
            
            // Make sure weapon doesn't interfere with scene visibility
            this.weaponModel.renderOrder = 1000; // Render after everything else
            
            // Force a render to update the scene, even if game is not running
            this.renderer.render(this.scene, this.camera);
            
        } catch (error) {
            console.error('DEBUG: Error updating weapon position:', error);
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
        if (!delta) {
            console.warn('Delta time is missing or zero, using default value');
            delta = 0.016; // Default to 60fps
        }
        
        console.log('Updating player position with delta:', delta);
        console.log('DEBUG: Movement flags:', {
            moveForward: this.moveForward,
            moveBackward: this.moveBackward,
            moveLeft: this.moveLeft,
            moveRight: this.moveRight,
            isSprinting: this.isSprinting
        });
        console.log('DEBUG: isRunning:', this.isRunning, 'controls.isLocked:', this.controls ? this.controls.isLocked : 'controls not initialized');
        
        // Handle player movement even if controls aren't locked
        if (this.isRunning) {
            console.log('DEBUG: Game is running, handling movement');
            
            try {
                // Calculate movement speed based on sprint state
                const speed = this.isSprinting ? this.playerSpeed * this.sprintMultiplier : this.playerSpeed;
                console.log('DEBUG: Movement speed:', speed);
                
                // Calculate movement direction
                this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
                this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
                this.direction.normalize(); // Normalize for consistent speed in all directions
                console.log('DEBUG: Movement direction:', { x: this.direction.x, z: this.direction.z });
                
                // Apply movement to controls
                if (this.moveForward || this.moveBackward) {
                    console.log('DEBUG: Moving forward/backward');
                    if (this.controls && this.controls.moveForward) {
                        this.controls.moveForward(this.direction.z * speed * delta);
                        console.log('DEBUG: Called controls.moveForward with:', this.direction.z * speed * delta);
                    } else {
                        console.error('ERROR: controls.moveForward is not a function');
                        // Fallback: update camera position directly
                        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                        this.camera.position.addScaledVector(cameraDirection, this.direction.z * speed * delta);
                        console.log('DEBUG: Updated camera position directly for forward/backward movement');
                    }
                }
                if (this.moveLeft || this.moveRight) {
                    console.log('DEBUG: Moving left/right');
                    if (this.controls && this.controls.moveRight) {
                        this.controls.moveRight(this.direction.x * speed * delta);
                        console.log('DEBUG: Called controls.moveRight with:', this.direction.x * speed * delta);
                    } else {
                        console.error('ERROR: controls.moveRight is not a function');
                        // Fallback: update camera position directly
                        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
                        this.camera.position.addScaledVector(cameraRight, this.direction.x * speed * delta);
                        console.log('DEBUG: Updated camera position directly for left/right movement');
                    }
                }
                
                // Log camera position after movement
                console.log('DEBUG: Camera position after movement:', this.camera.position);
            } catch (error) {
                console.error('ERROR: Failed to update player position:', error);
            }
        } else {
            console.log('DEBUG: Game is not running, skipping movement');
        }
        
        // Update all players
        this.players.forEach(player => {
            player.update(delta);
        });
        
        // Send network updates at fixed intervals
        if (this.socket && this.socket.connected && this.localPlayer) {
            const now = performance.now();
            const timeSinceLastUpdate = now - (this.lastNetworkUpdate || now);
            if (timeSinceLastUpdate > this.networkUpdateInterval) {
                this.sendNetworkUpdate();
                this.lastNetworkUpdate = now;
            }
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
        console.log("DEBUG: Setting up event listeners");
        
        // Lock/unlock pointer - use document.body instead of controls.lock()
        document.addEventListener('click', (event) => {
            console.log("DEBUG: Click event detected, controls.isLocked:", this.controls ? this.controls.isLocked : 'controls not initialized');
            console.log("DEBUG: Current pointerLockElement:", document.pointerLockElement);
            console.log("DEBUG: document.body is:", document.body);
            
            if (!this.controls.isLocked) {
                console.log("DEBUG: Attempting to lock controls");
                
                try {
                    // Request pointer lock on document.body
                    document.body.requestPointerLock = document.body.requestPointerLock || 
                                                      document.body.mozRequestPointerLock ||
                                                      document.body.webkitRequestPointerLock;
                    
                    // Check if requestPointerLock is available
                    if (document.body.requestPointerLock) {
                        console.log("DEBUG: requestPointerLock is available, calling it");
                        document.body.requestPointerLock();
                    } else {
                        console.error("ERROR: requestPointerLock is not available on document.body");
                        // Fallback to controls.lock()
                        console.log("DEBUG: Falling back to controls.lock()");
                        this.controls.lock();
                    }
                    
                    console.log("DEBUG: Pointer lock requested directly on document.body");
                    
                    // Force isRunning to true
                    this.isRunning = true;
                    console.log("DEBUG: Forced isRunning to true");
                } catch (error) {
                    console.error("ERROR: Failed to request pointer lock:", error);
                }
            } else if (this.weaponModel && this.canShoot) {
                console.log("DEBUG: Attempting to shoot");
                this.shoot();
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            console.log("DEBUG: Pointer lock change detected");
            console.log("DEBUG: pointerLockElement:", document.pointerLockElement);
            console.log("DEBUG: document.body:", document.body);
            console.log("DEBUG: Are they equal?", document.pointerLockElement === document.body);
            
            if (document.pointerLockElement === document.body) {
                console.log("DEBUG: Pointer locked, setting isRunning to true");
                this.isRunning = true;
            } else {
                console.log("DEBUG: Pointer unlocked, setting isRunning to false");
                this.isRunning = false;
            }
        });
        
        // Direct handling for specific keys
        document.addEventListener('keydown', (event) => {
            console.log('DEBUG: Key pressed directly in setupEventListeners:', event.code);
            console.log('DEBUG: isRunning:', this.isRunning, 'controls.isLocked:', this.controls ? this.controls.isLocked : 'controls not initialized');
            
            // Always handle F key, even if not running
            if (event.code === 'KeyF') {
                console.log('F key pressed - toggling aiming down sights');
                
                // Log scene hierarchy before toggling
                console.log('DEBUG: Scene hierarchy before toggling:');
                this.logSceneHierarchy(this.scene);
                
                // Log camera children before toggling
                console.log('DEBUG: Camera children before toggling:');
                this.camera.children.forEach((child, index) => {
                    console.log(`Child ${index}:`, child.type, child.name, child.visible);
                });
                
                // Toggle aiming down sights
                this.isAimingDownSights = !this.isAimingDownSights;
                
                // Store current camera position and rotation for smooth transition
                const currentPosition = this.camera.position.clone();
                const currentRotation = this.camera.rotation.clone();
                
                // IMPORTANT: Make sure weapon is a child of camera
                if (this.weaponModel && this.weaponModel.parent !== this.camera) {
                    console.log('DEBUG: Weapon model is not a child of camera, reparenting');
                    
                    // Remove from current parent
                    if (this.weaponModel.parent) {
                        this.weaponModel.parent.remove(this.weaponModel);
                    }
                    
                    // Add to camera
                    this.camera.add(this.weaponModel);
                    console.log('DEBUG: Weapon model parent after reparenting:', this.weaponModel.parent ? this.weaponModel.parent.name : 'none');
                }
                
                if (this.isAimingDownSights) {
                    // When aiming down sights, slightly adjust camera position
                    // This creates a more realistic sight picture
                    this.camera.position.y += 0.02; // Raise the camera slightly to align with sights
                    
                    // Add a slight forward movement to simulate bringing the weapon up to eye level
                    const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                    this.camera.position.addScaledVector(lookDirection, 0.05);
                    
                    console.log('DEBUG: Camera position adjusted for aiming:', this.camera.position);
                    
                    // Position weapon for aiming down sights
                    if (this.weaponModel) {
                        const oldPosition = this.weaponModel.position.clone();
                        const oldRotation = this.weaponModel.rotation.clone();
                        
                        // Position for proper iron sight alignment
                        // These values are critical for proper sight alignment
                        this.weaponModel.position.set(
                            0,        // Centered horizontally
                            -0.05,    // Lower to align sights with center of screen
                            -0.15     // Closer to camera for better sight picture
                        );
                        
                        // Rotate the weapon to be straight ahead
                        this.weaponModel.rotation.set(
                            0,        // No pitch
                            0,        // No yaw
                            0         // No roll
                        );
                        
                        console.log('DEBUG: Weapon position changed from', oldPosition, 'to', this.weaponModel.position);
                        console.log('DEBUG: Weapon rotation changed from', oldRotation, 'to', this.weaponModel.rotation);
                        
                        // Make sure weapon is visible
                        this.weaponModel.visible = true;
                        
                        // Get world position of weapon
                        const worldPosition = new THREE.Vector3();
                        this.weaponModel.getWorldPosition(worldPosition);
                        console.log('DEBUG: Weapon world position after positioning:', worldPosition);
                        
                        // Log detailed position and rotation of iron sights
                        this.weaponModel.traverse(child => {
                            if (child.name === "frontSightPost" || child.name === "rearSightAperture") {
                                console.log(`DEBUG: ${child.name} position:`, child.position);
                                console.log(`DEBUG: ${child.name} rotation:`, child.rotation);
                                
                                // Get world position of sights
                                const sightWorldPosition = new THREE.Vector3();
                                child.getWorldPosition(sightWorldPosition);
                                console.log(`DEBUG: ${child.name} world position:`, sightWorldPosition);
                            }
                        });
                        
                        // Adjust FOV for aiming
                        this.camera.fov = 55; // Narrower FOV when aiming
                        this.camera.updateProjectionMatrix();
                        
                        // Log camera settings during aiming
                        console.log('DEBUG: Camera FOV during aiming:', this.camera.fov);
                        console.log('DEBUG: Camera position during aiming:', this.camera.position);
                        console.log('DEBUG: Camera rotation during aiming:', this.camera.rotation);
                    }
                    
                    // Show message for first time users
                    if (!this.hasShownAimingMessage) {
                        const message = document.createElement('div');
                        message.style.position = 'absolute';
                        message.style.top = '20%';
                        message.style.left = '50%';
                        message.style.transform = 'translateX(-50%)';
                        message.style.color = 'white';
                        message.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        message.style.padding = '10px';
                        message.style.borderRadius = '5px';
                        message.style.fontFamily = 'Arial, sans-serif';
                        message.style.fontSize = '16px';
                        message.style.textAlign = 'center';
                        message.style.zIndex = '1000';
                        message.style.transition = 'opacity 0.5s ease-in-out';
                        message.textContent = 'Align the front sight post with the target through the rear sight notch';
                        document.body.appendChild(message);
                        
                        // Fade out and remove after 3 seconds
                        setTimeout(() => {
                            message.style.opacity = '0';
                            setTimeout(() => {
                                document.body.removeChild(message);
                            }, 500);
                        }, 3000);
                        
                        this.hasShownAimingMessage = true;
                    }
                } else {
                    // Reset camera position and rotation when not aiming
                    this.camera.position.copy(currentPosition);
                    this.camera.rotation.copy(currentRotation);
                    console.log('DEBUG: Camera position and rotation reset');
                    
                    // Position weapon for hip fire
                    if (this.weaponModel) {
                        const oldPosition = this.weaponModel.position.clone();
                        const oldRotation = this.weaponModel.rotation.clone();
                        
                        this.weaponModel.position.set(
                            0.25,   // Offset to the right
                            -0.25,  // Lower position
                            -0.5    // Further from camera
                        );
                        this.weaponModel.rotation.set(
                            0,              // No pitch
                            Math.PI / 8,    // Slight angle
                            0               // No roll
                        );
                        
                        console.log('DEBUG: Weapon position changed directly in F handler from', oldPosition, 'to', this.weaponModel.position);
                        console.log('DEBUG: Weapon rotation changed directly in F handler from', oldRotation, 'to', this.weaponModel.rotation);
                        
                        // Make sure weapon is visible
                        this.weaponModel.visible = true;
                        
                        // Get world position of weapon
                        const worldPosition = new THREE.Vector3();
                        this.weaponModel.getWorldPosition(worldPosition);
                        console.log('DEBUG: Weapon world position after direct positioning:', worldPosition);
                    }
                }
                
                // Update weapon position immediately for responsive feedback
                this.updateWeaponPosition();
                
                // Toggle scope overlay
                const scopeOverlay = document.getElementById('scope-overlay');
                if (scopeOverlay) {
                    scopeOverlay.classList.toggle('hidden');
                }
                
                // Change crosshair appearance
                const crosshair = document.getElementById('crosshair');
                if (crosshair) {
                    crosshair.style.opacity = this.isAimingDownSights ? '0' : '1';
                }
                
                // Toggle aiming class on HUD
                const hudElement = document.getElementById('hud');
                if (hudElement) {
                    hudElement.classList.toggle('aiming');
                }
                
                // Force a render to update the scene
                this.renderer.render(this.scene, this.camera);
                
                // Log scene hierarchy after toggling
                console.log('DEBUG: Scene hierarchy after toggling:');
                this.logSceneHierarchy(this.scene);
                
                // Log camera children after toggling
                console.log('DEBUG: Camera children after toggling:');
                this.camera.children.forEach((child, index) => {
                    console.log(`Child ${index}:`, child.type, child.name, child.visible);
                });
                
                return;
            }
            
            // Handle movement keys even if controls aren't locked
            if (this.isRunning) {
                console.log("DEBUG: Key press while game is running:", event.code);
                
                switch (event.code) {
                    case 'KeyW':
                        console.log("DEBUG: W key pressed, setting moveForward to true");
                        this.moveForward = true;
                        break;
                    case 'KeyS':
                        console.log("DEBUG: S key pressed, setting moveBackward to true");
                        this.moveBackward = true;
                        break;
                    case 'KeyA':
                        console.log("DEBUG: A key pressed, setting moveLeft to true");
                        this.moveLeft = true;
                        break;
                    case 'KeyD':
                        console.log("DEBUG: D key pressed, setting moveRight to true");
                        this.moveRight = true;
                        break;
                    case 'ShiftLeft':
                        console.log("DEBUG: Shift key pressed, setting isSprinting to true");
                        this.isSprinting = true;
                        break;
                }
            } else {
                console.log("DEBUG: Key press ignored, game not running. isRunning:", this.isRunning, "controls.isLocked:", this.controls ? this.controls.isLocked : 'controls not initialized');
            }
        });
        
        // Handle key up events
        document.addEventListener('keyup', (event) => {
            console.log('DEBUG: Key up event:', event.code);
            
            // Handle movement keys even if controls aren't locked
            if (this.isRunning) {
                switch (event.code) {
                    case 'KeyW':
                        console.log("DEBUG: W key released, setting moveForward to false");
                        this.moveForward = false;
                        break;
                    case 'KeyS':
                        console.log("DEBUG: S key released, setting moveBackward to false");
                        this.moveBackward = false;
                        break;
                    case 'KeyA':
                        console.log("DEBUG: A key released, setting moveLeft to false");
                        this.moveLeft = false;
                        break;
                    case 'KeyD':
                        console.log("DEBUG: D key released, setting moveRight to false");
                        this.moveRight = false;
                        break;
                    case 'ShiftLeft':
                        console.log("DEBUG: Shift key released, setting isSprinting to false");
                        this.isSprinting = false;
                        break;
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log("DEBUG: Event listeners set up successfully");
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

    // Create a simple weapon model
    createSimpleWeaponModel() {
        console.log("DEBUG: Creating detailed Kar98 rifle model");
        const weaponGroup = new THREE.Group();
        weaponGroup.name = "playerWeapon"; // Give it a unique name
        
        try {
            // Load textures for wood and metal
            const textureLoader = new THREE.TextureLoader();
            const woodTexture = textureLoader.load('textures/wood.jpg',
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
            const stockGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.7);
            const stockMaterial = new THREE.MeshStandardMaterial({ 
                map: woodTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            console.log('DEBUG: Stock material properties:', stockMaterial);
            const stock = new THREE.Mesh(stockGeometry, stockMaterial);
            stock.position.set(0, -0.02, 0);
            console.log('DEBUG: Stock position:', stock.position);
            stock.name = "weaponStock";
            weaponGroup.add(stock);

            // Barrel with texture
            const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 16);
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

            // Bolt mechanism with texture
            const boltGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
            const boltMaterial = new THREE.MeshStandardMaterial({ 
                map: metalTexture,
                roughness: 0.3,
                metalness: 0.9
            });
            console.log('DEBUG: Bolt material properties:', boltMaterial);
            const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
            bolt.rotation.z = Math.PI / 2;
            bolt.position.set(0.06, 0.06, -0.1);
            console.log('DEBUG: Bolt position:', bolt.position);
            bolt.name = "weaponBolt";
            weaponGroup.add(bolt);

            // Bolt handle with texture
            const boltHandleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const boltHandle = new THREE.Mesh(boltHandleGeometry, boltMaterial);
            boltHandle.position.set(0.12, 0.06, -0.1);
            console.log('DEBUG: Bolt handle position:', boltHandle.position);
            boltHandle.name = "weaponBoltHandle";
            weaponGroup.add(boltHandle);

            // Create detailed iron sights
            this.createDetailedKar98IronSights(weaponGroup);

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
        // Front sight housing (the metal base that holds the front sight)
        const frontSightHousingGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.02);
        const sightMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Dark metal color
        const frontSightHousing = new THREE.Mesh(frontSightHousingGeometry, sightMaterial);
        frontSightHousing.position.set(0, 0.06, -0.7);
        weaponGroup.add(frontSightHousing);
        
        // Front sight post (the thin vertical blade you align with the target)
        const frontSightPostGeometry = new THREE.BoxGeometry(0.002, 0.025, 0.002);
        const frontSightPost = new THREE.Mesh(frontSightPostGeometry, sightMaterial);
        frontSightPost.position.set(0, 0.085, -0.7);
        frontSightPost.name = "frontSightPost"; // Name it for easy reference
        weaponGroup.add(frontSightPost);
        
        // Front sight protective wings (the metal pieces that protect the front sight)
        const frontSightWingGeometry = new THREE.BoxGeometry(0.01, 0.025, 0.002);
        
        // Left wing
        const leftWing = new THREE.Mesh(frontSightWingGeometry, sightMaterial);
        leftWing.position.set(-0.015, 0.085, -0.7);
        weaponGroup.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(frontSightWingGeometry, sightMaterial);
        rightWing.position.set(0.015, 0.085, -0.7);
        weaponGroup.add(rightWing);
        
        // Rear sight base (the metal piece that holds the rear sight)
        const rearSightBaseGeometry = new THREE.BoxGeometry(0.05, 0.01, 0.03);
        const rearSightBase = new THREE.Mesh(rearSightBaseGeometry, sightMaterial);
        rearSightBase.position.set(0, 0.07, -0.1);
        weaponGroup.add(rearSightBase);
        
        // Rear sight aperture (the V-notch or hole you look through)
        // For Kar98, we'll create a V-notch style rear sight
        const rearSightNotchGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 3); // Triangular prism
        const rearSightNotch = new THREE.Mesh(rearSightNotchGeometry, sightMaterial);
        rearSightNotch.rotation.x = Math.PI / 2;
        rearSightNotch.rotation.z = Math.PI; // Rotate to get the V shape pointing up
        rearSightNotch.position.set(0, 0.085, -0.1);
        rearSightNotch.name = "rearSightAperture"; // Name it for easy reference
        weaponGroup.add(rearSightNotch);
        
        console.log('DEBUG: Iron sights created with front sight at', frontSightPost.position, 'and rear sight at', rearSightNotch.position);
        
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
}