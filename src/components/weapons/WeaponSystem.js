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
        this.fovAnimationId = null; // Track FOV animation
        
        // Weapon properties
        this.defaultFOV = 75;
        this.aimingFOV = 45; // Adjusted FOV when aiming
        this.shootingCooldown = 100;
        this.reloadTime = 2000;
        this.lastShotTime = 0;
        this.ammoCount = 5; // Kar98k clip size
        this.maxAmmo = 5;

        // Weapon positions
        this.defaultPosition = new THREE.Vector3(0.3, -0.3, -0.5);
        this.aimingPosition = new THREE.Vector3(0, -0.25, -0.4); // Adjusted position when aiming
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
        // Handle aim transition
        if (this.aimTransition) {
            this.aimTransition.progress += deltaTime / this.aimTransition.duration;
            
            if (this.aimTransition.progress >= 1) {
                // Finish transition
                this.currentWeapon.position.copy(this.aimTransition.targetPos);
                this.currentWeapon.rotation.copy(this.aimTransition.targetRot);
                this.aimTransition = null;
            } else {
                // Interpolate position and rotation
                this.currentWeapon.position.lerpVectors(
                    this.aimTransition.startPos,
                    this.aimTransition.targetPos,
                    this.aimTransition.progress
                );
                
                this.currentWeapon.rotation.x = THREE.MathUtils.lerp(
                    this.aimTransition.startRot.x,
                    this.aimTransition.targetRot.x,
                    this.aimTransition.progress
                );
                this.currentWeapon.rotation.y = THREE.MathUtils.lerp(
                    this.aimTransition.startRot.y,
                    this.aimTransition.targetRot.y,
                    this.aimTransition.progress
                );
                this.currentWeapon.rotation.z = THREE.MathUtils.lerp(
                    this.aimTransition.startRot.z,
                    this.aimTransition.targetRot.z,
                    this.aimTransition.progress
                );
            }
        }
        
        // Update weapon sway and bob
        if (this.currentWeapon) {
            this.updateWeaponSway(deltaTime);
            this.updateWeaponBob(deltaTime);
            this.updateRecoil(deltaTime);
        }
        
        // Update shell casings
        this.updateShellCasings(deltaTime);
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
        console.log('WEAPON SYSTEM - toggleAim called, isAiming:', this.isAiming);
        
        // Create standalone iron sights that don't rely on existing elements
        this.createStandaloneIronSights(this.isAiming);
        
        // Toggle the permanent iron sight in the HTML
        const permanentIronSight = document.getElementById('permanent-iron-sight');
        if (permanentIronSight) {
            permanentIronSight.style.display = this.isAiming ? 'block' : 'none';
            console.log('Permanent iron sight toggled:', this.isAiming);
        } else {
            console.error('Permanent iron sight element not found in DOM');
        }
        
        // Direct DOM manipulation for iron sights (fallback approach)
        if (this.isAiming) {
            // Create a simple red dot sight directly in the DOM
            const simpleSight = document.createElement('div');
            simpleSight.id = 'simple-iron-sight';
            
            // Style it to be unmissable
            Object.assign(simpleSight.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                backgroundColor: 'red',
                borderRadius: '50%',
                zIndex: '999999',
                pointerEvents: 'none',
                boxShadow: '0 0 10px red'
            });
            
            // Remove any existing simple sight
            const existingSimpleSight = document.getElementById('simple-iron-sight');
            if (existingSimpleSight) {
                existingSimpleSight.remove();
            }
            
            // Add to document body
            document.body.appendChild(simpleSight);
            console.log('Simple iron sight added to DOM');
            
            // Hide crosshair
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.style.display = 'none';
            }
        } else {
            // Remove simple sight when not aiming
            const simpleSight = document.getElementById('simple-iron-sight');
            if (simpleSight) {
                simpleSight.remove();
                console.log('Simple iron sight removed from DOM');
            }
            
            // Show crosshair
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.style.display = 'block';
            }
        }
        
        // Adjust weapon position for aiming
        if (this.currentWeapon) {
            const targetPosition = this.isAiming
                ? this.aimingPosition.clone() // Use predefined aiming position
                : this.defaultPosition.clone(); // Use predefined default position
            
            const targetRotation = this.isAiming
                ? this.aimingRotation.clone()
                : this.defaultRotation.clone();
            
            // Smoothly transition to new position
            this.aimTransition = {
                startPos: this.currentWeapon.position.clone(),
                targetPos: targetPosition,
                startRot: this.currentWeapon.rotation.clone(),
                targetRot: targetRotation,
                progress: 0,
                duration: 0.3 // Slightly longer duration for smoother transition
            };
            
            // Update camera FOV with fixed transition
            if (this.camera) {
                // Cancel any existing FOV animation
                if (this.fovAnimationId) {
                    cancelAnimationFrame(this.fovAnimationId);
                    this.fovAnimationId = null;
                }
                
                const targetFOV = this.isAiming ? this.aimingFOV : this.defaultFOV;
                const startFOV = this.camera.fov;
                const fovDiff = targetFOV - startFOV;
                const animationDuration = 300; // ms
                const startTime = performance.now();
                
                // Fixed duration animation
                const animateFOV = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / animationDuration, 1.0);
                    
                    if (progress < 1.0) {
                        // Use easing function for smoother transition
                        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
                        this.camera.fov = startFOV + fovDiff * easedProgress;
                        this.camera.updateProjectionMatrix();
                        this.fovAnimationId = requestAnimationFrame(animateFOV);
                    } else {
                        // Ensure we end exactly at the target value
                        this.camera.fov = targetFOV;
                        this.camera.updateProjectionMatrix();
                        this.fovAnimationId = null;
                        
                        console.log('FOV animation completed:', {
                            finalFOV: this.camera.fov,
                            targetFOV: targetFOV
                        });
                    }
                };
                
                this.fovAnimationId = requestAnimationFrame(animateFOV);
            }
        }
    }
    
    // Completely standalone iron sights implementation
    createStandaloneIronSights(isAiming) {
        console.log('Creating standalone iron sights, isAiming:', isAiming);
        
        // Remove any existing standalone iron sights
        const existingIronSights = document.getElementById('standalone-iron-sights');
        if (existingIronSights) {
            existingIronSights.remove();
        }
        
        // Toggle crosshair visibility
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.display = isAiming ? 'none' : 'block';
        }
        
        // If not aiming, we're done
        if (!isAiming) {
            console.log('Not aiming, iron sights hidden');
            return;
        }
        
        // Create a completely new iron sights element with inline styles
        const ironSights = document.createElement('div');
        ironSights.id = 'standalone-iron-sights';
        ironSights.innerHTML = `
            <div style="position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 10px !important; height: 10px !important; background-color: red !important; border-radius: 50% !important; box-shadow: 0 0 10px red !important;"></div>
            <div style="position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 40px !important; height: 40px !important; border: 3px solid red !important; border-radius: 50% !important; box-shadow: 0 0 10px red !important;"></div>
            <div style="position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 100px !important; height: 3px !important; background-color: red !important; box-shadow: 0 0 10px red !important;"></div>
            <div style="position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 3px !important; height: 100px !important; background-color: red !important; box-shadow: 0 0 10px red !important;"></div>
            <div style="position: absolute !important; top: 20px !important; left: 50% !important; transform: translateX(-50%) !important; color: red !important; font-size: 20px !important; font-weight: bold !important; text-shadow: 0 0 5px black !important;">IRON SIGHTS ACTIVE</div>
        `;
        
        // Apply styles directly to make it unmissable
        Object.assign(ironSights.style, {
            position: 'fixed !important',
            top: '0 !important',
            left: '0 !important',
            width: '100% !important',
            height: '100% !important',
            zIndex: '999999 !important',
            pointerEvents: 'none !important',
            backgroundColor: 'rgba(0,0,0,0.2) !important'
        });
        
        // Add to document body directly
        document.body.appendChild(ironSights);
        
        // Force the element to be visible
        setTimeout(() => {
            const addedElement = document.getElementById('standalone-iron-sights');
            if (addedElement) {
                addedElement.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 999999 !important;
                    pointer-events: none !important;
                    background-color: rgba(0,0,0,0.2) !important;
                    display: block !important;
                `;
            }
        }, 100);
        
        console.log('Standalone iron sights created and added to DOM:', ironSights);
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
