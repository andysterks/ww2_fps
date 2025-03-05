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
        
        // Create a simple environment directly in the scene
        this.createSimpleEnvironment();
        
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
        if (this.collidableObjects && this.collidableObjects.length > 0) {
            this.player.setCollidableObjects(this.collidableObjects);
        } else if (this.environment) {
            this.player.setCollidableObjects(this.environment.getCollidableObjects());
        }
    }
    
    createSimpleEnvironment() {
        // Store collidable objects
        this.collidableObjects = [];
        
        // Create a very simple ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4CAF50 // Green
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5; // Slightly below the player
        this.scene.add(ground);
        this.collidableObjects.push(ground);
        
        // Add a simple cube in front of the player
        const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
        const cubeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000 // Red
        });
        
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 2, -10); // 10 units in front of player
        this.scene.add(cube);
        this.collidableObjects.push(cube);
        
        // Add a blue cube to the left
        const blueCubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000FF // Blue
        });
        
        const blueCube = new THREE.Mesh(cubeGeometry, blueCubeMaterial);
        blueCube.position.set(-10, 2, -10); // Left and in front of player
        this.scene.add(blueCube);
        this.collidableObjects.push(blueCube);
        
        // Add a yellow cube to the right
        const yellowCubeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00 // Yellow
        });
        
        const yellowCube = new THREE.Mesh(cubeGeometry, yellowCubeMaterial);
        yellowCube.position.set(10, 2, -10); // Right and in front of player
        this.scene.add(yellowCube);
        this.collidableObjects.push(yellowCube);
        
        // Add ambient light - very bright to ensure visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);
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
                // Toggle aim
                const isAiming = this.weaponSystem.toggleAim();
                this.ui.updateCrosshair(isAiming);
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
        this.player.update(this.weaponSystem.isAimingDownSights());
        
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
