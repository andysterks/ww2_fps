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
        this.renderer.toneMappingExposure = 0.7;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.autoClear = false; // Important for rendering both scenes

        // Add to DOM
        document.getElementById('game-container').appendChild(this.renderer.domElement);

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
        document.getElementById('game-container').appendChild(this.renderer.domElement);
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
            0.2,  // strength reduced from 0.5
            0.4,  // radius
            0.9   // threshold increased from 0.85 to reduce bloom on bright areas
        );
        this.composer.addPass(bloomPass);

        // Add SMAA for better anti-aliasing
        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(smaaPass);
    }

    async init() {
        try {
            console.log('Initializing game...');
            
            // Initialize audio
            await this.audioManager.init();
            console.log('Audio initialized');

            // Create environment first
            this.environment = new Environment(this.scene);
            await this.environment.init();
            console.log('Environment initialized');
            
            // Create player and set initial position
            this.player = new PlayerController(this.camera, this.scene);
            console.log('Player controller created');
            
            // Set collidable objects for player
            const collidableObjects = this.environment.getCollidableObjects();
            this.player.setCollidableObjects(collidableObjects);
            console.log('Collidable objects set:', collidableObjects.length);
            
            // Create weapon system
            this.weaponSystem = new WeaponSystem(this.camera, this.scene);
            await this.weaponSystem.init();
            console.log('Weapon system initialized');

            // Create UI
            this.ui = new GameUI();
            console.log('UI initialized');

            // Initialize network manager
            this.networkManager = new NetworkManager(this);
            console.log('Network manager initialized');

            // Set up event listeners
            this.setupEventListeners();
            console.log('Event listeners set up');

            // Start game loop
            this.animate();
            console.log('Game loop started');
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error during game initialization:', error);
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
                        this.weaponSystem.toggleAim();
                        break;
                    case 'KeyR':
                        this.weaponSystem.reload();
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
                this.player.update(deltaTime);
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
}

export default Game;
