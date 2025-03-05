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
        this.isShooting = false;
        this.canShoot = true;
        
        // Weapon properties
        this.defaultFOV = 75;
        this.aimingFOV = 45;
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
        const loader = new GLTFLoader();
        
        // Load M1 Garand model
        loader.load('/models/m1_garand/scene.gltf', (gltf) => {
            this.weapon = gltf.scene;
            
            // Scale and position the weapon
            this.weapon.scale.set(0.3, 0.3, 0.3);
            this.weapon.position.set(0.25, -0.25, -0.5);
            this.weapon.rotation.y = Math.PI / 8;
            
            // Add weapon to scene
            this.weaponScene.add(this.weapon);
            
            // Create muzzle flash
            this.createMuzzleFlash();
        });
    }
    
    createMuzzleFlash() {
        // Create muzzle flash sprite
        const textureLoader = new THREE.TextureLoader();
        const flashTexture = textureLoader.load('/textures/muzzle_flash.png');
        
        const flashMaterial = new THREE.SpriteMaterial({
            map: flashTexture,
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
            if (this.isAiming) {
                // Aiming position (centered)
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
        this.isAiming = !this.isAiming;
        return this.isAiming;
    }
    
    shoot() {
        const now = performance.now();
        
        // Check if can shoot
        if (!this.canShoot || now - this.lastShotTime < this.shootingCooldown) {
            // Play empty click sound if out of ammo
            if (this.bulletCount <= 0) {
                audioManager.playSound('empty_click');
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
            audioManager.playSound('garand_ping');
        } else {
            // Play normal gunshot
            audioManager.playSound('gunshot');
        }
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.material.opacity = 1.0;
            
            // Position muzzle flash based on aim state
            if (this.isAiming) {
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
            
            // Create bullet hole
            const bulletHoleTexture = new THREE.TextureLoader().load('/textures/bullet_hole.png');
            const bulletHoleMaterial = new THREE.SpriteMaterial({
                map: bulletHoleTexture,
                transparent: true,
                opacity: 0.8
            });
            
            const bulletHole = new THREE.Sprite(bulletHoleMaterial);
            bulletHole.scale.set(0.1, 0.1, 0.1);
            
            // Position slightly off the surface to prevent z-fighting
            bulletHole.position.copy(hit.point);
            bulletHole.position.add(hit.face.normal.multiplyScalar(0.01));
            
            // Orient to face the camera
            const lookAt = new THREE.Vector3().copy(hit.point).add(hit.face.normal);
            bulletHole.lookAt(lookAt);
            
            // Add to scene
            this.mainScene.add(bulletHole);
            
            // Create impact particles
            this.createImpactParticles(hit.point, hit.face.normal);
            
            // Play impact sound
            audioManager.playSound('bullet_impact');
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
    
    reload() {
        if (this.bulletCount < 8) {
            // Play reload sound
            audioManager.playSound('reload');
            
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
