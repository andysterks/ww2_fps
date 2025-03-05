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
        
        // Add camera to scene
        this.scene.add(this.controls.getObject());
        
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
        this.isAimingDownSights = false;
        
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
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50, // Green
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        this.scene.add(ground);
        
        // Create a street
        const streetGeometry = new THREE.PlaneGeometry(10, 1000);
        const streetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444, // Dark gray
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const street = new THREE.Mesh(streetGeometry, streetMaterial);
        street.rotation.x = -Math.PI / 2;
        street.position.y = 0.01; // Slightly above ground
        this.scene.add(street);
        
        // Add buildings with standard materials
        this.addBuilding(0xFF0000, -15, 0, -20); // Red building
        this.addBuilding(0x0000FF, 15, 0, -20);  // Blue building
        this.addBuilding(0xFFFF00, 0, 0, -40);   // Yellow building
        
        // Enhanced lighting setup
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light for sun-like lighting
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        directionalLight.position.set(100, 100, 0);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Enable shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        
        // Make objects cast and receive shadows
        ground.receiveShadow = true;
        street.receiveShadow = true;
    }
    
    addBuilding(color, x, y, z) {
        const buildingGeometry = new THREE.BoxGeometry(10, 10, 10);
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, y + 5, z);
        building.castShadow = true;
        building.receiveShadow = true;
        
        this.scene.add(building);
    }
    
    createWeapon() {
        // Create weapon group
        const weaponGroup = new THREE.Group();
        
        // Create materials with proper depth settings
        const metalMaterial = new THREE.MeshPhongMaterial({
            color: 0x2c2c2c,
            specular: 0x111111,
            shininess: 30,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        
        const woodMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a2a0a,
            specular: 0x222222,
            shininess: 10,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        
        const blackMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            specular: 0x222222,
            shininess: 30,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        
        // Create rifle body - make it visible again
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.1, 0.9),
            metalMaterial.clone()
        );
        rifleBody.position.set(0, -0.02, 0);
        rifleBody.castShadow = true;
        rifleBody.receiveShadow = true;
        rifleBody.renderOrder = 1;
        
        // Create rifle stock - position it properly
        const rifleStock = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.15, 0.5),
            woodMaterial.clone()
        );
        rifleStock.position.set(0, -0.03, 0.4);
        rifleStock.castShadow = true;
        rifleStock.receiveShadow = true;
        rifleStock.renderOrder = 1;
        
        // Create iron sights group
        const ironSightsGroup = new THREE.Group();
        
        // Front sight post
        const frontSightPost = new THREE.Mesh(
            new THREE.BoxGeometry(0.003, 0.03, 0.003),
            blackMaterial.clone()
        );
        frontSightPost.position.set(0, 0.09, -0.4);
        frontSightPost.renderOrder = 3;
        frontSightPost.castShadow = true;
        
        // Front sight protective wings
        const frontSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.02),
            metalMaterial.clone()
        );
        frontSightBase.position.set(0, 0.075, -0.4);
        frontSightBase.renderOrder = 2;
        frontSightBase.castShadow = true;
        
        // Left wing
        const leftWing = new THREE.Mesh(
            new THREE.BoxGeometry(0.004, 0.03, 0.02),
            metalMaterial.clone()
        );
        leftWing.position.set(-0.02, 0.09, -0.4);
        leftWing.renderOrder = 2;
        leftWing.castShadow = true;
        
        // Right wing
        const rightWing = new THREE.Mesh(
            new THREE.BoxGeometry(0.004, 0.03, 0.02),
            metalMaterial.clone()
        );
        rightWing.position.set(0.02, 0.09, -0.4);
        rightWing.renderOrder = 2;
        rightWing.castShadow = true;
        
        // Create a proper rear sight assembly
        // Main rear sight housing - make it visible
        const rearSightBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16),
            metalMaterial.clone()
        );
        rearSightBase.rotation.x = Math.PI / 2;
        rearSightBase.position.set(0, 0.09, 0.1);
        rearSightBase.renderOrder = 2;
        rearSightBase.castShadow = true;
        
        // Create a true hollow aperture using a ring geometry
        // We'll create a custom ring geometry to ensure it's truly hollow
        const innerRadius = 0.006;
        const outerRadius = 0.01;
        const thetaSegments = 32;
        
        // Create a hole in the rear sight
        const holeGeometry = new THREE.CircleGeometry(innerRadius, thetaSegments);
        const holeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            side: THREE.DoubleSide
        });
        
        const sightHole = new THREE.Mesh(holeGeometry, holeMaterial);
        sightHole.position.set(0, 0.09, 0.1);
        sightHole.rotation.x = Math.PI / 2;
        sightHole.renderOrder = 1001;
        
        // Create a second hole on the other side
        const backHole = sightHole.clone();
        backHole.position.set(0, 0.09, 0.12);
        backHole.renderOrder = 1001;
        
        // Create the aperture ring
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
        const apertureMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1.0,
            depthWrite: true,
            depthTest: true
        });
        
        const rearSightAperture = new THREE.Mesh(ringGeometry, apertureMaterial);
        rearSightAperture.rotation.x = Math.PI / 2;
        rearSightAperture.position.set(0, 0.09, 0.1);
        rearSightAperture.renderOrder = 1000;
        
        // Add adjustment knobs on sides
        const leftKnob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8),
            metalMaterial.clone()
        );
        leftKnob.rotation.z = Math.PI / 2;
        leftKnob.position.set(-0.03, 0.09, 0.1);
        leftKnob.renderOrder = 2;
        leftKnob.castShadow = true;
        
        const rightKnob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8),
            metalMaterial.clone()
        );
        rightKnob.rotation.z = Math.PI / 2;
        rightKnob.position.set(0.03, 0.09, 0.1);
        rightKnob.renderOrder = 2;
        rightKnob.castShadow = true;
        
        // Create a sight line - a transparent cylinder that creates a "hole" through the weapon
        const sightLineMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0, // Completely invisible
            depthWrite: false, // Don't write to depth buffer
            depthTest: false, // Don't test against depth buffer
            side: THREE.DoubleSide
        });
        
        const sightLine = new THREE.Mesh(
            new THREE.CylinderGeometry(innerRadius, innerRadius, 1.5, 16),
            sightLineMaterial
        );
        sightLine.rotation.x = Math.PI / 2;
        sightLine.position.set(0, 0.09, -0.15); // Position it to go through the weapon
        sightLine.renderOrder = 2000; // Render after everything else
        
        // Add sights to group
        ironSightsGroup.add(frontSightPost);
        ironSightsGroup.add(frontSightBase);
        ironSightsGroup.add(leftWing);
        ironSightsGroup.add(rightWing);
        ironSightsGroup.add(rearSightBase);
        ironSightsGroup.add(rearSightAperture);
        ironSightsGroup.add(sightHole);
        ironSightsGroup.add(backHole);
        ironSightsGroup.add(leftKnob);
        ironSightsGroup.add(rightKnob);
        ironSightsGroup.add(sightLine); // Add the sight line to the group
        
        // Add all parts to weapon group
        weaponGroup.add(rifleBody);
        weaponGroup.add(rifleStock);
        weaponGroup.add(ironSightsGroup);
        
        // Store reference to iron sights for toggling visibility
        this.ironSights = ironSightsGroup;
        
        // Define positions with adjusted z-depth
        this.weaponDefaultPosition = new THREE.Vector3(0.3, -0.3, -0.6);
        this.weaponDefaultRotation = new THREE.Vector3(0, Math.PI / 12, 0);
        
        // Adjusted aim position for proper sight picture
        this.weaponAimPosition = new THREE.Vector3(0, -0.045, -0.3);
        this.weaponAimRotation = new THREE.Vector3(0, 0, 0);
        
        // Position weapon in hip-fire position
        weaponGroup.position.copy(this.weaponDefaultPosition);
        weaponGroup.rotation.setFromVector3(this.weaponDefaultRotation);
        
        // Add weapon to camera
        this.camera.add(weaponGroup);
        
        // Store weapon reference
        this.weapon = weaponGroup;
        
        // Add aiming properties
        this.aimTransitionSpeed = 8.0;
        this.defaultFOV = 75;
        this.aimFOV = 65; // Wider FOV to better see through sights
        this.isAimingDownSights = false;
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
                <div>Is Aiming: ${this.isAimingDownSights}</div>
                <div>Position: ${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)}</div>
                <div>Movement: F:${this.moveForward} B:${this.moveBackward} L:${this.moveLeft} R:${this.moveRight}</div>
            `;
        }
    }
    
    shoot() {
        // Debug the current state
        console.log(`Shooting - Bullets: ${this.bulletCount}, CanShoot: ${this.canShoot}, IsReloading: ${this.isReloading}, IsAiming: ${this.isAimingDownSights}`);
        
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
        
        // Calculate spread based on aiming
        const spread = this.isAimingDownSights ? 0.01 : 0.05; // Less spread when aiming
        
        // Add spread to raycaster
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        
        // Update raycaster direction with spread
        const direction = new THREE.Vector3(spreadX, spreadY, -1);
        direction.unproject(this.camera);
        direction.sub(this.camera.position).normalize();
        
        // Create raycaster with spread
        const raycaster = new THREE.Raycaster(this.camera.position, direction);
        
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
        this.isAimingDownSights = !this.isAimingDownSights;
        
        // Make rifle body and stock transparent when aiming
        if (this.weapon) {
            // First two children are rifle body and stock
            const rifleBody = this.weapon.children[0];
            const rifleStock = this.weapon.children[1];
            
            if (this.isAimingDownSights) {
                // Make body and stock transparent when aiming
                rifleBody.material.opacity = 0.0;
                rifleBody.material.transparent = true;
                rifleStock.material.opacity = 0.0;
                rifleStock.material.transparent = true;
            } else {
                // Make body and stock opaque when not aiming
                rifleBody.material.opacity = 1.0;
                rifleBody.material.transparent = false;
                rifleStock.material.opacity = 1.0;
                rifleStock.material.transparent = false;
            }
        }
        
        const fovTransition = () => {
            const currentFOV = this.camera.fov;
            const targetFOV = this.isAimingDownSights ? this.aimFOV : this.defaultFOV;
            
            // Smoothly transition FOV
            if (Math.abs(currentFOV - targetFOV) > 0.1) {
                this.camera.fov += (targetFOV - currentFOV) * 0.1;
                this.camera.updateProjectionMatrix();
                requestAnimationFrame(fovTransition);
            } else {
                this.camera.fov = targetFOV;
                this.camera.updateProjectionMatrix();
            }
        };
        
        fovTransition();
        
        // Update debug info
        if (this.debugMode) {
            this.updateDebugInfo();
        }
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
            const recoilAmount = this.isAimingDownSights ? 0.02 : 0.05;
            
            // Apply recoil to weapon
            this.weapon.position.z += recoilAmount;
            
            // Apply camera recoil
            const cameraRecoil = this.isAimingDownSights ? 0.2 : 0.5;
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
        
        const targetPosition = this.isAimingDownSights ? this.weaponAimPosition : this.weaponDefaultPosition;
        const targetRotation = this.isAimingDownSights ? this.weaponAimRotation : this.weaponDefaultRotation;
        
        // Calculate movement amount based on velocity
        const swayAmount = this.isAimingDownSights ? 0.002 : 0.005;
        const bobAmount = this.isAimingDownSights ? 0.002 : 0.005;
        
        // Add subtle weapon sway
        const time = performance.now() * 0.001;
        const swayX = Math.sin(time * 1.5) * swayAmount;
        const swayY = Math.cos(time * 2) * swayAmount;
        
        // Add movement-based bob
        const speedBob = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        const bobX = Math.sin(time * 10) * speedBob * bobAmount;
        const bobY = Math.abs(Math.cos(time * 5)) * speedBob * bobAmount;
        
        // Smoothly interpolate position
        this.weapon.position.lerp(
            new THREE.Vector3(
                targetPosition.x + swayX + bobX,
                targetPosition.y + swayY + bobY,
                targetPosition.z
            ),
            this.aimTransitionSpeed * 0.016
        );
        
        // Smoothly interpolate rotation
        this.weapon.rotation.x += (targetRotation.x - this.weapon.rotation.x) * this.aimTransitionSpeed * 0.016;
        this.weapon.rotation.y += (targetRotation.y - this.weapon.rotation.y) * this.aimTransitionSpeed * 0.016;
        this.weapon.rotation.z += (targetRotation.z - this.weapon.rotation.z) * this.aimTransitionSpeed * 0.016;
    }
}
