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
        this.lastPosition = new THREE.Vector3();
        this.moveSpeed = 5.0; // meters per second
        this.sprintMultiplier = 1.6;
        this.crouchMultiplier = 0.5;
        this.jumpForce = 5.0;
        this.gravity = 9.81;
        
        // Player dimensions
        this.standingHeight = 1.8; // meters
        this.crouchingHeight = 1.0; // meters
        this.currentHeight = this.standingHeight;
        this.radius = 0.3; // meters for collision
        
        // Camera properties
        this.defaultFOV = 75;
        this.sprintingFOV = 85;
        this.crouchingFOV = 70;
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
        
        // Initialize controls
        this.controls = new PointerLockControls(this.camera, document.body);
        
        // Set initial position
        this.camera.position.set(0, this.standingHeight, 0);
        
        // Set up collision detection
        this.raycaster = new THREE.Raycaster();
        this.collidableObjects = [];
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
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
                case 'KeyC':
                    this.toggleCrouch();
                    break;
                case 'Space':
                    this.jump();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
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
    }
    
    update(deltaTime) {
        if (!this.controls.isLocked) return;
        
        // Store previous position for collision detection
        this.lastPosition.copy(this.camera.position);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update camera effects
        this.updateCameraEffects(deltaTime);
        
        // Check collisions and update final position
        this.handleCollisions();
    }
    
    updateMovement(deltaTime) {
        // Calculate base speed
        let currentSpeed = this.moveSpeed;
        if (this.isSprinting) currentSpeed *= this.sprintMultiplier;
        if (this.isCrouching) currentSpeed *= this.crouchMultiplier;
        
        // Apply movement based on input
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Update velocity
        if (this.moveForward || this.moveBackward) {
            this.velocity.z = -this.direction.z * currentSpeed;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x = -this.direction.x * currentSpeed;
        }
        
        // Apply gravity and handle jumping
        if (!this.isOnGround()) {
            this.velocity.y -= this.gravity * deltaTime;
        } else if (this.velocity.y < 0) {
            this.velocity.y = 0;
        }
        
        // Update position
        this.controls.moveRight(-this.velocity.x * deltaTime);
        this.controls.moveForward(-this.velocity.z * deltaTime);
        this.camera.position.y += this.velocity.y * deltaTime;
        
        // Clamp height to ground
        const minHeight = this.isOnGround() ? 
            (this.isCrouching ? this.crouchingHeight : this.standingHeight) : 
            this.camera.position.y;
        this.camera.position.y = Math.max(minHeight, this.camera.position.y);
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
            this.headBob.translation.set(
                bobX * intensity,
                bobY * intensity,
                0
            );
            
            // Apply slight tilt based on movement
            this.headBob.rotation.z = Math.sin(this.bobTime) * 0.02 * intensity;
        } else {
            // Smoothly reset head bob
            this.headBob.translation.multiplyScalar(1 - this.headBob.recovery);
            this.headBob.rotation.z *= 1 - this.headBob.recovery;
        }
        
        // Update breathing effect
        this.breathing.offset = Math.sin(performance.now() * 0.001 * this.breathing.frequency) * this.breathing.amplitude;
        
        // Apply all camera effects
        this.camera.position.add(this.headBob.translation);
        this.camera.rotation.z = this.headBob.rotation.z;
        this.camera.position.y += this.breathing.offset;
        
        // Update FOV based on movement state
        let targetFOV = this.defaultFOV;
        if (this.isSprinting) targetFOV = this.sprintingFOV;
        if (this.isCrouching) targetFOV = this.crouchingFOV;
        
        this.camera.fov += (targetFOV - this.camera.fov) * 0.1;
        this.camera.updateProjectionMatrix();
    }
    
    handleCollisions() {
        // Check for collisions with environment
        for (const object of this.collidableObjects) {
            // Simple sphere-box collision check
            if (object.geometry.type === 'BoxGeometry') {
                const box = new THREE.Box3().setFromObject(object);
                const sphere = new THREE.Sphere(this.camera.position, this.radius);
                
                if (box.intersectsSphere(sphere)) {
                    // Move back to last safe position
                    this.camera.position.copy(this.lastPosition);
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
        
        // Cannot sprint while crouching
        if (this.isCrouching) this.isSprinting = false;
        
        // Smoothly adjust camera height
        const targetHeight = this.isCrouching ? this.crouchingHeight : this.standingHeight;
        this.currentHeight = targetHeight;
    }
    
    isMoving() {
        return this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    }
    
    isOnGround() {
        // Cast ray downward to check for ground
        this.raycaster.ray.origin.copy(this.camera.position);
        this.raycaster.ray.direction.set(0, -1, 0);
        
        const intersects = this.raycaster.intersectObjects(this.collidableObjects);
        return intersects.length > 0 && intersects[0].distance <= 0.1;
    }
    
    setCollidableObjects(objects) {
        this.collidableObjects = objects;
    }
    
    getPosition() {
        return this.camera.position;
    }
    
    getRotation() {
        return this.camera.rotation;
    }
    
    getMovementState() {
        return {
            isMoving: this.isMoving(),
            isSprinting: this.isSprinting,
            isCrouching: this.isCrouching,
            isJumping: this.isJumping
        };
    }
}

export default PlayerController;
