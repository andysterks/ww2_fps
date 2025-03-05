import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PlayerController } from './components/player/PlayerController';
import { WeaponSystem } from './components/weapons/WeaponSystem';
import { Environment } from './components/environment/Environment';
import { AudioManager } from './audio/AudioManager';
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
        this.setupRenderer();
        
        // Post-processing
        this.composer = null;
        this.setupPostProcessing();

        // Game systems
        this.audioManager = new AudioManager();
        this.player = null;
        this.weaponSystem = null;
        this.environment = null;
        this.ui = null;

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
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);

        // Add SMAA for better anti-aliasing
        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(smaaPass);
    }

    init() {
        // Initialize audio
        this.audioManager.init();

        // Create environment first
        this.environment = new Environment(this.scene);
        
        // Create player
        this.player = new PlayerController(this.camera, this.scene);
        
        // Create weapon system
        this.weaponSystem = new WeaponSystem(this.camera, this.scene);

        // Create UI
        this.ui = new GameUI();

        // Set up event listeners
        this.setupEventListeners();

        // Start game loop
        this.animate();
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Handle pointer lock
        document.addEventListener('click', () => {
            if (!this.isRunning) {
                this.player.controls.lock();
            }
        });

        this.player.controls.addEventListener('lock', () => {
            this.isRunning = true;
            document.getElementById('crosshair').style.display = 'block';
        });

        this.player.controls.addEventListener('unlock', () => {
            this.isRunning = false;
            document.getElementById('crosshair').style.display = 'none';
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        if (this.isRunning) {
            // Update game systems
            this.player.update(deltaTime);
            this.weaponSystem.update(deltaTime);
            this.environment.update(deltaTime);

            // Render scene with post-processing
            this.composer.render();
        }
    }

    onWindowResize() {
        // Update camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer and composer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
}

export default Game;
