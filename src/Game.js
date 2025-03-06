import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PlayerController } from './components/player/PlayerController';
import { WeaponSystem } from './components/weapons/WeaponSystem';
import { Environment } from './components/environment/Environment';
import { NetworkManager } from './components/network/NetworkManager';
import audioManager from './audio/AudioManager.js';
import GameUI from './components/ui/GameUI';

/**
 * Main Game class that orchestrates all game components
 */
class Game {
    constructor() {
        // Core Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            stencil: false
        });

        // Advanced renderer setup
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.autoClear = false; // Important for rendering both scenes

        // Add to DOM
        const canvas = this.renderer.domElement;
        
        // Set canvas style to ensure it doesn't cover our HUD elements
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1'; // Lower z-index so HUD elements appear on top
        
        document.getElementById('game-container').appendChild(canvas);
        
        // Debug: Log canvas z-index
        console.log('Canvas z-index set to:', canvas.style.zIndex);

        // Post-processing
        this.composer = null;
        this.setupPostProcessing();

        // Game systems
        this.audioManager = audioManager;
        this.player = null;
        this.weaponSystem = null;
        this.environment = null;
        this.ui = null;
        this.networkManager = null;

        // Game state
        this.isRunning = false;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;

        // Initialize
        this.init();
    }

    setupRenderer() {
        // Configure renderer for better quality
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.autoClear = false; // Important for rendering both scenes

        // Add to DOM
        const canvas = this.renderer.domElement;
        
        // Set canvas style to ensure it doesn't cover our HUD elements
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1'; // Lower z-index so HUD elements appear on top
        
        document.getElementById('game-container').appendChild(canvas);
        
        // Debug: Log canvas z-index
        console.log('Canvas z-index set to:', canvas.style.zIndex);
    }

    setupPostProcessing() {
        // Create composer
        this.composer = new EffectComposer(this.renderer);

        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Add SSAO for better depth perception
        const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
        ssaoPass.kernelRadius = 16;
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        this.composer.addPass(ssaoPass);

        // Add subtle bloom for better lighting
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.1,  // strength further reduced from 0.2
            0.4,  // radius
            0.95  // threshold increased from 0.9 to further reduce bloom
        );
        this.composer.addPass(bloomPass);

        // Add SMAA for better anti-aliasing
        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(smaaPass);
    }

    async init() {
        console.log('Game initializing...');
        
        // Debug: Log DOM structure
        this.logDOMStructure();
        
        try {
            // Setup environment
            this.environment = new Environment(this.scene);
            await this.environment.init();
            
            // Setup player controller
            this.playerController = new PlayerController(this.camera, this.scene);
            this.playerController.setCollidableObjects(this.environment.getCollidableObjects());
            
            // Setup weapon system
            this.weaponSystem = new WeaponSystem(this.camera, this.scene);
            await this.weaponSystem.init();
            
            // Setup network manager
            this.networkManager = new NetworkManager(this);
            this.networkManager.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start game loop
            console.log('Game loop started');
            this.isRunning = true;
            this.animate();
            
            // Game initialized successfully
            console.log('Game initialized successfully');
            
            // Debug: Log DOM structure again after initialization
            setTimeout(() => this.logDOMStructure(), 2000);
            
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Get the game container
        const gameContainer = document.getElementById('game-container');
        const instructions = document.getElementById('instructions');

        // Handle click to start
        instructions.addEventListener('click', () => {
            if (!this.isRunning) {
                gameContainer.requestPointerLock = gameContainer.requestPointerLock ||
                                                 gameContainer.mozRequestPointerLock ||
                                                 gameContainer.webkitRequestPointerLock;
                gameContainer.requestPointerLock();
            }
        });

        // Handle pointer lock change
        const onPointerLockChange = () => {
            if (document.pointerLockElement === gameContainer ||
                document.mozPointerLockElement === gameContainer ||
                document.webkitPointerLockElement === gameContainer) {
                this.isRunning = true;
                instructions.style.display = 'none';
                document.getElementById('crosshair').style.display = 'block';
                console.log('Game started - pointer locked');
            } else {
                this.isRunning = false;
                instructions.style.display = 'flex';
                document.getElementById('crosshair').style.display = 'none';
                console.log('Game paused - pointer unlocked');
            }
        };

        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockchange', onPointerLockChange);
        document.addEventListener('webkitpointerlockchange', onPointerLockChange);

        // Handle pointer lock error
        const onPointerLockError = () => {
            console.error('Pointer lock failed');
            this.ui.showMessage('Failed to start game. Please try again.');
        };

        document.addEventListener('pointerlockerror', onPointerLockError);
        document.addEventListener('mozpointerlockerror', onPointerLockError);
        document.addEventListener('webkitpointerlockerror', onPointerLockError);

        // Handle keyboard controls for weapon
        document.addEventListener('keydown', (event) => {
            if (this.isRunning) {
                switch (event.code) {
                    case 'KeyF':
                        console.log('F key pressed - toggling aim');
                        // Log the DOM structure before toggling aim
                        console.log('DOM before toggleAim:');
                        console.log('- always-visible-sight:', document.getElementById('always-visible-sight'));
                        console.log('- always-visible-sight display:', document.getElementById('always-visible-sight')?.style.display);
                        
                        this.weaponSystem.toggleAim();
                        
                        // Log the DOM structure after toggling aim
                        setTimeout(() => {
                            console.log('DOM after toggleAim:');
                            console.log('- always-visible-sight:', document.getElementById('always-visible-sight'));
                            console.log('- always-visible-sight display:', document.getElementById('always-visible-sight')?.style.display);
                        }, 100);
                        break;
                    case 'KeyR':
                        this.weaponSystem.reload();
                        break;
                    // Debug key to force iron sights
                    case 'KeyT':
                        console.log('T key pressed - FORCE SHOWING IRON SIGHTS');
                        this.testIronSights();
                        break;
                    // Another debug key for a different approach
                    case 'KeyY':
                        console.log('Y key pressed - DIRECT DOM IRON SIGHTS');
                        this.createDirectIronSights();
                        break;
                }
            }
        });

        // Handle mouse click for shooting
        document.addEventListener('click', () => {
            if (this.isRunning) {
                this.weaponSystem.shoot();
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;

        if (this.isRunning) {
            try {
                // Update game systems
                this.playerController.update(deltaTime);
                this.weaponSystem.update(deltaTime);
                this.environment.update(deltaTime);
                this.networkManager.update(deltaTime);

                // Clear both buffers
                this.renderer.clear();

                // Render main scene with post-processing
                this.composer.render();

                // Render weapon scene directly
                this.renderer.clearDepth();
                this.renderer.render(this.weaponSystem.weaponScene, this.camera);
            } catch (error) {
                console.error('Error in game loop:', error);
            }
        } else {
            // When not running, just render the main scene without post-processing
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        // Update camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update weapon camera
        if (this.weaponSystem) {
            this.weaponSystem.weaponCamera.aspect = window.innerWidth / window.innerHeight;
            this.weaponSystem.weaponCamera.updateProjectionMatrix();
        }

        // Update renderer and composer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    // Debug function to test iron sights
    testIronSights() {
        console.log('Testing iron sights directly');
        
        // Create a test iron sight element
        const testSight = document.createElement('div');
        testSight.id = 'test-iron-sight';
        
        // Style it to be unmissable
        Object.assign(testSight.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: '999999',
            pointerEvents: 'none'
        });
        
        // Add a bright red crosshair
        const crosshair = document.createElement('div');
        Object.assign(crosshair.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px',
            border: '3px solid red',
            borderRadius: '50%'
        });
        
        // Add a text label
        const label = document.createElement('div');
        Object.assign(label.style, {
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'red',
            fontSize: '24px',
            fontWeight: 'bold'
        });
        label.textContent = 'TEST IRON SIGHT (Press T again to remove)';
        
        testSight.appendChild(crosshair);
        testSight.appendChild(label);
        
        // Toggle the test sight
        const existingTest = document.getElementById('test-iron-sight');
        if (existingTest) {
            existingTest.remove();
            console.log('Test iron sight removed');
        } else {
            document.body.appendChild(testSight);
            console.log('Test iron sight added to DOM');
        }
    }

    // Direct DOM manipulation for iron sights
    createDirectIronSights() {
        console.log('Creating direct DOM iron sights');
        
        // Toggle an existing element if it exists
        const existingElement = document.getElementById('direct-iron-sights');
        if (existingElement) {
            document.body.removeChild(existingElement);
            console.log('Direct iron sights removed');
            return;
        }
        
        // Create a new element directly in the body
        const ironSight = document.createElement('div');
        ironSight.id = 'direct-iron-sights';
        
        // Set inline styles to ensure visibility
        ironSight.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.3);
            z-index: 9999999;
            pointer-events: none;
        `;
        
        // Add inner elements with inline styles
        ironSight.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background-color: #ff0000; border-radius: 50%; box-shadow: 0 0 20px #ff0000;"></div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; border: 4px solid #ff0000; border-radius: 50%; box-shadow: 0 0 20px #ff0000;"></div>
            <div style="position: absolute; top: 30%; left: 50%; transform: translateX(-50%); color: #ff0000; font-size: 24px; font-weight: bold; text-shadow: 0 0 10px #000000;">DIRECT IRON SIGHTS TEST</div>
            <div style="position: absolute; top: 35%; left: 50%; transform: translateX(-50%); color: #ff0000; font-size: 18px; text-shadow: 0 0 10px #000000;">Press Y again to remove</div>
        `;
        
        // Add to document body
        document.body.appendChild(ironSight);
        console.log('Direct iron sights added to DOM');
    }

    // Debug function to log DOM structure
    logDOMStructure() {
        console.log('--- DOM STRUCTURE ---');
        console.log('Body children:', document.body.children);
        console.log('Game container:', document.getElementById('game-container'));
        console.log('HUD elements:', document.getElementById('hud'));
        console.log('Crosshair:', document.getElementById('crosshair'));
        console.log('Permanent iron sight:', document.getElementById('permanent-iron-sight'));
        console.log('Canvas elements:', document.getElementsByTagName('canvas'));
        console.log('z-index of canvas:', document.querySelector('canvas')?.style.zIndex);
        console.log('--- END DOM STRUCTURE ---');
    }
}

export default Game;
