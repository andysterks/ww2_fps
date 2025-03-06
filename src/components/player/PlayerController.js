import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

/**
 * PlayerController class handles player movement, collision detection, and camera controls
 */
export class PlayerController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isJumping = false;
        
        // Physics properties
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 5.0;
        this.sprintMultiplier = 1.6;
        this.crouchMultiplier = 0.5;
        this.jumpForce = 5.0;
        this.gravity = 9.81;

        // Create a camera holder for effects
        this.cameraHolder = new THREE.Object3D();
        this.scene.add(this.cameraHolder);
        this.cameraHolder.add(this.camera);
        
        // Initialize controls
        const gameContainer = document.getElementById('game-container');
        this.controls = new PointerLockControls(this.cameraHolder, gameContainer);
        
        // Log the controls to ensure they're properly initialized
        console.log('PointerLockControls initialized:', this.controls);
        
        // Set initial position
        this.cameraHolder.position.set(0, 2, 10);
        
        // Set up collision detection
        this.raycaster = new THREE.Raycaster();
        this.collidableObjects = [];
        
        // Camera effects
        this.bobAmount = 0.015;
        this.bobSpeed = 0.018;
        this.bobTime = 0;
        
        // Head bobbing
        this.headBob = {
            translation: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            intensity: 1.0,
            recovery: 0.2
        };
        
        // Breathing effect
        this.breathing = {
            offset: 0,
            frequency: 0.5,
            amplitude: 0.0015
        };
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Add debug logging for pointer lock state
        console.log('Setting up player controller event listeners');
        
        // Debug function to log movement state
        const logMovementState = () => {
            console.log('Movement state:', {
                forward: this.moveForward,
                backward: this.moveBackward,
                left: this.moveLeft,
                right: this.moveRight,
                sprint: this.isSprinting,
                crouch: this.isCrouching,
                jump: this.isJumping,
                isLocked: this.controls.isLocked
            });
        };
        
        document.addEventListener('keydown', (event) => {
            // Debug log for all key presses
            console.log('PlayerController keydown:', event.code, 'isLocked:', this.controls.isLocked);
            
            // Process movement keys even if not locked (will be checked in update)
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'ShiftLeft':
                    if (!this.isCrouching) this.isSprinting = true;
                    break;
                case 'Space':
                    if (!event.repeat) this.jump();
                    break;
                case 'KeyP': // Debug key to log movement state
                    logMovementState();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            // Debug log for all key releases
            console.log('PlayerController keyup:', event.code);
            
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'ShiftLeft':
                    this.isSprinting = false;
                    break;
            }
        });
        
        // Monitor pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            const isLocked = document.pointerLockElement === document.getElementById('game-container');
            console.log('Pointer lock changed:', isLocked);
            
            // If we just got locked, make sure movement state is reset
            if (isLocked) {
                this.moveForward = false;
                this.moveBackward = false;
                this.moveLeft = false;
                this.moveRight = false;
                this.isSprinting = false;
            }
        });
    }
    
    update(deltaTime) {
        // Check if controls are locked - if not, don't process movement
        if (!this.controls.isLocked) {
            // Debug log when not locked
            if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
                console.log('Movement keys pressed but controls not locked');
            }
            return;
        }

        // Debug log for movement state when keys are pressed
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            console.log('Processing movement:', {
                forward: this.moveForward,
                backward: this.moveBackward,
                left: this.moveLeft,
                right: this.moveRight
            });
        }

        // Calculate movement speed
        let currentSpeed = this.moveSpeed;
        if (this.isSprinting) currentSpeed *= this.sprintMultiplier;
        if (this.isCrouching) currentSpeed *= this.crouchMultiplier;

        // Calculate forward direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.cameraHolder.quaternion);
        forward.y = 0;
        forward.normalize();

        // Calculate right direction
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cameraHolder.quaternion);
        right.y = 0;
        right.normalize();

        // Reset velocity
        this.velocity.set(0, this.velocity.y, 0);

        // Apply movement
        if (this.moveForward) {
            this.velocity.add(forward.multiplyScalar(currentSpeed));
        }
        if (this.moveBackward) {
            this.velocity.add(forward.multiplyScalar(-currentSpeed));
        }
        if (this.moveRight) {
            this.velocity.add(right.multiplyScalar(currentSpeed));
        }
        if (this.moveLeft) {
            this.velocity.add(right.multiplyScalar(-currentSpeed));
        }

        // Apply gravity
        if (!this.isOnGround()) {
            this.velocity.y -= this.gravity * deltaTime;
        } else if (this.velocity.y < 0) {
            this.velocity.y = 0;
        }

        // Move the camera holder
        if (this.velocity.length() > 0) {
            console.log('Applying velocity:', this.velocity);
            this.cameraHolder.position.addScaledVector(this.velocity, deltaTime);
        }

        // Ensure minimum height
        const minHeight = this.isCrouching ? 1.0 : 2.0;
        if (this.cameraHolder.position.y < minHeight) {
            this.cameraHolder.position.y = minHeight;
            this.velocity.y = 0;
        }

        // Handle collisions
        this.handleCollisions();

        // Update camera effects if moving
        if (this.isMoving()) {
            this.updateCameraEffects(deltaTime);
        }
    }
    
    updateCameraEffects(deltaTime) {
        // Update head bob
        if (this.isMoving()) {
            const bobSpeed = this.isSprinting ? this.bobSpeed * 1.5 : this.bobSpeed;
            this.bobTime += deltaTime * bobSpeed;
            
            // Calculate head bob offsets
            const bobX = Math.sin(this.bobTime * 2) * this.bobAmount;
            const bobY = Math.abs(Math.sin(this.bobTime)) * this.bobAmount;
            
            // Apply head bob with intensity based on movement state
            const intensity = this.isSprinting ? 1.5 : (this.isCrouching ? 0.5 : 1.0);
            
            // Apply to camera local position
            this.camera.position.set(
                bobX * intensity,
                bobY * intensity,
                0
            );
        } else {
            // Smoothly reset camera position
            this.camera.position.multiplyScalar(1 - this.headBob.recovery);
        }
        
        // Update breathing effect
        this.breathing.offset = Math.sin(performance.now() * 0.001 * this.breathing.frequency) * this.breathing.amplitude;
        this.camera.position.y += this.breathing.offset;
    }
    
    handleCollisions() {
        for (const object of this.collidableObjects) {
            if (object.geometry) {
                const box = new THREE.Box3().setFromObject(object);
                if (box.containsPoint(this.cameraHolder.position)) {
                    // Move back if colliding
                    this.cameraHolder.position.addScaledVector(this.velocity, -1);
                    this.velocity.set(0, 0, 0);
                    break;
                }
            }
        }
    }
    
    jump() {
        if (this.isOnGround() && !this.isCrouching) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
        }
    }
    
    toggleCrouch() {
        this.isCrouching = !this.isCrouching;
        if (this.isCrouching) {
            this.isSprinting = false;
        }
    }
    
    isMoving() {
        return this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    }
    
    isOnGround() {
        this.raycaster.ray.origin.copy(this.cameraHolder.position);
        this.raycaster.ray.direction.set(0, -1, 0);
        
        const intersects = this.raycaster.intersectObjects(this.collidableObjects);
        return intersects.length > 0 && intersects[0].distance <= 0.1;
    }
    
    setCollidableObjects(objects) {
        this.collidableObjects = objects;
    }
    
    getPosition() {
        return this.cameraHolder.position;
    }
    
    getRotation() {
        return this.cameraHolder.rotation;
    }
    
    getMovementState() {
        return {
            isMoving: this.isMoving(),
            isSprinting: this.isSprinting,
            isCrouching: this.isCrouching,
            isJumping: this.isJumping,
            moveForward: this.moveForward,
            moveBackward: this.moveBackward,
            moveLeft: this.moveLeft,
            moveRight: this.moveRight
        };
    }

    setPosition(position) {
        this.cameraHolder.position.copy(position);
    }

    setRotation(rotation) {
        this.cameraHolder.rotation.copy(rotation);
    }

    setMovementState(state) {
        this.moveForward = state.moveForward;
        this.moveBackward = state.moveBackward;
        this.moveLeft = state.moveLeft;
        this.moveRight = state.moveRight;
        this.isSprinting = state.isSprinting;
        this.isCrouching = state.isCrouching;
        this.isJumping = state.isJumping;
    }
}

export default PlayerController;
