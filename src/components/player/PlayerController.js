import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

/**
 * PlayerController class handles player movement, collision detection, and camera controls
 */
class PlayerController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        
        // Physics properties
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        
        // Player dimensions
        this.playerHeight = 1.8; // meters
        this.playerRadius = 0.4; // meters
        
        // Collision detection
        this.raycaster = new THREE.Raycaster();
        this.collidableObjects = [];
        this.stuckCounter = 0;
        
        // View bobbing
        this.viewBobOffset = 0;
        this.viewBobAmount = 0.008;
        this.viewBobFreq = 4;
        this.headBobTimer = 0;
        
        // Breathing effect
        this.breathingAmount = 0.0015;
        this.breathingFreq = 0.5;
        
        // Initialize controls
        this.controls = new PointerLockControls(this.camera, document.body);
        
        // Set initial position to see the environment better
        this.camera.position.set(0, this.playerHeight, 10);
        this.controls.getObject().position.set(0, this.playerHeight, 10);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Click to lock pointer
        document.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });
    }
    
    onKeyDown(event) {
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
            case 'ShiftRight':
                this.isSprinting = true;
                break;
        }
    }
    
    onKeyUp(event) {
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
            case 'ShiftRight':
                this.isSprinting = false;
                break;
        }
    }
    
    setCollidableObjects(objects) {
        this.collidableObjects = objects;
    }
    
    update(isAiming = false) {
        if (!this.controls.isLocked) return;
        
        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;
        this.prevTime = time;
        
        // Update movement
        this.updateMovement(delta, isAiming);
        
        // Update view bobbing
        this.updateViewBobbing(time);
    }
    
    updateMovement(delta, isAiming) {
        // Apply friction to slow down
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        
        // Calculate movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Calculate speed modifiers
        const baseSpeed = 62.5; // Extremely slow for realism
        const sprintModifier = this.isSprinting ? 1.5 : 1.0;
        const aimingModifier = isAiming ? 0.6 : 1.0;
        const speedModifier = sprintModifier * aimingModifier;
        
        // Apply movement
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * baseSpeed * speedModifier * delta;
        }
        
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * baseSpeed * speedModifier * delta;
        }
        
        // Handle collisions
        this.handleCollisions(delta);
    }
    
    handleCollisions(delta) {
        // Horizontal collision detection
        const horizontalCollision = this.checkHorizontalCollisions();
        
        if (!horizontalCollision) {
            // Move horizontally if no collision
            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
        } else {
            // Reset velocity if collision detected
            this.velocity.x = 0;
            this.velocity.z = 0;
            this.stuckCounter++;
            
            // If stuck for too long, try to unstick
            if (this.stuckCounter > 5) {
                this.controls.moveRight(0.05);
                this.stuckCounter = 0;
            }
        }
        
        // Vertical collision detection (floor/ceiling)
        this.checkVerticalCollisions();
    }
    
    checkHorizontalCollisions() {
        if (this.collidableObjects.length === 0) return false;
        
        const playerPosition = new THREE.Vector3();
        playerPosition.copy(this.camera.position);
        
        // Check in 8 directions around the player
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.sin(angle) * this.playerRadius;
            const z = Math.cos(angle) * this.playerRadius;
            
            this.raycaster.set(
                new THREE.Vector3(
                    playerPosition.x + x,
                    playerPosition.y - this.playerHeight / 2,
                    playerPosition.z + z
                ),
                new THREE.Vector3(
                    this.velocity.x > 0 ? 1 : -1,
                    0,
                    this.velocity.z > 0 ? 1 : -1
                ).normalize()
            );
            
            const intersections = this.raycaster.intersectObjects(this.collidableObjects, true);
            if (intersections.length > 0 && intersections[0].distance < 0.5) {
                return true;
            }
        }
        
        return false;
    }
    
    checkVerticalCollisions() {
        if (this.collidableObjects.length === 0) return;
        
        const playerPosition = new THREE.Vector3();
        playerPosition.copy(this.camera.position);
        
        // Check for floor
        this.raycaster.set(
            playerPosition,
            new THREE.Vector3(0, -1, 0)
        );
        
        const floorIntersections = this.raycaster.intersectObjects(this.collidableObjects, true);
        if (floorIntersections.length > 0 && floorIntersections[0].distance < this.playerHeight) {
            this.camera.position.y = floorIntersections[0].point.y + this.playerHeight;
        }
        
        // Check for ceiling
        this.raycaster.set(
            playerPosition,
            new THREE.Vector3(0, 1, 0)
        );
        
        const ceilingIntersections = this.raycaster.intersectObjects(this.collidableObjects, true);
        if (ceilingIntersections.length > 0 && ceilingIntersections[0].distance < 0.2) {
            // Push player down if hitting ceiling
            this.camera.position.y = ceilingIntersections[0].point.y - 0.2;
        }
    }
    
    updateViewBobbing(time) {
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        
        // Update head bob timer only when moving
        if (isMoving) {
            this.headBobTimer += 0.016; // Increment based on approximate frame time
            
            // Calculate view bob based on movement
            const currentViewBobFreq = this.isSprinting ? this.viewBobFreq * 1.3 : this.viewBobFreq;
            
            // Only vertical bobbing - no rotation effects
            this.viewBobOffset = Math.abs(Math.sin(this.headBobTimer * currentViewBobFreq * 2)) * this.viewBobAmount;
        } else {
            // Gradually return to center when not moving
            this.viewBobOffset *= 0.9;
            
            // Reset when close to zero
            if (Math.abs(this.viewBobOffset) < 0.0001) {
                this.viewBobOffset = 0;
            }
        }
        
        // Add breathing effect
        const breathingY = Math.sin(time * 0.001 * this.breathingFreq) * this.breathingAmount;
        
        // Apply only vertical bobbing to camera position
        this.camera.position.y = this.playerHeight + (isMoving ? this.viewBobOffset : 0) + breathingY;
    }
    
    getControls() {
        return this.controls;
    }
    
    getPosition() {
        return this.camera.position;
    }
    
    getDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        return direction.applyQuaternion(this.camera.quaternion);
    }
}

export default PlayerController;
