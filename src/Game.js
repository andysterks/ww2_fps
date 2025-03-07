import * as THREE from 'three';
import { audioManager } from './audio.js';
import PlayerController from './components/player/PlayerController';
import WeaponSystem from './components/weapons/WeaponSystem';
import Environment from './components/environment/Environment';
import GameUI from './components/ui/GameUI';

/**
 * Main Game class that orchestrates all game components
 */
class Game {
    constructor() {
        // Core Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Configure renderer
        this.setupRenderer();
        
        // Game components
        this.player = null;
        this.weaponSystem = null;
        this.environment = null;
        this.ui = null;
        
        // Game state
        this.isRunning = false;
        this.prevTime = performance.now();
        
        // Initialize game
        this.init();
    }
    
    setupRenderer() {
        // Configure renderer with simpler settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.setClearColor(0x87CEEB); // Set sky color directly on renderer
        
        // Set renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Add renderer to DOM
        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }
    
    init() {
        // Initialize audio
        audioManager.init();
        
        // Create environment
        this.environment = new Environment(this.scene);
        
        // Create player
        this.player = new PlayerController(this.camera, this.scene);
        
        // Create weapon system
        this.weaponSystem = new WeaponSystem(this.camera, this.scene);
        
        // Create UI
        this.ui = new GameUI();
        
        // Connect components
        this.connectComponents();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.animate();
        
        // Show controls message
        this.ui.showGameStartMessage();
    }
    
    connectComponents() {
        // Give player access to collidable objects
        this.player.setCollidableObjects(this.environment.getCollidableObjects());
        
        // Pass player reference to weapon system
        this.weaponSystem.setPlayer(this.player);
    }
    
    setupEventListeners() {
        // Lock/unlock pointer
        document.addEventListener('click', (event) => {
            if (!this.player.getControls().isLocked) {
                this.player.getControls().lock();
                this.isRunning = true;
            } else if (this.weaponSystem.canShoot) {
                this.shoot();
            }
        });
        
        // Right-click for regular aiming
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent context menu from appearing
            if (this.player.getControls().isLocked && this.isRunning) {
                const isAiming = this.weaponSystem.toggleAim();
                this.ui.updateCrosshair(isAiming, this.weaponSystem.isAimingDownSights());
            }
        });
        
        // Handle key presses
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                this.isRunning = true;
            } else {
                this.isRunning = false;
            }
        });
    }
    
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyF':
                // Toggle aim down sights
                const adsResult = this.weaponSystem.toggleAimDownSights();
                this.ui.updateCrosshair(this.weaponSystem.isAiming(), adsResult.isAimingDownSights);
                
                // Show message on first use
                if (adsResult.isFirstTime) {
                    this.ui.showMessage("Looking down sights for better accuracy", 3000);
                }
                break;
                
            case 'KeyR':
                // Reload weapon
                this.weaponSystem.reload();
                break;
                
            case 'KeyC':
                // Show controls
                this.ui.showControls();
                break;
        }
    }
    
    shoot() {
        // Attempt to shoot
        const didShoot = this.weaponSystem.shoot();
        
        if (didShoot) {
            // Update ammo counter
            this.ui.updateAmmoCounter(this.weaponSystem.getBulletCount());
        }
    }
    
    animate() {
        // Request next frame
        requestAnimationFrame(() => this.animate());
        
        // Skip update if game is paused
        if (!this.isRunning) return;
        
        // Update player
        this.player.update(this.weaponSystem.isAimingDownSights() || this.weaponSystem.isAiming());
        
        // Update weapon system
        this.weaponSystem.update({
            moveForward: this.player.moveForward,
            moveBackward: this.player.moveBackward,
            moveLeft: this.player.moveLeft,
            moveRight: this.player.moveRight,
            isSprinting: this.player.isSprinting
        });
        
        // Update UI
        this.ui.updateAmmoCounter(this.weaponSystem.getBulletCount());
        this.ui.updateCrosshair(this.weaponSystem.isAiming(), this.weaponSystem.isAimingDownSights());
        
        // Render scenes
        this.render();
    }
    
    render() {
        // Clear renderer
        this.renderer.clear();
        
        // Render main scene
        this.renderer.render(this.scene, this.camera);
        
        // Render weapon on top
        if (this.isRunning) {
            this.renderer.clearDepth();
            this.renderer.render(
                this.weaponSystem.getWeaponScene(),
                this.weaponSystem.getWeaponCamera()
            );
        }
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update weapon camera
        this.weaponSystem.onWindowResize();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export default Game;
