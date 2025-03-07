import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { audioManager } from '../../audio.js';

/**
 * WeaponSystem class handles weapon rendering, animation, and shooting mechanics
 */
class WeaponSystem {
    constructor(camera, scene) {
        // Main references
        this.camera = camera;
        this.mainScene = scene;
        
        // Weapon rendering
        this.weaponScene = new THREE.Scene();
        this.weaponCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Weapon state
        this.weapon = null;
        this.muzzleFlash = null;
        this.isAiming = false;
        this._isAimingDownSights = false;
        this.hasAimedDownSights = false;
        this.isShooting = false;
        this.canShoot = true;
        
        // Weapon properties
        this.defaultFOV = 75;
        this.aimingFOV = 45;
        this.adsZoomFOV = 30;
        this.shootingCooldown = 500; // milliseconds
        this.lastShotTime = 0;
        this.bulletCount = 8; // M1 Garand clip size
        
        // Weapon movement
        this.weaponBob = { x: 0, y: 0 };
        this.lastStep = 0;
        this.stepFreq = 2;
        this.bobAmount = 0.015;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up weapon camera
        this.weaponCamera.position.set(0, 0, 0);
        
        // Add ambient light to weapon scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.weaponScene.add(ambientLight);
        
        // Add directional light to weapon scene for better shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.weaponScene.add(directionalLight);
        
        // Load weapon model
        this.loadWeaponModel();
    }
    
    loadWeaponModel() {
        // Create a simple M1 Garand model using basic geometries
        this.weapon = this.createSimpleM1Garand();
        
        // Scale and position the weapon
        this.weapon.position.set(0.25, -0.25, -0.5);
        this.weapon.rotation.y = Math.PI / 8;
        
        // Add weapon to scene
        this.weaponScene.add(this.weapon);
        
        // Create muzzle flash
        this.createMuzzleFlash();
    }
    
    createSimpleM1Garand() {
        const weaponGroup = new THREE.Group();
        
        // Main rifle body
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x5c3a21 }) // Brown wood color
        );
        weaponGroup.add(rifleBody);
        
        // Barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444 }) // Dark metal color
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.35;
        barrel.position.y = 0.01;
        weaponGroup.add(barrel);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.02, 0.005, 8, 16, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.position.y = -0.02;
        triggerGuard.position.z = 0.1;
        weaponGroup.add(triggerGuard);
        
        // Trigger
        const trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.005, 0.02, 0.01),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        trigger.position.y = -0.03;
        trigger.position.z = 0.1;
        weaponGroup.add(trigger);
        
        return weaponGroup;
    }
    
    createMuzzleFlash() {
        // Create muzzle flash sprite without texture
        const flashMaterial = new THREE.SpriteMaterial({
            color: 0xffff00,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0
        });
        
        this.muzzleFlash = new THREE.Sprite(flashMaterial);
        this.muzzleFlash.scale.set(0.2, 0.2, 0.2);
        this.muzzleFlash.position.set(0.25, -0.15, -1.0);
        
        this.weaponScene.add(this.muzzleFlash);
    }
    
    update(playerMovement) {
        if (!this.weapon) return;
        
        // Update weapon position based on movement
        this.updateWeaponPosition(playerMovement);
        
        // Update muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.material.opacity *= 0.8; // Fade out
        }
    }
    
    updateWeaponPosition(playerMovement) {
        const now = performance.now();
        const isMoving = playerMovement.moveForward || playerMovement.moveBackward || 
                        playerMovement.moveLeft || playerMovement.moveRight;
        
        if (isMoving) {
            // Calculate step frequency based on sprint state
            const currentStepFreq = playerMovement.isSprinting ? this.stepFreq * 1.5 : this.stepFreq;
            
            // Calculate weapon bobbing
            const bobX = Math.sin(now * 0.01 * currentStepFreq) * this.bobAmount;
            const bobY = Math.abs(Math.sin(now * 0.01 * currentStepFreq * 2)) * this.bobAmount;
            
            // Apply bobbing with smoothing
            this.weaponBob.x = this.weaponBob.x * 0.9 + bobX * 0.1;
            this.weaponBob.y = this.weaponBob.y * 0.9 + bobY * 0.1;
        } else {
            // Return to neutral position when not moving
            this.weaponBob.x *= 0.95;
            this.weaponBob.y *= 0.95;
        }
        
        if (this.weapon) {
            // Apply weapon position based on aim state
            if (this._isAimingDownSights) {
                // Aiming down sights position (centered and closer to camera)
                this.weapon.position.set(
                    0 + this.weaponBob.x * 0.1,
                    -0.05 + this.weaponBob.y * 0.1,
                    -0.2
                );
                this.weapon.rotation.y = 0;
                
                // Adjust FOV for aiming down sights
                this.weaponCamera.fov = this.adsZoomFOV;
                this.weaponCamera.updateProjectionMatrix();
            } else if (this.isAiming) {
                // Regular aiming position (centered)
                this.weapon.position.set(
                    0 + this.weaponBob.x * 0.3,
                    -0.15 + this.weaponBob.y * 0.3,
                    -0.3
                );
                this.weapon.rotation.y = 0;
                
                // Adjust FOV for aiming
                this.weaponCamera.fov = this.aimingFOV;
                this.weaponCamera.updateProjectionMatrix();
            } else {
                // Hip position
                this.weapon.position.set(
                    0.25 + this.weaponBob.x,
                    -0.25 + this.weaponBob.y,
                    -0.5
                );
                this.weapon.rotation.y = Math.PI / 8;
                
                // Reset FOV
                this.weaponCamera.fov = this.defaultFOV;
                this.weaponCamera.updateProjectionMatrix();
            }
        }
    }
    
    toggleAim() {
        // If currently aiming down sights, exit that mode first
        if (this._isAimingDownSights) {
            this._isAimingDownSights = false;
        }
        
        this.isAiming = !this.isAiming;
        return this.isAiming;
    }
    
    toggleAimDownSights() {
        // Toggle aiming down sights state
        this._isAimingDownSights = !this._isAimingDownSights;
        
        // If enabling ADS, make sure regular aiming is also enabled
        if (this._isAimingDownSights) {
            this.isAiming = true;
        }
        
        // Check if this is the first time aiming down sights
        const isFirstTime = this._isAimingDownSights && !this.hasAimedDownSights;
        if (isFirstTime) {
            this.hasAimedDownSights = true;
        }
        
        return {
            isAimingDownSights: this._isAimingDownSights,
            isFirstTime: isFirstTime
        };
    }
    
    shoot() {
        const now = performance.now();
        
        // Check if can shoot
        if (!this.canShoot || now - this.lastShotTime < this.shootingCooldown) {
            // Play empty click sound if out of ammo
            if (this.bulletCount <= 0) {
                audioManager.play('empty');
            }
            return false;
        }
        
        // Check ammo
        if (this.bulletCount <= 0) {
            this.reload();
            return false;
        }
        
        // Update shooting state
        this.lastShotTime = now;
        this.bulletCount--;
        
        // Play appropriate sound
        if (this.bulletCount === 0) {
            // Play M1 Garand ping on last round
            audioManager.play('ping');
        } else {
            // Play normal gunshot
            audioManager.play('gunshot');
        }
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.material.opacity = 1.0;
            
            // Position muzzle flash based on aim state
            if (this._isAimingDownSights) {
                this.muzzleFlash.position.set(0, -0.02, -0.6);
            } else if (this.isAiming) {
                this.muzzleFlash.position.set(0, -0.05, -0.8);
            } else {
                this.muzzleFlash.position.set(0.25, -0.15, -1.0);
            }
        }
        
        // Create bullet impact
        this.createBulletImpact();
        
        // Auto reload when empty
        if (this.bulletCount <= 0) {
            setTimeout(() => this.reload(), 500);
        }
        
        return true;
    }
    
    createBulletImpact() {
        // Create a raycaster for bullet trajectory
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Check for intersections with scene objects
        const intersects = raycaster.intersectObjects(this.mainScene.children, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            
            // Create bullet hole using a simple circle mesh instead of texture
            const bulletHoleMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const bulletHole = new THREE.Mesh(
                new THREE.CircleGeometry(0.03, 8),
                bulletHoleMaterial
            );
            
            // Position slightly off the surface to prevent z-fighting
            bulletHole.position.copy(hit.point);
            bulletHole.position.add(hit.face.normal.multiplyScalar(0.01));
            
            // Orient to face normal
            bulletHole.lookAt(new THREE.Vector3().copy(hit.point).add(hit.face.normal));
            
            // Add to scene
            this.mainScene.add(bulletHole);
            
            // Create simple impact particles
            this.createSimpleImpactParticles(hit.point, hit.face.normal);
            
            // No need for impact sound for now as we don't have the audio file
        }
    }
    
    createImpactParticles(position, normal) {
        // Create particle geometry
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.05,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        // Set initial positions
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mainScene.add(particles);
        
        // Create velocity array for particles
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            // Adjust velocity to spray outward from impact
            velocity.add(normal.clone().multiplyScalar(0.2));
            velocities.push(velocity);
        }
        
        // Animate particles
        const startTime = performance.now();
        const animateParticles = () => {
            const positions = particles.geometry.attributes.position.array;
            const elapsed = performance.now() - startTime;
            
            // Update particle positions
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y - 0.01; // Add gravity
                positions[i * 3 + 2] += velocities[i].z;
                
                // Slow down particles
                velocities[i].multiplyScalar(0.95);
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particles.material.opacity = 1.0 - elapsed / 1000;
            
            // Remove particles after animation
            if (elapsed < 1000) {
                requestAnimationFrame(animateParticles);
            } else {
                this.mainScene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        // Start animation
        animateParticles();
    }
    
    createSimpleImpactParticles(position, normal) {
        // Create a simpler version of impact particles
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.05,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        // Set initial positions
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mainScene.add(particles);
        
        // Create velocity array for particles
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3 + 0.2, // Slight upward bias
                (Math.random() - 0.5) * 0.3
            );
            
            // Adjust velocity to spray outward from impact
            velocity.add(normal.clone().multiplyScalar(0.1));
            velocities.push(velocity);
        }
        
        // Animate particles
        const startTime = performance.now();
        const animateParticles = () => {
            const positions = particles.geometry.attributes.position.array;
            const elapsed = performance.now() - startTime;
            
            // Update particle positions
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y - 0.01; // Add gravity
                positions[i * 3 + 2] += velocities[i].z;
                
                // Slow down particles
                velocities[i].multiplyScalar(0.9);
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Fade out particles
            particles.material.opacity = 1.0 - elapsed / 500;
            
            // Remove particles after 0.5 seconds
            if (elapsed < 500) {
                requestAnimationFrame(animateParticles);
            } else {
                this.mainScene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        // Start animation
        requestAnimationFrame(animateParticles);
    }
    
    reload() {
        if (this.bulletCount < 8) {
            // Play reload sound
            audioManager.play('reload');
            
            // Reload animation and timing
            this.canShoot = false;
            
            // Reset bullet count after reload time
            setTimeout(() => {
                this.bulletCount = 8;
                this.canShoot = true;
            }, 2000);
        }
    }
    
    getWeaponScene() {
        return this.weaponScene;
    }
    
    getWeaponCamera() {
        return this.weaponCamera;
    }
    
    isAimingDownSights() {
        return this._isAimingDownSights;
    }
    
    isAiming() {
        return this.isAiming;
    }
    
    getBulletCount() {
        return this.bulletCount;
    }
    
    // Handle window resize
    onWindowResize() {
        this.weaponCamera.aspect = window.innerWidth / window.innerHeight;
        this.weaponCamera.updateProjectionMatrix();
    }
}

export default WeaponSystem;
