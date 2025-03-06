// Enemy.js - Handles enemy AI, movement, and combat

class Enemy {
    constructor(position, scene, physicsWorld, assetLoader) {
        // Store references
        this.scene = scene;              // THREE.js scene
        this.physicsWorld = physicsWorld; // CANNON.js physics world
        this.assetLoader = assetLoader;   // Asset loader utility
        
        // Enemy stats
        this.health = 100;                // Current health
        this.maxHealth = 100;             // Maximum health
        this.moveSpeed = 3;               // Movement speed
        this.turnSpeed = 2;               // Turn speed (radians per second)
        this.attackDamage = 10;           // Damage per attack
        this.attackRange = 2;             // Range at which enemy can attack
        this.sightRange = 30;             // Range at which enemy can see player
        this.attackCooldown = 1;          // Time between attacks (seconds)
        
        // Enemy state
        this.isDead = false;              // Whether enemy is dead
        this.isAttacking = false;         // Whether enemy is attacking
        this.lastAttackTime = 0;          // Time since last attack
        this.currentPath = [];            // Current path to target
        this.targetPosition = null;       // Current target position
        
        // AI state
        this.state = 'idle';              // Current AI state (idle, patrol, chase, attack)
        this.stateTime = 0;               // Time in current state
        this.patrolPoints = [];           // Points to patrol between
        this.currentPatrolIndex = 0;      // Current patrol point index
        
        // Create mesh
        this.createMesh(position);
        
        // Create physics body
        this.createPhysicsBody(position);
        
        // Initialize patrol points
        this.initPatrolPoints();
    }
    
    /**
     * Create enemy mesh
     * @param {THREE.Vector3} position - Initial position
     */
    createMesh(position) {
        // Get enemy model
        const enemyModel = this.assetLoader.createModelInstance('enemy');
        
        if (!enemyModel) {
            // Fallback: create simple mesh if model not available
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geometry, material);
        } else {
            this.mesh = enemyModel;
        }
        
        // Set position
        this.mesh.position.copy(position);
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    /**
     * Create enemy physics body
     * @param {THREE.Vector3} position - Initial position
     */
    createPhysicsBody(position) {
        // Create physics body
        this.physicsBody = new CANNON.Body({
            mass: 70,  // 70 kg
            material: new CANNON.Material('enemyMaterial')
        });
        
        // Add shapes to body
        // Main body (cylinder)
        const radius = 0.5;  // Enemy radius
        const height = 2;    // Enemy height
        const cylinderShape = new CANNON.Cylinder(radius, radius, height, 8);
        this.physicsBody.addShape(cylinderShape);
        
        // Set initial position
        this.physicsBody.position.set(position.x, position.y, position.z);
        
        // Set damping (air resistance)
        this.physicsBody.linearDamping = 0.9;
        this.physicsBody.angularDamping = 0.9;
        
        // Add to physics world
        this.physicsWorld.addBody(this.physicsBody);
    }
    
    /**
     * Initialize patrol points around spawn position
     */
    initPatrolPoints() {
        const spawnPos = this.mesh.position.clone();
        const radius = 10 + Math.random() * 10; // Random patrol radius
        
        // Create 3-5 patrol points in a circle around spawn position
        const numPoints = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = spawnPos.x + Math.cos(angle) * radius;
            const z = spawnPos.z + Math.sin(angle) * radius;
            
            this.patrolPoints.push(new THREE.Vector3(x, spawnPos.y, z));
        }
        
        // Set initial target to first patrol point
        this.targetPosition = this.patrolPoints[0].clone();
    }
    
    /**
     * Update enemy state
     * @param {number} deltaTime - Time since last update in seconds
     * @param {Player} player - Reference to player object
     */
    update(deltaTime, player) {
        if (this.isDead) return;
        
        // Update state time
        this.stateTime += deltaTime;
        
        // Update attack cooldown
        this.lastAttackTime += deltaTime;
        
        // Check if player is in sight range
        const distanceToPlayer = this.mesh.position.distanceTo(player.camera.position);
        const canSeePlayer = this.checkLineOfSight(player);
        
        // Update AI state based on player distance and visibility
        this.updateAIState(distanceToPlayer, canSeePlayer, player);
        
        // Execute current state behavior
        switch (this.state) {
            case 'idle':
                this.executeIdleState(deltaTime);
                break;
            case 'patrol':
                this.executePatrolState(deltaTime);
                break;
            case 'chase':
                this.executeChaseState(deltaTime, player);
                break;
            case 'attack':
                this.executeAttackState(deltaTime, player);
                break;
        }
        
        // Update mesh position and rotation to match physics body
        this.mesh.position.copy(this.physicsBody.position);
        this.mesh.quaternion.copy(this.physicsBody.quaternion);
    }
    
    /**
     * Update AI state based on player distance and visibility
     * @param {number} distanceToPlayer - Distance to player
     * @param {boolean} canSeePlayer - Whether enemy can see player
     * @param {Player} player - Reference to player object
     */
    updateAIState(distanceToPlayer, canSeePlayer, player) {
        // State transitions
        switch (this.state) {
            case 'idle':
                // Transition to patrol after some time
                if (this.stateTime > 3) {
                    this.state = 'patrol';
                    this.stateTime = 0;
                }
                
                // Transition to chase if player is visible
                if (canSeePlayer && distanceToPlayer < this.sightRange) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
                
            case 'patrol':
                // Transition to idle occasionally
                if (this.stateTime > 10 && Math.random() < 0.1) {
                    this.state = 'idle';
                    this.stateTime = 0;
                }
                
                // Transition to chase if player is visible
                if (canSeePlayer && distanceToPlayer < this.sightRange) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
                
            case 'chase':
                // Transition to attack if in range
                if (distanceToPlayer < this.attackRange) {
                    this.state = 'attack';
                    this.stateTime = 0;
                }
                
                // Transition back to patrol if player is too far or not visible
                if (!canSeePlayer || distanceToPlayer > this.sightRange * 1.5) {
                    this.state = 'patrol';
                    this.stateTime = 0;
                }
                break;
                
            case 'attack':
                // Transition back to chase if player moves out of attack range
                if (distanceToPlayer > this.attackRange) {
                    this.state = 'chase';
                    this.stateTime = 0;
                }
                break;
        }
    }
    
    /**
     * Execute idle state behavior
     * @param {number} deltaTime - Time since last update in seconds
     */
    executeIdleState(deltaTime) {
        // In idle state, enemy stands still
        this.physicsBody.velocity.set(0, 0, 0);
    }
    
    /**
     * Execute patrol state behavior
     * @param {number} deltaTime - Time since last update in seconds
     */
    executePatrolState(deltaTime) {
        // Check if we've reached the current patrol point
        const distanceToTarget = this.mesh.position.distanceTo(this.targetPosition);
        
        if (distanceToTarget < 1) {
            // Move to next patrol point
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.targetPosition = this.patrolPoints[this.currentPatrolIndex].clone();
        }
        
        // Move towards current patrol point
        this.moveTowards(this.targetPosition, this.moveSpeed * 0.7, deltaTime);
    }
    
    /**
     * Execute chase state behavior
     * @param {number} deltaTime - Time since last update in seconds
     * @param {Player} player - Reference to player object
     */
    executeChaseState(deltaTime, player) {
        // Set target to player position
        this.targetPosition = player.camera.position.clone();
        
        // Move towards player
        this.moveTowards(this.targetPosition, this.moveSpeed, deltaTime);
    }
    
    /**
     * Execute attack state behavior
     * @param {number} deltaTime - Time since last update in seconds
     * @param {Player} player - Reference to player object
     */
    executeAttackState(deltaTime, player) {
        // Face player
        this.faceTarget(player.camera.position, deltaTime);
        
        // Attack if cooldown has expired
        if (this.lastAttackTime >= this.attackCooldown) {
            this.attack(player);
            this.lastAttackTime = 0;
        }
    }
    
    /**
     * Move towards a target position
     * @param {THREE.Vector3} targetPosition - Position to move towards
     * @param {number} speed - Movement speed
     * @param {number} deltaTime - Time since last update in seconds
     */
    moveTowards(targetPosition, speed, deltaTime) {
        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.mesh.position)
            .normalize();
        
        // Ignore Y component for horizontal movement
        direction.y = 0;
        
        // Face target
        this.faceTarget(targetPosition, deltaTime);
        
        // Set velocity
        this.physicsBody.velocity.x = direction.x * speed;
        this.physicsBody.velocity.z = direction.z * speed;
    }
    
    /**
     * Face towards a target position
     * @param {THREE.Vector3} targetPosition - Position to face towards
     * @param {number} deltaTime - Time since last update in seconds
     */
    faceTarget(targetPosition, deltaTime) {
        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.mesh.position)
            .normalize();
        
        // Calculate target rotation
        const targetRotation = Math.atan2(direction.x, direction.z);
        
        // Get current rotation
        const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion);
        let currentRotation = euler.y;
        
        // Calculate shortest rotation path
        let rotationDiff = targetRotation - currentRotation;
        if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        // Apply rotation with smooth turning
        const step = this.turnSpeed * deltaTime;
        const newRotation = currentRotation + Math.sign(rotationDiff) * Math.min(Math.abs(rotationDiff), step);
        
        // Apply rotation to physics body
        const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, newRotation, 0));
        this.physicsBody.quaternion.copy(quaternion);
    }
    
    /**
     * Attack the player
     * @param {Player} player - Reference to player object
     */
    attack(player) {
        // Calculate direction to player
        const direction = new THREE.Vector3()
            .subVectors(player.camera.position, this.mesh.position)
            .normalize();
        
        // Apply damage to player
        player.takeDamage(this.attackDamage, direction);
        
        // TODO: Play attack animation/sound
    }
    
    /**
     * Check if enemy has line of sight to player
     * @param {Player} player - Reference to player object
     * @returns {boolean} Whether enemy can see player
     */
    checkLineOfSight(player) {
        // Calculate direction to player
        const start = this.mesh.position.clone();
        start.y += 1; // Eye level
        
        const end = player.camera.position.clone();
        
        const direction = new THREE.Vector3()
            .subVectors(end, start)
            .normalize();
        
        // Create raycaster
        const raycaster = new THREE.Raycaster(start, direction, 0, this.sightRange);
        
        // Get all meshes to test
        const meshes = this.scene.children.filter(child => 
            child.isMesh && child !== this.mesh
        );
        
        // Perform raycast
        const intersects = raycaster.intersectObjects(meshes, true);
        
        // Check if player is the first thing hit
        if (intersects.length === 0) {
            return false;
        }
        
        // Calculate distance to player
        const distanceToPlayer = start.distanceTo(end);
        
        // Check if any object is between enemy and player
        return intersects[0].distance >= distanceToPlayer;
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
        } else {
            // If not dead, immediately chase attacker
            this.state = 'chase';
            this.stateTime = 0;
        }
        
        // TODO: Play hit animation/sound
    }
    
    /**
     * Handle enemy death
     */
    die() {
        this.isDead = true;
        
        // Remove physics body from world
        this.physicsWorld.remove(this.physicsBody);
        
        // TODO: Play death animation/sound
        
        // TODO: Drop items/rewards
    }
} 