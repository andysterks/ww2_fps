// Weapon.js - Handles weapon mechanics, shooting, and effects

class Weapon {
    constructor(config) {
        // Weapon configuration
        this.name = config.name || 'Unknown Weapon';  // Weapon name
        this.type = config.type || 'rifle';           // Weapon type (rifle, pistol, etc.)
        this.damage = config.damage || 20;            // Base damage per shot
        this.fireRate = config.fireRate || 1;         // Shots per second
        this.reloadTime = config.reloadTime || 2;     // Reload time in seconds
        this.magazineSize = config.magazineSize || 30; // Magazine capacity
        this.reserveAmmo = config.reserveAmmo || 90;  // Reserve ammunition
        this.spread = config.spread || 0.05;          // Bullet spread (accuracy)
        this.range = config.range || 100;             // Maximum effective range
        this.recoil = config.recoil || 0.1;           // Recoil amount
        
        // Weapon state
        this.currentAmmo = this.magazineSize;         // Current ammo in magazine
        this.isReloading = false;                     // Whether weapon is reloading
        this.lastShotTime = 0;                        // Time since last shot
        this.isAiming = false;                        // Whether player is aiming
        
        // Weapon model
        this.model = config.model || null;            // THREE.js model
        this.modelInstance = null;                    // Instance of model in scene
        
        // Weapon sounds
        this.shootSound = config.shootSound || null;  // Shooting sound
        this.reloadSound = config.reloadSound || null; // Reload sound
        this.emptySound = config.emptySound || null;  // Empty magazine sound
        
        // Weapon effects
        this.muzzleFlash = null;                      // Muzzle flash effect
        this.bulletTrail = null;                      // Bullet trail effect
        this.impactEffects = {                        // Impact effects for different materials
            default: null,
            metal: null,
            wood: null,
            concrete: null,
            dirt: null
        };
        
        // Create weapon model if provided
        if (this.model) {
            this.createModel();
        }
        
        // Create weapon effects
        this.createEffects();
    }
    
    /**
     * Create weapon model
     */
    createModel() {
        if (!this.model) return;
        
        // Clone the model
        this.modelInstance = this.model.scene.clone();
        
        // Apply optimizations
        this.modelInstance.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
                
                // Simplify materials for performance
                if (child.material) {
                    child.material.flatShading = true;
                    child.material.needsUpdate = true;
                }
            }
        });
        
        // Position and scale model
        // These values would need to be adjusted based on the specific model
        this.modelInstance.position.set(0.3, -0.3, -0.5);
        this.modelInstance.rotation.set(0, Math.PI, 0);
        this.modelInstance.scale.set(0.1, 0.1, 0.1);
        
        // Hide model initially (will be added to camera when equipped)
        this.modelInstance.visible = false;
    }
    
    /**
     * Create weapon effects
     */
    createEffects() {
        // Create muzzle flash
        const muzzleGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const muzzleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.muzzleFlash = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
        this.muzzleFlash.position.set(0, 0, -1);
        this.muzzleFlash.visible = false;
        
        // Bullet trail will be created dynamically when shooting
    }
    
    /**
     * Update weapon state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update last shot time
        this.lastShotTime += deltaTime;
        
        // Hide muzzle flash after a short time
        if (this.muzzleFlash && this.muzzleFlash.visible) {
            if (this.lastShotTime > 0.05) {
                this.muzzleFlash.visible = false;
            }
        }
    }
    
    /**
     * Shoot the weapon
     * @param {THREE.Vector3} position - Position to shoot from
     * @param {THREE.Vector3} direction - Direction to shoot in
     * @returns {boolean} Whether the shot was fired
     */
    shoot(position, direction) {
        // Check if can shoot
        if (!this.canShoot()) {
            // Play empty sound if out of ammo
            if (this.currentAmmo <= 0 && this.emptySound) {
                // TODO: Play empty sound
            }
            return false;
        }
        
        // Calculate time between shots based on fire rate
        const timeBetweenShots = 1 / this.fireRate;
        
        // Check if enough time has passed since last shot
        if (this.lastShotTime < timeBetweenShots) {
            return false;
        }
        
        // Reset last shot time
        this.lastShotTime = 0;
        
        // Decrease ammo
        this.currentAmmo--;
        
        // Apply spread to direction
        const spreadAmount = this.isAiming ? this.spread * 0.3 : this.spread;
        const spreadX = (Math.random() - 0.5) * 2 * spreadAmount;
        const spreadY = (Math.random() - 0.5) * 2 * spreadAmount;
        
        const spreadDirection = new THREE.Vector3(
            direction.x + spreadX,
            direction.y + spreadY,
            direction.z
        ).normalize();
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.visible = true;
            
            // Position muzzle flash at end of weapon
            // This would need to be adjusted based on the specific weapon model
            const muzzlePosition = new THREE.Vector3(0, 0, -1);
            if (this.modelInstance) {
                this.modelInstance.localToWorld(muzzlePosition);
            } else {
                muzzlePosition.copy(position).add(direction.clone().multiplyScalar(1));
            }
            
            this.muzzleFlash.position.copy(muzzlePosition);
            this.muzzleFlash.lookAt(muzzlePosition.clone().add(direction));
        }
        
        // Play shoot sound
        if (this.shootSound) {
            // TODO: Play shoot sound
        }
        
        // Create bullet trail effect
        this.createBulletTrail(position, spreadDirection);
        
        // Perform raycast to check for hits
        this.performRaycast(position, spreadDirection);
        
        return true;
    }
    
    /**
     * Check if weapon can shoot
     * @returns {boolean} Whether weapon can shoot
     */
    canShoot() {
        return this.currentAmmo > 0 && !this.isReloading;
    }
    
    /**
     * Reload the weapon
     * @param {Function} callback - Function to call when reload is complete
     */
    reload(callback) {
        // Check if reload is needed
        if (this.currentAmmo === this.magazineSize || this.reserveAmmo <= 0 || this.isReloading) {
            if (callback) callback();
            return;
        }
        
        // Start reloading
        this.isReloading = true;
        
        // Play reload sound
        if (this.reloadSound) {
            // TODO: Play reload sound
        }
        
        // Calculate ammo to reload
        const ammoNeeded = this.magazineSize - this.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);
        
        // Set timeout for reload time
        setTimeout(() => {
            // Add ammo to magazine
            this.currentAmmo += ammoToReload;
            this.reserveAmmo -= ammoToReload;
            
            // End reloading
            this.isReloading = false;
            
            // Call callback
            if (callback) callback();
        }, this.reloadTime * 1000);
    }
    
    /**
     * Create bullet trail effect
     * @param {THREE.Vector3} start - Start position of trail
     * @param {THREE.Vector3} direction - Direction of trail
     */
    createBulletTrail(start, direction) {
        // Create line geometry for bullet trail
        const end = start.clone().add(direction.clone().multiplyScalar(this.range));
        
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, material);
        
        // Add to scene
        if (this.modelInstance && this.modelInstance.parent) {
            this.modelInstance.parent.add(line);
            
            // Remove after short time
            setTimeout(() => {
                this.modelInstance.parent.remove(line);
                geometry.dispose();
                material.dispose();
            }, 100);
        }
    }
    
    /**
     * Perform raycast to check for hits
     * @param {THREE.Vector3} start - Start position of raycast
     * @param {THREE.Vector3} direction - Direction of raycast
     */
    performRaycast(start, direction) {
        // Create raycaster
        const raycaster = new THREE.Raycaster(start, direction, 0, this.range);
        
        // Get all meshes to test
        // This would need to be adjusted based on the specific scene structure
        const scene = this.modelInstance ? this.modelInstance.parent : null;
        if (!scene) return;
        
        const meshes = scene.children.filter(child => 
            child.isMesh && child !== this.modelInstance
        );
        
        // Perform raycast
        const intersects = raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            
            // Create impact effect
            this.createImpactEffect(hit.point, hit.face.normal);
            
            // Check if hit object has takeDamage method
            const hitObject = this.findParentWithMethod(hit.object, 'takeDamage');
            if (hitObject && typeof hitObject.takeDamage === 'function') {
                // Calculate damage based on distance
                const distance = hit.distance;
                const damageMultiplier = Math.max(0.5, 1 - distance / this.range);
                const damage = this.damage * damageMultiplier;
                
                // Apply damage
                hitObject.takeDamage(damage, direction.clone().negate());
            }
        }
    }
    
    /**
     * Find parent object with specified method
     * @param {THREE.Object3D} object - Object to start search from
     * @param {string} methodName - Name of method to find
     * @returns {Object|null} Object with method or null if not found
     */
    findParentWithMethod(object, methodName) {
        let current = object;
        
        while (current) {
            if (current.userData && typeof current.userData[methodName] === 'function') {
                return current.userData;
            }
            
            current = current.parent;
        }
        
        return null;
    }
    
    /**
     * Create impact effect at hit point
     * @param {THREE.Vector3} position - Position of impact
     * @param {THREE.Vector3} normal - Surface normal at impact point
     */
    createImpactEffect(position, normal) {
        // Create impact decal
        const decalGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const decalMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const decal = new THREE.Mesh(decalGeometry, decalMaterial);
        
        // Position and orient decal
        decal.position.copy(position);
        decal.lookAt(position.clone().add(normal));
        
        // Add small random rotation
        decal.rotation.z = Math.random() * Math.PI * 2;
        
        // Move slightly above surface to prevent z-fighting
        decal.position.add(normal.clone().multiplyScalar(0.01));
        
        // Add to scene
        if (this.modelInstance && this.modelInstance.parent) {
            this.modelInstance.parent.add(decal);
            
            // Remove after some time
            setTimeout(() => {
                this.modelInstance.parent.remove(decal);
                decalGeometry.dispose();
                decalMaterial.dispose();
            }, 5000);
        }
    }
    
    /**
     * Attach weapon model to camera
     * @param {THREE.Camera} camera - Camera to attach to
     */
    attachToCamera(camera) {
        if (this.modelInstance) {
            camera.add(this.modelInstance);
            this.modelInstance.visible = true;
            
            // Add muzzle flash to camera
            if (this.muzzleFlash) {
                camera.add(this.muzzleFlash);
            }
        }
    }
    
    /**
     * Detach weapon model from camera
     * @param {THREE.Camera} camera - Camera to detach from
     */
    detachFromCamera(camera) {
        if (this.modelInstance) {
            camera.remove(this.modelInstance);
            this.modelInstance.visible = false;
            
            // Remove muzzle flash from camera
            if (this.muzzleFlash) {
                camera.remove(this.muzzleFlash);
            }
        }
    }
    
    /**
     * Reset weapon state
     */
    reset() {
        this.currentAmmo = this.magazineSize;
        this.isReloading = false;
        this.lastShotTime = 0;
        this.isAiming = false;
    }
} 