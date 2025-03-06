import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import audioManager from '../../audio/AudioManager.js';
import { createM1Garand } from '../../models/weapons/m1_garand.js';

/**
 * WeaponSystem class handles weapon rendering, animation, and shooting mechanics
 */
export class WeaponSystem {
    constructor(camera, scene) {
        this.camera = camera;
        this.mainScene = scene;
        
        // Weapon scene setup
        this.weaponScene = new THREE.Scene();
        this.weaponCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10);
        
        // Weapon state
        this.currentWeapon = null;
        this.isAiming = false;
        this.isShooting = false;
        this.canShoot = true;
        this.reloading = false;
        
        // Weapon properties
        this.defaultFOV = 75;
        this.aimingFOV = 35; // Tighter FOV when aiming down sights
        this.shootingCooldown = 100;
        this.reloadTime = 2000;
        this.lastShotTime = 0;
        this.ammoCount = 5; // Kar98k clip size
        this.maxAmmo = 5;

        // Weapon positions
        this.defaultPosition = new THREE.Vector3(0.3, -0.3, -0.5);
        this.aimingPosition = new THREE.Vector3(0, -0.265, -0.35); // Position when aiming down sights
        this.defaultRotation = new THREE.Euler(0, Math.PI, 0);
        this.aimingRotation = new THREE.Euler(0, Math.PI, 0);

        // Aiming transition
        this.aimTransitionSpeed = 8.0;
        this.currentAimProgress = 0;
        
        // Weapon movement
        this.weaponBob = { x: 0, y: 0 };
        this.recoil = { x: 0, y: 0 };
        this.sway = { x: 0, y: 0 };
        this.lastStep = 0;
        this.stepFreq = 2;
        this.bobAmount = 0.02;
        
        // Effects
        this.muzzleFlash = null;
        this.shellEjectionSystem = null;
        this.impactEffects = null;
        
        // Game reference
        this.game = null;
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Set up weapon camera
        this.weaponCamera.position.set(0, 0, 0);
        
        // Add lighting to weapon scene
        this.setupWeaponLighting();
        
        // Load weapon model
        await this.loadWeaponModel();
        
        // Create effects
        this.createMuzzleFlash();
        this.createShellEjectionSystem();
        this.createImpactEffects();
    }
    
    setupWeaponLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.weaponScene.add(ambientLight);
        
        // Add directional light for better shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.weaponScene.add(directionalLight);
        
        // Add point light for muzzle flash illumination
        const flashLight = new THREE.PointLight(0xffaa33, 0, 3);
        flashLight.position.set(0, 0, -2);
        this.weaponScene.add(flashLight);
        this.muzzleLight = flashLight;
    }
    
    async loadWeaponModel() {
        try {
            // Create the weapon model
            this.currentWeapon = createM1Garand();
            this.weaponScene.add(this.currentWeapon);
            
            console.log('Weapon model loaded successfully');
        } catch (error) {
            console.error('Error loading weapon model:', error);
        }
    }
    
    createMuzzleFlash() {
        // Create muzzle flash geometry
        const flashGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const flashMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/textures/effects/muzzle_flash.png'),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.muzzleFlash.position.set(0, 0, -2);
        this.muzzleFlash.visible = false;
        this.weaponScene.add(this.muzzleFlash);
    }
    
    createShellEjectionSystem() {
        // Create shell geometry
        const shellGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const shellMaterial = new THREE.MeshStandardMaterial({
            color: 0xccaa00,
            roughness: 0.3,
            metalness: 0.8
        });
        
        this.shellEjectionSystem = {
            geometry: shellGeometry,
            material: shellMaterial,
            shells: [],
            eject: () => {
                const shell = new THREE.Mesh(shellGeometry, shellMaterial);
                shell.position.set(0.2, -0.1, -0.5);
                shell.velocity = new THREE.Vector3(
                    0.1 + Math.random() * 0.1,
                    0.2 + Math.random() * 0.1,
                    -0.05 + Math.random() * 0.1
                );
                shell.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                shell.rotationVelocity = new THREE.Vector3(
                    Math.random() * 10,
                    Math.random() * 10,
                    Math.random() * 10
                );
                
                this.weaponScene.add(shell);
                this.shellEjectionSystem.shells.push({
                    mesh: shell,
                    velocity: shell.velocity,
                    rotationVelocity: shell.rotationVelocity,
                    time: 0
                });
            }
        };
    }
    
    createImpactEffects() {
        this.impactEffects = {
            createImpact: (position, normal) => {
                // Create impact mark
                const impactMark = new THREE.Mesh(
                    new THREE.CircleGeometry(0.1, 8),
                    new THREE.MeshBasicMaterial({
                        map: new THREE.TextureLoader().load('/textures/effects/bullet_hole.png'),
                        transparent: true,
                        opacity: 0.8,
                        depthWrite: false
                    })
                );
                
                impactMark.position.copy(position);
                impactMark.position.add(normal.multiplyScalar(0.01));
                impactMark.lookAt(position.clone().add(normal));
                
                this.mainScene.add(impactMark);
                
                // Create impact particles
                this.createImpactParticles(position, normal);
                
                // Fade out impact mark
                setTimeout(() => {
                    const fadeOut = setInterval(() => {
                        impactMark.material.opacity -= 0.05;
                        if (impactMark.material.opacity <= 0) {
                            this.mainScene.remove(impactMark);
                            clearInterval(fadeOut);
                        }
                    }, 100);
                }, 5000);
            }
        };
    }
    
    createImpactParticles(position, normal) {
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0xcccccc })
            );
            
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            particle.velocity.add(normal.multiplyScalar(0.2));
            
            particles.add(particle);
        }
        
        this.mainScene.add(particles);
        
        // Animate particles
        let time = 0;
        const animate = () => {
            time += 0.016;
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.01; // gravity
            });
            
            if (time < 1) {
                requestAnimationFrame(animate);
            } else {
                this.mainScene.remove(particles);
            }
        };
        
        animate();
    }
    
    shoot() {
        if (!this.canShoot || this.reloading || this.ammoCount <= 0) return false;
        
        const now = performance.now();
        if (now - this.lastShotTime < this.shootingCooldown) return false;
        
        // Update state
        this.lastShotTime = now;
        this.ammoCount--;
        this.isShooting = true;
        
        // Apply recoil
        this.applyRecoil();
        
        // Show muzzle flash
        this.showMuzzleFlash();
        
        // Eject shell casing
        this.shellEjectionSystem.eject();
        
        // Create bullet impact
        this.createBulletImpact();
        
        // Play sound
        audioManager.playSound('gunshot');
        
        // Auto reload when empty
        if (this.ammoCount <= 0) {
            this.reload();
        }
        
        return true;
    }
    
    applyRecoil() {
        this.recoil.y = 0.1;
        this.recoil.x = (Math.random() - 0.5) * 0.02;
    }
    
    showMuzzleFlash() {
        if (!this.muzzleFlash) return;
        
        this.muzzleFlash.visible = true;
        this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
        this.muzzleFlash.scale.set(
            1 + Math.random() * 0.2,
            1 + Math.random() * 0.2,
            1
        );
        
        // Show muzzle light
        this.muzzleLight.intensity = 2;
        
        // Hide after a short delay
        setTimeout(() => {
            this.muzzleFlash.visible = false;
            this.muzzleLight.intensity = 0;
        }, 50);
    }
    
    createBulletImpact() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = raycaster.intersectObjects(this.mainScene.children, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            this.impactEffects.createImpact(hit.point, hit.face.normal);
        }
    }
    
    reload() {
        if (this.reloading) return;
        
        this.reloading = true;
        this.canShoot = false;
        
        // Play reload sound
        audioManager.playSound('reload');
        
        // Reload animation would go here
        
        setTimeout(() => {
            this.ammoCount = this.maxAmmo;
            this.reloading = false;
            this.canShoot = true;
        }, this.reloadTime);
    }
    
    update(deltaTime) {
        // Update weapon sway
        this.updateWeaponSway(deltaTime);
        
        // Update weapon bob
        this.updateWeaponBob(deltaTime);
        
        // Update recoil
        this.updateRecoil(deltaTime);
        
        // Update shell casings
        this.updateShellCasings(deltaTime);
        
        // Update aiming transition
        if (this.currentWeapon) {
            const targetProgress = this.isAiming ? 1 : 0;
            this.currentAimProgress += (targetProgress - this.currentAimProgress) * this.aimTransitionSpeed * deltaTime;
            
            // Interpolate position
            const position = new THREE.Vector3();
            position.lerpVectors(this.defaultPosition, this.aimingPosition, this.currentAimProgress);
            
            // Interpolate rotation
            const rotation = new THREE.Euler();
            rotation.x = THREE.MathUtils.lerp(this.defaultRotation.x, this.aimingRotation.x, this.currentAimProgress);
            rotation.y = THREE.MathUtils.lerp(this.defaultRotation.y, this.aimingRotation.y, this.currentAimProgress);
            rotation.z = THREE.MathUtils.lerp(this.defaultRotation.z, this.aimingRotation.z, this.currentAimProgress);
            
            // Apply position and rotation
            this.currentWeapon.position.copy(position);
            this.currentWeapon.position.add(new THREE.Vector3(
                this.weaponBob.x + this.recoil.x + this.sway.x,
                this.weaponBob.y + this.recoil.y + this.sway.y,
                0
            ));
            this.currentWeapon.rotation.copy(rotation);
            
            // Add slight tilt based on sway when aiming
            this.currentWeapon.rotation.z = -this.sway.x * (1 - this.currentAimProgress);
            
            // Update FOV
            const targetFOV = this.isAiming ? this.aimingFOV : this.defaultFOV;
            this.camera.fov += (targetFOV - this.camera.fov) * this.aimTransitionSpeed * deltaTime;
            this.camera.updateProjectionMatrix();
        }
    }
    
    updateWeaponSway(deltaTime) {
        // Mouse movement based sway
        const swayAmount = 0.02;
        const swaySpeed = 0.1;
        
        this.sway.x = Math.sin(performance.now() * 0.001) * swayAmount;
        this.sway.y = Math.cos(performance.now() * 0.002) * swayAmount;
    }
    
    updateWeaponBob(deltaTime) {
        if (this.isMoving) {
            const bobSpeed = this.isSprinting ? 15 : 10;
            this.lastStep += deltaTime * bobSpeed;
            
            this.weaponBob.y = Math.sin(this.lastStep * this.stepFreq) * this.bobAmount;
            this.weaponBob.x = Math.cos(this.lastStep * this.stepFreq * 0.5) * this.bobAmount * 0.5;
        } else {
            this.weaponBob.x *= 0.9;
            this.weaponBob.y *= 0.9;
        }
    }
    
    updateRecoil(deltaTime) {
        // Smooth recoil recovery
        this.recoil.x *= 0.8;
        this.recoil.y *= 0.8;
    }
    
    updateShellCasings(deltaTime) {
        if (!this.shellEjectionSystem) return;
        
        this.shellEjectionSystem.shells.forEach((shell, index) => {
            shell.time += deltaTime;
            
            // Update position
            shell.mesh.position.add(shell.velocity);
            shell.velocity.y -= 9.81 * deltaTime; // gravity
            
            // Update rotation
            shell.mesh.rotation.x += shell.rotationVelocity.x * deltaTime;
            shell.mesh.rotation.y += shell.rotationVelocity.y * deltaTime;
            shell.mesh.rotation.z += shell.rotationVelocity.z * deltaTime;
            
            // Remove old shells
            if (shell.time > 2) {
                this.weaponScene.remove(shell.mesh);
                this.shellEjectionSystem.shells.splice(index, 1);
            }
        });
    }
    
    toggleAim() {
        this.isAiming = !this.isAiming;
        
        // Update UI scope overlay
        if (this.game && this.game.ui) {
            this.game.ui.toggleScope(this.isAiming);
        }
        
        return this.isAiming;
    }
    
    onWindowResize() {
        this.weaponCamera.aspect = window.innerWidth / window.innerHeight;
        this.weaponCamera.updateProjectionMatrix();
    }
    
    setMovementState(isMoving, isSprinting) {
        this.isMoving = isMoving;
        this.isSprinting = isSprinting;
    }
}

export default WeaponSystem;
