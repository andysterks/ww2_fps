import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a simple Three.js scene directly
    const simpleGame = new SimpleGame();
});

class SimpleGame {
    constructor() {
        // Core Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Configure renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Player controls
        this.controls = new PointerLockControls(this.camera, document.body);
        
        // Movement variables
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        this.playerSpeed = 10.0;
        this.sprintMultiplier = 1.5;
        
        // Weapon state
        this.bulletCount = 8;
        this.maxBullets = 8;
        this.canShoot = true;
        this.isReloading = false;
        this.isAiming = false;
        
        // Audio state
        this.muted = false;
        
        // Debug mode
        this.debugMode = true; // Set to true to enable debug info
        
        // Set initial position
        this.camera.position.set(0, 1.8, 5);
        this.controls.getObject().position.set(0, 1.8, 5);
        
        // Create environment
        this.createEnvironment();
        
        // Create weapon
        this.createWeapon();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    }
    
    createEnvironment() {
        // Set sky color
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4CAF50, // Green
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        this.scene.add(ground);
        
        // Create a street
        const streetGeometry = new THREE.PlaneGeometry(10, 1000);
        const streetMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444, // Dark gray
            side: THREE.DoubleSide
        });
        
        const street = new THREE.Mesh(streetGeometry, streetMaterial);
        street.rotation.x = -Math.PI / 2;
        street.position.y = 0.01; // Slightly above ground
        this.scene.add(street);
        
        // Add buildings
        this.addBuilding(0xFF0000, -15, 0, -20); // Red building
        this.addBuilding(0x0000FF, 15, 0, -20);  // Blue building
        this.addBuilding(0xFFFF00, 0, 0, -40);   // Yellow building
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
        this.scene.add(ambientLight);
    }
    
    addBuilding(color, x, y, z) {
        const buildingGeometry = new THREE.BoxGeometry(10, 10, 10);
        const buildingMaterial = new THREE.MeshBasicMaterial({ color: color });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, y + 5, z);
        
        this.scene.add(building);
    }
    
    createWeapon() {
        // Create a more realistic M1 Garand rifle with visible iron sights
        const weaponGroup = new THREE.Group();
        
        // Rifle body (receiver)
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 }) // Dark gray for metal parts
        );
        
        // Rifle stock
        const rifleStock = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.14, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }) // Brown wood
        );
        rifleStock.position.set(0, -0.02, 0.3);
        
        // Rifle handle/grip
        const rifleHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.2, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }) // Brown wood
        );
        rifleHandle.position.set(0, -0.15, 0.1);
        
        // Rifle barrel
        const rifleBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 }) // Dark gray for metal
        );
        rifleBarrel.rotation.x = Math.PI / 2;
        rifleBarrel.position.set(0, 0, -0.5);
        
        // Create a separate group for iron sights that will be visible in aim mode
        this.ironSightsGroup = new THREE.Group();
        
        // Front sight post - LARGER and more visible
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.08, 0.01),
            new THREE.MeshBasicMaterial({ color: 0x000000 }) // Black
        );
        frontSight.position.set(0, 0.08, -0.95);
        this.ironSightsGroup.add(frontSight);
        
        // Rear sight base - LARGER and more visible
        const rearSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.03, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x000000 }) // Black
        );
        rearSightBase.position.set(0, 0.07, -0.1);
        this.ironSightsGroup.add(rearSightBase);
        
        // Rear sight aperture - LARGER and more visible
        const rearSightAperture = new THREE.Mesh(
            new THREE.RingGeometry(0.015, 0.03, 16),
            new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }) // Black
        );
        rearSightAperture.rotation.x = Math.PI / 2;
        rearSightAperture.position.set(0, 0.07, -0.1);
        this.ironSightsGroup.add(rearSightAperture);
        
        // Add the iron sights group to the weapon
        weaponGroup.add(this.ironSightsGroup);
        
        // Add all parts to the weapon group
        weaponGroup.add(rifleBody);
        weaponGroup.add(rifleStock);
        weaponGroup.add(rifleHandle);
        weaponGroup.add(rifleBarrel);
        
        // Create muzzle flash (initially hidden)
        const muzzleFlash = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.15, 8),
            new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.8 })
        );
        muzzleFlash.rotation.x = Math.PI / 2;
        muzzleFlash.position.set(0, 0, -1.0);
        muzzleFlash.visible = false;
        weaponGroup.add(muzzleFlash);
        this.muzzleFlash = muzzleFlash;
        
        // Position weapon in hip-fire position (default)
        weaponGroup.position.set(0.3, -0.3, -0.5);
        weaponGroup.rotation.set(0, 0, 0);
        
        // Store original position for returning from aim
        this.weaponDefaultPosition = new THREE.Vector3(0.3, -0.3, -0.5);
        this.weaponDefaultRotation = new THREE.Vector3(0, 0, 0);
        
        // Store aim position - centered and closer to simulate looking down sights
        // Move it more into view to clearly see the iron sights
        this.weaponAimPosition = new THREE.Vector3(0, -0.02, -0.2);
        this.weaponAimRotation = new THREE.Vector3(0, 0, 0);
        
        // Add weapon to camera
        this.camera.add(weaponGroup);
        this.weapon = weaponGroup;
        
        // Update ammo counter
        this.updateAmmoCounter();
    }
    
    setupEventListeners() {
        // Lock pointer on click and shoot
        document.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            } else {
                // Always attempt to shoot when clicked
                console.log('Click detected, attempting to shoot');
                this.shoot();
            }
        });
        
        // Handle key presses for movement and actions
        document.addEventListener('keydown', (event) => {
            if (this.controls.isLocked) {
                switch (event.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        this.moveForward = true;
                        break;
                        
                    case 'KeyS':
                    case 'ArrowDown':
                        this.moveBackward = true;
                        break;
                        
                    case 'KeyA':
                    case 'ArrowLeft':
                        this.moveLeft = true;
                        break;
                        
                    case 'KeyD':
                    case 'ArrowRight':
                        this.moveRight = true;
                        break;
                        
                    case 'ShiftLeft':
                        this.isSprinting = true;
                        break;
                        
                    case 'KeyR':
                        // Reload weapon
                        if (!this.isReloading && this.bulletCount < this.maxBullets) {
                            this.reload();
                        }
                        break;
                        
                    case 'KeyF':
                        // Toggle aim
                        this.toggleAim();
                        break;
                }
            }
        });
        
        // Handle key releases for movement
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = false;
                    break;
                    
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = false;
                    break;
                    
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = false;
                    break;
                    
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = false;
                    break;
                    
                case 'ShiftLeft':
                    this.isSprinting = false;
                    break;
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            // Update UI based on pointer lock state
            const instructions = document.getElementById('instructions');
            if (instructions) {
                instructions.style.display = this.controls.isLocked ? 'none' : 'block';
            }
            
            // Reset movement when pointer is unlocked
            if (!this.controls.isLocked) {
                this.moveForward = false;
                this.moveBackward = false;
                this.moveLeft = false;
                this.moveRight = false;
                this.isSprinting = false;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Initialize sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleSound();
            });
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Only update if controls are locked
        if (this.controls.isLocked) {
            // Calculate delta time
            const time = performance.now();
            const delta = (time - this.prevTime) / 1000; // Convert to seconds
            
            // Update velocity with friction
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            
            // Set movement direction
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize(); // Ensure consistent movement in all directions
            
            // Calculate movement speed (with sprint)
            const speedMultiplier = this.isSprinting ? this.sprintMultiplier : 1.0;
            const moveSpeed = this.playerSpeed * speedMultiplier * delta;
            
            // Apply movement to velocity
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * moveSpeed;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * moveSpeed;
            
            // Move the player
            this.controls.moveRight(-this.velocity.x);
            this.controls.moveForward(-this.velocity.z);
            
            // Update weapon sway
            if (this.weapon) {
                this.updateWeaponSway();
            }
            
            // Update debug info
            if (this.debugMode) {
                this.updateDebugInfo();
            }
            
            // Store current time for next frame
            this.prevTime = time;
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.style.display = 'block';
            debugInfo.innerHTML = `
                <div>Bullets: ${this.bulletCount}/${this.maxBullets}</div>
                <div>Can Shoot: ${this.canShoot}</div>
                <div>Is Reloading: ${this.isReloading}</div>
                <div>Is Aiming: ${this.isAiming}</div>
                <div>Position: ${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)}</div>
                <div>Movement: F:${this.moveForward} B:${this.moveBackward} L:${this.moveLeft} R:${this.moveRight}</div>
            `;
        }
    }
    
    shoot() {
        // Debug the current state
        console.log(`Shooting - Bullets: ${this.bulletCount}, CanShoot: ${this.canShoot}, IsReloading: ${this.isReloading}`);
        
        if (this.bulletCount <= 0 || !this.canShoot || this.isReloading) {
            // Play empty click sound
            if (this.bulletCount <= 0) {
                console.log('Empty click');
                // Create and play a click sound if not muted
                if (!this.muted) {
                    const clickSound = new Audio('./sounds/empty_click.mp3');
                    clickSound.volume = 0.5;
                    clickSound.play().catch(e => console.error('Error playing empty click:', e));
                }
            }
            return;
        }
        
        // Prevent rapid firing
        this.canShoot = false;
        
        // Decrease bullet count
        this.bulletCount--;
        console.log(`Bullets remaining: ${this.bulletCount}`);
        
        // Update ammo counter
        this.updateAmmoCounter();
        
        // Play gunshot sound if not muted
        console.log('Playing gunshot sound');
        if (!this.muted) {
            const gunshotSound = new Audio('./sounds/m1_garand_shot.mp3');
            gunshotSound.volume = 0.5;
            gunshotSound.play().catch(e => console.error('Error playing gunshot:', e));
            
            // Play M1 Garand ping if last bullet
            if (this.bulletCount === 0) {
                setTimeout(() => {
                    const pingSound = new Audio('./sounds/m1_garand_ping.mp3');
                    pingSound.volume = 0.5;
                    pingSound.play().catch(e => console.error('Error playing ping:', e));
                }, 300);
            }
        }
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.visible = true;
            setTimeout(() => {
                this.muzzleFlash.visible = false;
            }, 50);
        }
        
        // Create bullet impact
        this.createBulletImpact();
        
        // Add recoil effect
        this.addRecoilEffect();
        
        // Auto reload if empty
        if (this.bulletCount === 0) {
            setTimeout(() => this.reload(), 1000);
        }
        
        // Reset shooting ability after delay
        setTimeout(() => {
            this.canShoot = true;
            console.log('Ready to shoot again');
        }, 200);
    }
    
    reload() {
        if (this.isReloading || this.bulletCount >= this.maxBullets) return;
        
        this.isReloading = true;
        
        // Play reload sound if not muted
        console.log('Playing reload sound');
        if (!this.muted) {
            const reloadSound = new Audio('./sounds/m1_garand_reload.mp3');
            reloadSound.volume = 0.5;
            reloadSound.play().catch(e => console.error('Error playing reload sound:', e));
        }
        
        // Reload animation could be added here
        
        // Complete reload after delay
        setTimeout(() => {
            this.bulletCount = this.maxBullets;
            this.isReloading = false;
            this.updateAmmoCounter();
        }, 2000);
    }
    
    toggleAim() {
        // Toggle aiming state
        this.isAiming = !this.isAiming;
        
        // Change FOV based on aiming state
        const targetFOV = this.isAiming ? 45 : 75;
        
        // Animate FOV change
        const fovInterval = setInterval(() => {
            const step = this.isAiming ? -2 : 2;
            this.camera.fov += step;
            
            if ((this.isAiming && this.camera.fov <= targetFOV) || 
                (!this.isAiming && this.camera.fov >= targetFOV)) {
                this.camera.fov = targetFOV;
                clearInterval(fovInterval);
            }
            
            this.camera.updateProjectionMatrix();
        }, 16);
        
        // Update crosshair
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.opacity = this.isAiming ? '0.3' : '1';
        }
        
        return this.isAiming;
    }
    
    toggleSound() {
        // Toggle mute state
        this.muted = !this.muted;
        
        // Update sound toggle button
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            if (this.muted) {
                soundToggle.textContent = '🔇';
                soundToggle.className = 'sound-off';
            } else {
                soundToggle.textContent = '🔊';
                soundToggle.className = 'sound-on';
            }
        }
        
        console.log('Sound ' + (this.muted ? 'muted' : 'unmuted'));
    }
    
    updateAmmoCounter() {
        const ammoCounter = document.getElementById('ammo');
        if (ammoCounter) {
            ammoCounter.textContent = `${this.bulletCount}/${this.maxBullets}`;
            
            // Highlight the ammo counter when low on ammo
            if (this.bulletCount <= 2) {
                ammoCounter.style.color = '#ff4444';
                ammoCounter.style.animation = 'pulse 1s infinite';
            } else {
                ammoCounter.style.color = 'white';
                ammoCounter.style.animation = 'none';
            }
        }
    }
    
    createBulletImpact() {
        // Create a raycaster for bullet trajectory
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        
        // Check for intersections with objects in the scene
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            // Get the first intersection point
            const intersection = intersects[0];
            
            // Create a simple bullet hole
            const bulletHole = new THREE.Mesh(
                new THREE.CircleGeometry(0.05, 8),
                new THREE.MeshBasicMaterial({ color: 0x000000 })
            );
            
            // Position the bullet hole at the intersection point
            bulletHole.position.copy(intersection.point);
            
            // Orient the bullet hole to face the camera
            bulletHole.lookAt(this.camera.position);
            
            // Add a small offset to prevent z-fighting
            bulletHole.position.add(intersection.face.normal.multiplyScalar(0.01));
            
            // Add the bullet hole to the scene
            this.scene.add(bulletHole);
            
            // Create simple impact particles
            this.createImpactParticles(intersection.point, intersection.face.normal);
        }
    }
    
    createImpactParticles(position, normal) {
        // Create a simple particle system for impact effect
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFFF00,
            size: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        // Create particles
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            // Random position around impact point
            const x = position.x + (Math.random() - 0.5) * 0.2;
            const y = position.y + (Math.random() - 0.5) * 0.2;
            const z = position.z + (Math.random() - 0.5) * 0.2;
            
            particles.push(x, y, z);
        }
        
        // Set particle positions
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particles, 3));
        
        // Create particle system
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);
        
        // Remove particles after a short time
        setTimeout(() => {
            this.scene.remove(particleSystem);
            particleGeometry.dispose();
            particleMaterial.dispose();
        }, 500);
    }
    
    addRecoilEffect() {
        // Recoil effect that's reduced when aiming
        if (this.weapon) {
            // Store original position
            const originalPosition = this.weapon.position.clone();
            
            // Calculate recoil amount (less when aiming)
            const recoilAmount = this.isAiming ? 0.02 : 0.05;
            
            // Apply recoil to weapon
            this.weapon.position.z += recoilAmount;
            
            // Apply camera recoil
            const cameraRecoil = this.isAiming ? 0.2 : 0.5;
            this.camera.rotation.x -= THREE.MathUtils.degToRad(cameraRecoil);
            
            // Return weapon to original position
            setTimeout(() => {
                this.weapon.position.copy(originalPosition);
            }, 100);
            
            // Return camera to original rotation
            setTimeout(() => {
                this.camera.rotation.x += THREE.MathUtils.degToRad(cameraRecoil);
            }, 150);
        }
    }
    
    updateWeaponSway() {
        if (!this.weapon) return;
        
        // Add subtle weapon sway
        const time = Date.now() * 0.001;
        const swayX = Math.sin(time) * 0.002;
        const swayY = Math.cos(time * 0.5) * 0.002;
        
        this.weapon.position.x = 0.3 + swayX;
        this.weapon.position.y = -0.3 + swayY;
    }
}

/* 
Old monolithic implementation - replaced with modular architecture

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import audioManager from './audio.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        this.controls = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false; // For sprint functionality
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        
        // Collision detection properties
        this.collidableObjects = [];
        this.playerHeight = 1.8; // Player height for collision detection (slightly shorter to prevent ceiling issues)
        this.playerRadius = 0.4; // Player collision radius (slightly smaller to prevent getting stuck)
        this.raycaster = new THREE.Raycaster();
        this.stuckCounter = 0; // Counter to track potential stuck situations
        
        // Weapon properties
        this.weaponCamera = null;
        this.weaponScene = null;
        this.weapon = null;
        this.isAiming = false;
        this.defaultFOV = 75;
        this.aimingFOV = 45;
        this.weaponBob = { x: 0, y: 0 };
        this.lastStep = 0;
        this.stepFreq = 2;
        this.bobAmount = 0.015;
        
        // View bobbing effect - only vertical bobbing for realism
        this.viewBobOffset = 0; // Only use a single value for vertical bobbing
        this.viewBobAmount = 0.008; // Subtle head bobbing
        this.viewBobFreq = 4;
        this.headBobTimer = 0;
        
        // Breathing effect
        this.breathingAmount = 0.0015;
        this.breathingFreq = 0.5;
        
        // Shooting properties
        this.isShooting = false;
        this.canShoot = true;
        this.shootingCooldown = 500; // milliseconds between shots
        this.lastShotTime = 0;
        this.muzzleFlash = null;
        this.bulletCount = 8; // M1 Garand clip size
        
        // Input tracking
        this.keys = {};
        this.mouseButtons = {};

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87ceeb); // Sky blue background
        this.renderer.autoClear = false; // Important for rendering weapon on top
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera and controls
        this.camera.position.y = 2;
        this.controls = new PointerLockControls(this.camera, document.body);
        
        // Initialize audio manager
        audioManager.init();
        
        // Setup weapon camera and scene
        this.setupWeaponSystem();

        // Add event listeners
        document.addEventListener('click', (event) => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            } else if (this.isAiming && this.canShoot) {
                this.shoot();
            }
        });
        
        // Right-click for aiming down sights
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (this.controls.isLocked) {
                this.toggleAiming();
            }
        });
        
        // Track mouse button states (for Mac trackpad support)
        document.addEventListener('mousedown', (event) => {
            this.mouseButtons[event.button] = true;
            // Right mouse button (button 2) for aiming
            if (event.button === 2 && this.controls.isLocked) {
                this.toggleAiming();
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            this.mouseButtons[event.button] = false;
        });
        
        // Additional Mac trackpad support
        document.addEventListener('pointerdown', (event) => {
            if (event.button === 2 && this.controls.isLocked) {
                this.toggleAiming();
            }
        });
        
        // Hide instructions after a while
        setTimeout(() => {
            const instructions = document.getElementById('instructions');
            if (instructions) {
                instructions.style.opacity = '0';
                instructions.style.transition = 'opacity 1s';
            }
        }, 10000); // Hide after 10 seconds
        
        // Setup sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        const audioStatus = document.getElementById('audio-status');
        
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const isMuted = audioManager.toggleMute();
                soundToggle.textContent = isMuted ? '🔇' : '🔊';
                soundToggle.className = isMuted ? 'sound-off' : 'sound-on';
            });
        }
        
        // Update audio status indicator
        const updateAudioStatus = () => {
            if (!audioStatus) return;
            
            if (audioManager.audioContext) {
                if (audioManager.audioContext.state === 'running' && !audioManager.pendingUserInteraction) {
                    audioStatus.textContent = 'Audio enabled';
                    audioStatus.style.opacity = '1';
                    
                    // Fade out after 3 seconds
                    setTimeout(() => {
                        audioStatus.style.opacity = '0';
                    }, 3000);
                } else {
                    audioStatus.textContent = 'Click anywhere to enable audio';
                    audioStatus.style.opacity = '1';
                }
            }
        };
        
        // Check audio status periodically
        setInterval(updateAudioStatus, 1000);
        
        // Also update when user clicks
        document.addEventListener('click', () => {
            // Short delay to allow audio context to resume
            setTimeout(updateAudioStatus, 500);
        });

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        window.addEventListener('resize', () => this.onWindowResize());

        // Create basic environment
        this.createEnvironment();

        // Start game loop
        this.animate();
    }

    createEnvironment() {
        // Ground (street)
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777, // Slightly lighter color for daytime visibility
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add daytime lighting
        const ambientLight = new THREE.AmbientLight(0x9db3ff, 0.6); // Soft blue-tinted ambient light
        this.scene.add(ambientLight);
        
        // Main sunlight (directional light)
        const sunLight = new THREE.DirectionalLight(0xffffcc, 1.2); // Warm sunlight
        sunLight.position.set(50, 100, 30);
        sunLight.castShadow = true;
        
        // Configure shadow properties
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Add a hemisphere light for better outdoor lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x696969, 0.6); // Sky blue from above, gray from ground
        this.scene.add(hemisphereLight);
        
        // Create light fog for atmosphere (lighter blue for daytime)
        this.scene.fog = new THREE.FogExp2(0xd7e1ff, 0.01);

        // Create a street with 3 houses on each side
        this.createStreet();
    }

    createStreet() {
        // Create a street with 3 houses on each side
        const streetWidth = 10; // Width of the street
        const houseSpacing = 15; // Distance between houses
        
        // Left side of the street (3 houses)
        for (let i = 0; i < 3; i++) {
            const z = -20 + (i * houseSpacing);
            this.createDamagedHouse(-streetWidth/2 - 5, 0, z, true);
            
            // Add some rubble near the houses
            this.createRubblePile(-streetWidth/2 - 3, 0, z + 4, 2);
        }
        
        // Right side of the street (3 houses)
        for (let i = 0; i < 3; i++) {
            const z = -25 + (i * houseSpacing);
            this.createDamagedHouse(streetWidth/2 + 5, 0, z, false);
            
            // Add some rubble near the houses
            this.createRubblePile(streetWidth/2 + 3, 0, z + 5, 1.5);
        }
        
        // Add street props
        this.createStreetProps();
    }
    
    createDamagedHouse(x, y, z, isLeftSide) {
        // Base building
        const width = 8 + Math.random() * 2;
        const height = 6 + Math.random() * 4;
        const depth = 10 + Math.random() * 3;
        
        // Building material with texture
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0xd3b17d : 0xc2b280, // Sandstone/tan colors
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create main building structure
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            buildingMaterial
        );
        building.position.set(x, y + height/2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        
        // Add to collidable objects list for collision detection
        this.collidableObjects.push(building);
        
        // Add a damaged roof (sloped)
        const roofGeometry = new THREE.ConeGeometry(width/1.5, height/2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown
            roughness: 0.8,
            metalness: 0.1
        }); 
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.rotation.y = Math.PI/4;
        roof.position.set(x, y + height + height/4, z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        
        // Make some roofs damaged (missing or partially collapsed)
        if (Math.random() > 0.3) {
            this.scene.add(roof);
        }
        
        // Add windows
        this.addWindows(x, y, z, width, height, depth, isLeftSide);
        
        // Add damage to the building (holes in walls)
        if (Math.random() > 0.5) {
            this.createDamageHole(x, y + height/2, z, width, height, depth, isLeftSide);
        }
    }
    
    addWindows(x, y, z, width, height, depth, isLeftSide) {
        const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Dark windows
        const windowGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.5);
        
        // Front windows
        const frontZ = z + depth/2;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                if (Math.random() > 0.3) { // Some windows are destroyed
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                    windowMesh.position.set(
                        x - width/4 + i * width/3, 
                        y + height/4 + j * height/2, 
                        frontZ + 0.1
                    );
                    this.scene.add(windowMesh);
                }
            }
        }
        
        // Side windows
        const sideX = isLeftSide ? x + width/2 : x - width/2;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                if (Math.random() > 0.4) { // Some windows are destroyed
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                    windowMesh.rotation.y = Math.PI/2;
                    windowMesh.position.set(
                        sideX + 0.1,
                        y + height/4 + j * height/2,
                        z - depth/4 + i * depth/2
                    );
                    this.scene.add(windowMesh);
                }
            }
        }
    }
    
    createDamageHole(x, y, z, width, height, depth, isLeftSide) {
        // Create a hole in the building (damage)
        const holeSize = 2 + Math.random() * 2;
        const holeGeometry = new THREE.SphereGeometry(holeSize, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        
        // Position the hole on a random wall
        const wallChoice = Math.floor(Math.random() * 3);
        
        if (wallChoice === 0) {
            // Front wall
            hole.position.set(x - width/4 + Math.random() * width/2, y, z + depth/2);
            hole.rotation.y = Math.PI;
        } else if (wallChoice === 1) {
            // Back wall
            hole.position.set(x - width/4 + Math.random() * width/2, y, z - depth/2);
        } else {
            // Side wall
            const sideX = isLeftSide ? x + width/2 : x - width/2;
            hole.position.set(sideX, y, z - depth/4 + Math.random() * depth/2);
            hole.rotation.y = isLeftSide ? -Math.PI/2 : Math.PI/2;
        }
        
        this.scene.add(hole);
    }
    
    createRubblePile(x, y, z, size) {
        const rubbleCount = 10 + Math.floor(Math.random() * 15);
        const rubbleGroup = new THREE.Group();
        
        for (let i = 0; i < rubbleCount; i++) {
            // Create random sized rocks/debris
            const rubbleSize = 0.2 + Math.random() * 0.8;
            let rubbleGeometry;
            
            // Different types of rubble
            const rubbleType = Math.floor(Math.random() * 3);
            if (rubbleType === 0) {
                rubbleGeometry = new THREE.BoxGeometry(rubbleSize, rubbleSize, rubbleSize);
            } else if (rubbleType === 1) {
                rubbleGeometry = new THREE.SphereGeometry(rubbleSize/2, 4, 4);
            } else {
                rubbleGeometry = new THREE.TetrahedronGeometry(rubbleSize/2);
            }
            
            // Rubble material (gray/brown tones)
            const rubbleColor = Math.random() > 0.5 ? 0x808080 : 0x8B4513;
            const rubbleMaterial = new THREE.MeshStandardMaterial({ 
                color: rubbleColor,
                roughness: 1.0
            });
            
            const rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
            rubble.castShadow = true;
            rubble.receiveShadow = true;
            
            // Position within the pile area
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * size;
            rubble.position.set(
                x + Math.cos(angle) * radius,
                y + rubbleSize/2 + Math.random() * 0.5,
                z + Math.sin(angle) * radius
            );
            
            // Random rotation
            rubble.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rubbleGroup.add(rubble);
        }
        
        this.scene.add(rubbleGroup);
    }
    
    createStreetProps() {
        // Add street props like broken lamp posts, debris, etc.
        
        // Broken lamp post
        this.createLampPost(5, 0, -10, true);
        this.createLampPost(-5, 0, -30, false);
        
        // Barricades made of sandbags
        this.createSandbagBarricade(0, 0, -5, 5, 1);
        this.createSandbagBarricade(-8, 0, -15, 3, 2);
        
        // Create invisible walls at the edges of the map to prevent falling off
        this.createBoundaryWall(0, 0, -50, 100, 10, 1); // Back wall
        this.createBoundaryWall(0, 0, 50, 100, 10, 1);  // Front wall
        this.createBoundaryWall(-50, 0, 0, 1, 10, 100); // Left wall
        this.createBoundaryWall(50, 0, 0, 1, 10, 100);  // Right wall
        
        // Scattered debris across the street
        for (let i = 0; i < 10; i++) {
            const x = -4 + Math.random() * 8;
            const z = -40 + Math.random() * 40;
            this.createRubblePile(x, 0, z, 1);
        }
    }
    
    createLampPost(x, y, z, isBroken) {
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.castShadow = true;
        post.receiveShadow = true;
        
        if (isBroken) {
            // Broken lamp post (tilted)
            post.position.set(x, y + 1.5, z);
            post.rotation.x = Math.PI/4;
            post.rotation.z = Math.PI/6;
        } else {
            // Standing lamp post
            post.position.set(x, y + 2.5, z);
        }
        
        // Add lamp head
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const lampGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.castShadow = true;
        lamp.receiveShadow = true;
        
        if (isBroken) {
            lamp.position.set(x + 1, y + 3, z + 1);
        } else {
            lamp.position.set(x, y + 5.2, z);
        }
        
        this.scene.add(post);
        this.scene.add(lamp);
    }
    
    createSandbagBarricade(x, y, z, width, height) {
        const sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
        const sandbagGroup = new THREE.Group();
        
        for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
                const sandbagGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
                sandbagGeometry.rotateX(Math.PI/2);
                
                const sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
                sandbag.castShadow = true;
                sandbag.receiveShadow = true;
                sandbag.position.set(
                    x - width/2 + w + (h % 2) * 0.5,
                    y + 0.4 + h * 0.3,
                    z
                );
                
                // Add some randomness to sandbag placement
                sandbag.rotation.z = Math.random() * 0.2 - 0.1;
                sandbag.rotation.y = Math.random() * 0.2 - 0.1;
                
                sandbagGroup.add(sandbag);
            }
        }
        
        this.scene.add(sandbagGroup);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            // F key for aiming down sights (alternative to right-click)
            case 'KeyF':
                if (this.controls.isLocked) {
                    this.toggleAiming();
                }
                break;
            // R key for manual reload
            case 'KeyR':
                if (this.controls.isLocked) {
                    this.reload();
                }
                break;
            // Shift key for sprinting
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isSprinting = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
            // Release sprint
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isSprinting = false;
                break;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        if (this.weaponCamera) {
            this.weaponCamera.aspect = window.innerWidth / window.innerHeight;
            this.weaponCamera.updateProjectionMatrix();
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateMovement() {
        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Extremely slow movement speed for maximum realism
        const baseSpeed = 62.5; // Reduced by another 50% (now 1/8 of original 400.0 value)
        const sprintModifier = this.isSprinting ? 1.5 : 1.0;
        const aimingModifier = this.isAiming ? 0.6 : 1.0; // Move slower when aiming
        const speedModifier = sprintModifier * aimingModifier;
        
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * baseSpeed * speedModifier * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * baseSpeed * speedModifier * delta;
        }
        
        // Get current position before movement
        const currentPosition = this.controls.getObject().position.clone();
        
        // Try moving along both axes at once
        const moveX = -this.velocity.x * delta;
        const moveZ = -this.velocity.z * delta;
        
        // First, try the combined movement
        if (!this.checkCollision(moveX, moveZ)) {
            // No collision, move freely
            this.controls.moveRight(moveX);
            this.controls.moveForward(moveZ);
        } else {
            // Collision detected, try to slide along walls
            
            // Try moving only horizontally
            if (!this.checkCollision(moveX, 0)) {
                this.controls.moveRight(moveX);
            }
            
            // Try moving only vertically
            if (!this.checkCollision(0, moveZ)) {
                this.controls.moveForward(moveZ);
            }
            
            // If we're still stuck, try small incremental movements
            if (this.isStuck(currentPosition)) {
                this.unstickPlayer();
            }
        }

        this.prevTime = time;
    }
    
    // Check if player is stuck by comparing current position to previous position
    isStuck(previousPosition) {
        const currentPosition = this.controls.getObject().position.clone();
        return currentPosition.distanceTo(previousPosition) < 0.001 && 
               (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight);
    }
    
    // Try to unstick the player by making small movements in various directions
    unstickPlayer() {
        const escapeDirections = [
            { x: 0.1, z: 0 },
            { x: -0.1, z: 0 },
            { x: 0, z: 0.1 },
            { x: 0, z: -0.1 },
            { x: 0.1, z: 0.1 },
            { x: -0.1, z: 0.1 },
            { x: 0.1, z: -0.1 },
            { x: -0.1, z: -0.1 }
        ];
        
        // Try each escape direction until one works
        for (const dir of escapeDirections) {
            if (!this.checkCollision(dir.x, dir.z)) {
                this.controls.moveRight(dir.x);
                this.controls.moveForward(dir.z);
                break;
            }
        }
    }

    // Check for collisions in the given direction
    checkCollision(moveX, moveZ) {
        // Get current position
        const position = this.controls.getObject().position.clone();
        
        // Calculate potential new position
        const newPosition = position.clone();
        newPosition.x += moveX;
        newPosition.z += moveZ;
        
        // Define collision parameters
        const collisionRadius = this.playerRadius + 0.1; // Slightly larger to prevent clipping
        const collisionMargin = 0.05; // Small margin to prevent getting stuck
        
        // Cast rays in the movement direction
        let collisionDetected = false;
        
        // Cast rays in the primary movement directions
        if (moveX !== 0 || moveZ !== 0) {
            // Create a normalized movement direction vector
            const moveDirection = new THREE.Vector3(moveX, 0, moveZ).normalize();
            
            // Check collisions at different heights
            const heights = [0.2, this.playerHeight / 2, this.playerHeight - 0.2];
            
            for (const height of heights) {
                // Set ray origin at current position plus height
                const rayOrigin = position.clone();
                rayOrigin.y += height;
                
                // Cast ray in movement direction
                this.raycaster.set(rayOrigin, moveDirection);
                const intersections = this.raycaster.intersectObjects(this.collidableObjects);
                
                // Check if we're too close to an object
                if (intersections.length > 0 && intersections[0].distance < collisionRadius) {
                    collisionDetected = true;
                    break;
                }
            }
        }
        
        // If no direct collision, check for side collisions to prevent corner clipping
        if (!collisionDetected) {
            // Cast rays in multiple directions to check for nearby walls
            const directions = [
                new THREE.Vector3(1, 0, 0),   // Right
                new THREE.Vector3(-1, 0, 0),  // Left
                new THREE.Vector3(0, 0, 1),   // Forward
                new THREE.Vector3(0, 0, -1),  // Backward
            ];
            
            for (const direction of directions) {
                // Set ray origin at the new position
                const rayOrigin = newPosition.clone();
                rayOrigin.y += this.playerHeight / 2; // Check at mid-height
                
                // Cast ray
                this.raycaster.set(rayOrigin, direction);
                const intersections = this.raycaster.intersectObjects(this.collidableObjects);
                
                // If we're too close to a wall, we need to adjust position
                if (intersections.length > 0 && intersections[0].distance < collisionMargin) {
                    collisionDetected = true;
                    break;
                }
            }
        }
        
        return collisionDetected;
    }
    
    // Create invisible boundary walls to prevent player from leaving the map
    createBoundaryWall(x, y, z, width, height, depth) {
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wallMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.0 // Invisible
        });
        
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, y + height/2, z);
        this.scene.add(wall);
        
        // Add to collidable objects
        this.collidableObjects.push(wall);
    }
    
    setupWeaponSystem() {
        // Create weapon scene and camera
        this.weaponScene = new THREE.Scene();
        this.weaponCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
        
        // Add lighting to weapon scene
        const weaponLight = new THREE.DirectionalLight(0xffffff, 1);
        weaponLight.position.set(1, 1, 1);
        this.weaponScene.add(weaponLight);
        
        const weaponAmbientLight = new THREE.AmbientLight(0x404040, 1);
        this.weaponScene.add(weaponAmbientLight);
        
        // Create a simple M1 Garand model (placeholder until we can load a proper model)
        this.createSimpleM1Garand();
    }
    
    createSimpleM1Garand() {
        const weaponGroup = new THREE.Group();
        
        // Main rifle body
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 1),
            new THREE.MeshStandardMaterial({ color: 0x5c3d2e }) // Wood color
        );
        rifleBody.position.z = -0.2;
        weaponGroup.add(rifleBody);
        
        // Barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.7, 16),
            new THREE.MeshStandardMaterial({ color: 0x2c2c2c }) // Metal color
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.7;
        barrel.position.y = 0.02;
        weaponGroup.add(barrel);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.03, 0.01, 8, 16, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
        );
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.position.y = -0.04;
        triggerGuard.position.z = 0.1;
        weaponGroup.add(triggerGuard);
        
        // Trigger
        const trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.04, 0.01),
            new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
        );
        trigger.position.y = -0.02;
        trigger.position.z = 0.1;
        weaponGroup.add(trigger);
        
        // Sight
        const sight = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.03, 0.01),
            new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
        );
        sight.position.y = 0.08;
        sight.position.z = -0.5;
        weaponGroup.add(sight);
        
        // Create muzzle flash (hidden by default)
        const muzzleFlashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const muzzleFlash = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            muzzleFlashMaterial
        );
        muzzleFlash.position.z = -0.8;
        muzzleFlash.position.y = 0.02;
        muzzleFlash.visible = false;
        weaponGroup.add(muzzleFlash);
        this.muzzleFlash = muzzleFlash;
        
        // Position the weapon in front of the camera
        weaponGroup.position.set(0.2, -0.2, -0.5);
        weaponGroup.rotation.y = Math.PI / 12; // Slight angle
        
        this.weapon = weaponGroup;
        this.weaponScene.add(this.weapon);
    }
    
    toggleAiming() {
        this.isAiming = !this.isAiming;
        
        // Toggle scope overlay
        const scopeOverlay = document.getElementById('scope-overlay');
        scopeOverlay.classList.toggle('hidden', !this.isAiming);
        
        // Toggle HUD class for crosshair visibility
        document.getElementById('hud').classList.toggle('aiming', this.isAiming);
        
        // Animate FOV change
        this.animateFOV(this.isAiming ? this.aimingFOV : this.defaultFOV, 200);
        
        // Adjust weapon position
        if (this.weapon) {
            if (this.isAiming) {
                // Move weapon to center when aiming
                this.weapon.position.set(0, -0.1, -0.3);
                this.weapon.rotation.y = 0;
            } else {
                // Return to hip position
                this.weapon.position.set(0.2, -0.2, -0.5);
                this.weapon.rotation.y = Math.PI / 12;
            }
        }
    }
    
    animateFOV(targetFOV, duration) {
        const startFOV = this.camera.fov;
        const startTime = performance.now();
        
        const updateFOV = (time) => {
            const elapsed = time - startTime;
            if (elapsed < duration) {
                const t = elapsed / duration;
                this.camera.fov = startFOV + (targetFOV - startFOV) * t;
                this.camera.updateProjectionMatrix();
                requestAnimationFrame(updateFOV);
            } else {
                this.camera.fov = targetFOV;
                this.camera.updateProjectionMatrix();
            }
        };
        
        requestAnimationFrame(updateFOV);
    }
    
    updateWeaponPosition() {
        if (!this.weapon || !this.controls.isLocked) return;
        
        const now = performance.now();
        
        // Calculate weapon bob based on movement
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            // Increase step frequency based on speed
            const currentStepFreq = this.isSprinting ? this.stepFreq * 1.3 : this.stepFreq;
            const bobX = Math.sin(now * 0.01 * currentStepFreq) * this.bobAmount;
            const bobY = Math.abs(Math.sin(now * 0.01 * currentStepFreq * 2)) * this.bobAmount;
            
            this.weaponBob.x = bobX;
            this.weaponBob.y = bobY;
            
            // Update head bob timer for view bobbing
            this.headBobTimer += 0.016; // Approximate for 60fps
        } else {
            // Gradually return to center when not moving
            this.weaponBob.x *= 0.9;
            this.weaponBob.y *= 0.9;
            
            // Slow down head bob when not moving
            this.headBobTimer *= 0.9;
        }
        
        // Calculate breathing effect (always present)
        const breathingY = Math.sin(now * 0.001 * this.breathingFreq) * this.breathingAmount;
        
        // Apply weapon bob and shooting animation
        let posX, posY;
        
        if (this.isAiming) {
            // Reduced bob when aiming
            posX = 0 + this.weaponBob.x * 0.2;
            posY = -0.1 + this.weaponBob.y * 0.2;
        } else {
            posX = 0.2 + this.weaponBob.x;
            posY = -0.2 + this.weaponBob.y;
        }
        
        // Apply shooting animation if active
        if (this.isShooting) {
            const shootTime = performance.now() - this.lastShotTime;
            if (shootTime < 100) { // Recoil animation duration
                // Recoil back and up
                const recoilAmount = (1 - shootTime / 100) * 0.1; // Max recoil amount
                posY += recoilAmount * 0.5; // Up
                this.weapon.position.z += recoilAmount; // Back
            } else {
                // Return to normal position
                this.weapon.position.z *= 0.8;
                this.isShooting = false;
                
                // Hide muzzle flash after animation
                if (this.muzzleFlash) {
                    this.muzzleFlash.visible = false;
                }
            }
        }
        
        this.weapon.position.x = posX;
        this.weapon.position.y = posY;
    }
    
    shoot() {
        if (!this.canShoot) return;
        
        if (this.bulletCount <= 0) {
            // Play empty click sound if out of ammo
            console.log('Playing empty click sound');
            audioManager.play('empty', { volume: 0.5 });
            return;
        }
        
        // Set shooting state
        this.isShooting = true;
        this.lastShotTime = performance.now();
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.visible = true;
            
            // Randomize muzzle flash size for effect
            const flashSize = 0.03 + Math.random() * 0.04;
            this.muzzleFlash.scale.set(flashSize, flashSize, flashSize * 2);
        }
        
        // Play gunshot sound
        console.log('Playing gunshot sound, audio context state:', audioManager.audioContext ? audioManager.audioContext.state : 'no context');
        console.log('Audio initialized:', audioManager.initialized, 'Pending interaction:', audioManager.pendingUserInteraction);
        
        // Play the gunshot sound (now using the new converted sound)
        audioManager.play('gunshot', { volume: 0.7 });
        
        // Play the iconic M1 Garand ping sound on last bullet
        if (this.bulletCount === 1) {
            setTimeout(() => {
                console.log('Playing ping sound');
                audioManager.play('ping', { volume: 0.6 });
            }, 300);
        }
        
        // Update ammo count
        this.bulletCount--;
        document.getElementById('ammo').textContent = this.bulletCount + '/8';
        
        // Cast a ray to check for hits
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        // Check for hits
        if (intersects.length > 0) {
            const hit = intersects[0];
            
            // Ignore hits that are too close (like the weapon itself)
            if (hit.distance < 1) return;
            
            console.log('Hit:', hit.object, 'at distance', hit.distance);
            
            // Create impact effect at hit point
            this.createImpactEffect(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0));
        }
        
        // Set cooldown
        this.canShoot = false;
        setTimeout(() => {
            this.canShoot = true;
        }, this.shootingCooldown);
        
        // Auto-reload when empty
        if (this.bulletCount === 0) {
            this.reload();
        }
    }
    
    createImpactEffect(position, normal) {
        // Create a simple impact effect (bullet hole or spark)
        const impactGroup = new THREE.Group();
        
        // Bullet hole (small dark circle)
        const bulletHole = new THREE.Mesh(
            new THREE.CircleGeometry(0.05, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
        );
        
        // Orient the bullet hole to face the normal direction
        bulletHole.lookAt(normal.clone().add(position));
        bulletHole.position.copy(position.clone().addScaledVector(normal, 0.01)); // Offset slightly to avoid z-fighting
        
        impactGroup.add(bulletHole);
        
        // Add some particle sparks
        const sparkCount = 5 + Math.floor(Math.random() * 5);
        const sparkGeometry = new THREE.BufferGeometry();
        const sparkMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.05,
            sizeAttenuation: true
        });
        
        const sparkPositions = [];
        const sparkVelocities = [];
        
        for (let i = 0; i < sparkCount; i++) {
            // Random position near impact
            const sparkPos = position.clone();
            sparkPositions.push(sparkPos.x, sparkPos.y, sparkPos.z);
            
            // Random velocity away from surface
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            velocity.add(normal.clone().multiplyScalar(0.1)); // Add normal direction
            sparkVelocities.push(velocity);
        }
        
        sparkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sparkPositions, 3));
        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        impactGroup.add(sparks);
        
        this.scene.add(impactGroup);
        
        // Animate and remove after a short time
        const startTime = performance.now();
        const duration = 1000; // 1 second
        
        const animateSparks = () => {
            const elapsed = performance.now() - startTime;
            const positions = sparkGeometry.attributes.position.array;
            
            // Update spark positions based on velocity
            for (let i = 0; i < sparkCount; i++) {
                const idx = i * 3;
                const velocity = sparkVelocities[i];
                
                positions[idx] += velocity.x;
                positions[idx + 1] += velocity.y;
                positions[idx + 2] += velocity.z;
                
                // Apply gravity
                velocity.y -= 0.001;
                
                // Slow down
                velocity.multiplyScalar(0.95);
            }
            
            sparkGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            const progress = elapsed / duration;
            sparkMaterial.opacity = 1 - progress;
            
            if (elapsed < duration) {
                requestAnimationFrame(animateSparks);
            } else {
                this.scene.remove(impactGroup);
            }
        };
        
        requestAnimationFrame(animateSparks);
        
        // Remove bullet hole after a longer time
        setTimeout(() => {
            if (impactGroup.parent) {
                this.scene.remove(impactGroup);
            }
        }, 10000); // 10 seconds
    }
    
    reload() {
        // Don't reload if we already have full ammo
        if (this.bulletCount === 8) return;
        
        console.log('Reloading...');
        
        // Play reload sound
        console.log('Playing reload sound, audio context state:', audioManager.audioContext ? audioManager.audioContext.state : 'no context');
        audioManager.play('reload', { volume: 0.6 });
        
        // Disable shooting during reload
        this.canShoot = false;
        
        // Reload animation would go here
        
        // After reload time, restore ammo
        setTimeout(() => {
            this.bulletCount = 8;
            document.getElementById('ammo').textContent = this.bulletCount + '/8';
            this.canShoot = true;
        }, 2000); // 2 seconds reload time
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls.isLocked) {
            this.updateMovement();
            this.updateWeaponPosition();
            this.updateViewBobbing();
        }
        
        // Clear the renderer
        this.renderer.clear();
        
        // Render main scene
        this.renderer.render(this.scene, this.camera);
        
        // Render weapon on top
        if (this.weaponScene && this.weaponCamera && this.controls.isLocked) {
            this.renderer.clearDepth();
            this.renderer.render(this.weaponScene, this.weaponCamera);
        }
    }
    
    updateViewBobbing() {
        if (!this.controls.isLocked) return;
        
        const now = performance.now();
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        
        // Update head bob timer only when moving
        if (isMoving) {
            this.headBobTimer += 0.016; // Increment based on approximate frame time
            
            // Calculate view bob based on movement
            const currentViewBobFreq = this.isSprinting ? this.viewBobFreq * 1.3 : this.viewBobFreq;
            
            // Only vertical bobbing - no rotation effects at all
            this.viewBobOffset = Math.abs(Math.sin(this.headBobTimer * currentViewBobFreq * 2)) * this.viewBobAmount;
        } else {
            // Gradually return to center when not moving
            this.viewBobOffset *= 0.9;
            
            // Reset when close to zero
            if (Math.abs(this.viewBobOffset) < 0.0001) {
                this.viewBobOffset = 0;
            }
        }
        
        // Add breathing effect
        const breathingY = Math.sin(now * 0.001 * this.breathingFreq) * this.breathingAmount;
        
        // Apply only vertical bobbing to camera position
        this.camera.position.y = this.playerHeight + (isMoving ? this.viewBobOffset : 0) + breathingY;
    }
}

// Start the game
// new Game();
*/
