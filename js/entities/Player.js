// Player.js - Handles player movement, physics, and weapons

class Player {
    constructor(camera, physicsWorld, inputHandler, assetLoader) {
        // Store references
        this.camera = camera;              // THREE.js camera
        this.physicsWorld = physicsWorld;  // CANNON.js physics world
        this.inputHandler = inputHandler;  // Input handler utility
        this.assetLoader = assetLoader;    // Asset loader utility
        
        // Player stats
        this.health = 100;                 // Current health
        this.maxHealth = 100;              // Maximum health
        this.moveSpeed = 5;                // Base movement speed
        this.sprintMultiplier = 1.5;       // Sprint speed multiplier
        this.jumpForce = 7;                // Jump force
        
        // Player state
        this.isOnGround = false;           // Whether player is on ground
        this.canJump = false;              // Whether player can jump
        this.isSprinting = false;          // Whether player is sprinting
        this.isCrouching = false;          // Whether player is crouching
        this.isReloading = false;          // Whether player is reloading
        
        // Camera settings
        this.cameraHeight = 1.7;           // Height of camera (player eye level)
        this.crouchCameraHeight = 1.0;     // Height of camera when crouching
        this.cameraPitch = 0;              // Camera pitch (up/down rotation)
        this.cameraYaw = 0;                // Camera yaw (left/right rotation)
        this.maxPitch = Math.PI / 2 - 0.1; // Maximum camera pitch (radians)
        
        // Physics body
        this.createPhysicsBody();
        
        // Weapons
        this.weapons = [];                 // Array of available weapons
        this.currentWeaponIndex = 0;       // Index of current weapon
        this.currentWeapon = null;         // Current weapon reference
        
        // Initialize weapons
        this.initWeapons();
        
        // Footstep sound timer
        this.footstepTimer = 0;
        this.footstepInterval = 0.5;       // Time between footstep sounds
    }
    
    /**
     * Create the player's physics body
     */
    createPhysicsBody() {
        // Create capsule shape for player collision
        const radius = 0.5;  // Player radius
        const height = 1.7;  // Player height
        
        // Create physics body
        this.physicsBody = new CANNON.Body({
            mass: 70,  // 70 kg
            material: new CANNON.Material('playerMaterial')
        });
        
        // Add shapes to body
        // Main body (cylinder)
        const cylinderShape = new CANNON.Cylinder(radius, radius, height, 8);
        this.physicsBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0));
        
        // Set initial position
        this.physicsBody.position.set(0, height / 2 + 1, 0);
        
        // Set damping (air resistance)
        this.physicsBody.linearDamping = 0.9;
        this.physicsBody.angularDamping = 0.9;
        
        // Disable rotation
        this.physicsBody.fixedRotation = true;
        this.physicsBody.updateMassProperties();
        
        // Set up collision callback
        this.physicsBody.addEventListener('collide', this.handleCollision.bind(this));
    }
    
    /**
     * Initialize player weapons
     */
    initWeapons() {
        // Create weapons
        const rifle = new Weapon({
            name: 'M1 Garand',
            type: 'rifle',
            damage: 25,
            fireRate: 0.8,  // Shots per second
            reloadTime: 2.5,
            magazineSize: 8,
            reserveAmmo: 40,
            spread: 0.02,
            model: this.assetLoader.getModel('rifle'),
            shootSound: this.assetLoader.getSound('gunshot'),
            reloadSound: this.assetLoader.getSound('reload')
        });
        
        // Add weapons to array
        this.weapons.push(rifle);
        
        // Set current weapon
        this.currentWeapon = this.weapons[this.currentWeaponIndex];
    }
    
    /**
     * Update player state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Update weapon
        if (this.currentWeapon) {
            this.currentWeapon.update(deltaTime);
            
            // Handle shooting
            if (this.inputHandler.isShooting() && !this.isReloading) {
                this.currentWeapon.shoot(this.camera.position, this.camera.getWorldDirection(new THREE.Vector3()));
            }
            
            // Handle aiming
            this.currentWeapon.isAiming = this.inputHandler.isAiming();
            
            // Handle reloading
            if (this.inputHandler.keys.reload && !this.isReloading) {
                this.isReloading = true;
                this.currentWeapon.reload(() => {
                    this.isReloading = false;
                });
            }
        }
        
        // Update footstep sounds
        this.updateFootsteps(deltaTime);
    }
    
    /**
     * Update player movement based on input
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateMovement(deltaTime) {
        // Get movement direction from input
        const direction = this.inputHandler.getMovementDirection();
        
        // Check if player is sprinting
        this.isSprinting = this.inputHandler.keys.sprint && direction.z < 0 && !this.isCrouching;
        
        // Check if player is crouching
        const wasCrouching = this.isCrouching;
        this.isCrouching = this.inputHandler.keys.crouch;
        
        // Adjust physics body height when crouching/standing
        if (wasCrouching !== this.isCrouching) {
            // TODO: Adjust collision shape for crouching
        }
        
        // Calculate movement speed
        let speed = this.moveSpeed;
        if (this.isSprinting) speed *= this.sprintMultiplier;
        if (this.isCrouching) speed *= 0.5;
        
        // Convert movement direction to world space
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();
        
        // Calculate velocity
        const velocity = new THREE.Vector3();
        
        if (direction.z !== 0) {
            velocity.add(forward.multiplyScalar(direction.z * speed));
        }
        
        if (direction.x !== 0) {
            velocity.add(right.multiplyScalar(direction.x * speed));
        }
        
        // Apply velocity to physics body
        this.physicsBody.velocity.x = velocity.x;
        this.physicsBody.velocity.z = velocity.z;
        
        // Handle jumping
        if (this.inputHandler.keys.jump && this.canJump) {
            this.physicsBody.velocity.y = this.jumpForce;
            this.canJump = false;
        }
        
        // Check if player is on ground
        this.checkGrounded();
        
        // Update camera position to match physics body
        this.camera.position.x = this.physicsBody.position.x;
        this.camera.position.z = this.physicsBody.position.z;
        
        // Set camera height based on crouching state
        const targetHeight = this.isCrouching ? this.crouchCameraHeight : this.cameraHeight;
        this.camera.position.y = this.physicsBody.position.y + targetHeight - this.physicsBody.shapes[0].height / 2;
    }
    
    /**
     * Update camera rotation based on input
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateCamera(deltaTime) {
        // Get camera rotation from input
        const rotation = this.inputHandler.getCameraRotation();
        
        // Update camera pitch (up/down)
        this.cameraPitch -= rotation.x * 0.002;
        this.cameraPitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.cameraPitch));
        
        // Update camera yaw (left/right)
        this.cameraYaw -= rotation.y * 0.002;
        
        // Apply rotation to camera
        this.camera.quaternion.setFromEuler(new THREE.Euler(
            this.cameraPitch,
            this.cameraYaw,
            0,
            'YXZ'
        ));
    }
    
    /**
     * Check if player is on ground
     */
    checkGrounded() {
        // Perform raycast downward from player position
        const start = this.physicsBody.position.clone();
        const end = start.clone();
        end.y -= 1.1; // Slightly more than player height / 2 + small tolerance
        
        // Create ray
        const ray = new CANNON.Ray(start, end);
        ray.mode = CANNON.Ray.CLOSEST;
        
        // Perform raycast
        const result = new CANNON.RaycastResult();
        ray.intersectWorld(this.physicsWorld, { result });
        
        // Check if ray hit something
        if (result.hasHit) {
            this.isOnGround = true;
            this.canJump = true;
        } else {
            this.isOnGround = false;
        }
    }
    
    /**
     * Handle collision events
     * @param {Object} event - Collision event
     */
    handleCollision(event) {
        // Check if collision is with ground
        const contact = event.contact;
        
        // If contact normal is pointing up, we're on ground
        if (contact.ni.y > 0.5) {
            this.isOnGround = true;
            this.canJump = true;
        }
    }
    
    /**
     * Update footstep sounds
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateFootsteps(deltaTime) {
        // Only play footstep sounds when moving on ground
        const isMoving = this.physicsBody.velocity.x !== 0 || this.physicsBody.velocity.z !== 0;
        
        if (isMoving && this.isOnGround) {
            this.footstepTimer += deltaTime;
            
            // Adjust footstep interval based on movement speed
            let interval = this.footstepInterval;
            if (this.isSprinting) interval *= 0.7;
            if (this.isCrouching) interval *= 1.5;
            
            if (this.footstepTimer >= interval) {
                this.footstepTimer = 0;
                // TODO: Play footstep sound
                // this.playFootstepSound();
            }
        }
    }
    
    /**
     * Take damage
     * @param {number} amount - Amount of damage to take
     * @param {THREE.Vector3} direction - Direction of damage source
     */
    takeDamage(amount, direction) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        // TODO: Play hit sound
        // TODO: Show damage indicator in direction of damage
    }
    
    /**
     * Handle player death
     */
    die() {
        // TODO: Play death animation/sound
        console.log('Player died');
    }
    
    /**
     * Reset player state
     */
    reset() {
        // Reset health
        this.health = this.maxHealth;
        
        // Reset position
        this.physicsBody.position.set(0, this.physicsBody.shapes[0].height / 2 + 1, 0);
        this.physicsBody.velocity.set(0, 0, 0);
        
        // Reset weapons
        for (const weapon of this.weapons) {
            weapon.reset();
        }
        
        // Reset state flags
        this.isOnGround = false;
        this.canJump = false;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isReloading = false;
    }
} 