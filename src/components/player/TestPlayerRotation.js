import * as THREE from 'three';

/**
 * TestPlayerRotation class
 * Creates a test player model that continuously rotates 360 degrees horizontally
 * while simultaneously looking up and down, with aiming down sights enabled.
 * This helps visualize any issues with player model rotation.
 */
class TestPlayerRotation {
    constructor(scene, game) {
        console.log('TestPlayerRotation constructor called');
        
        if (!scene) {
            throw new Error('TestPlayerRotation requires a valid scene');
        }
        
        this.scene = scene;
        this.game = game;
        
        // Animation properties
        this.rotationSpeed = 0.3; // Radians per second for horizontal rotation
        this.timeElapsed = 0;
        
        // Player position
        this.position = new THREE.Vector3(0, 0, 0);
        
        // Player rotation
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        
        // Vertical look animation
        this.lookCycle = 0; // Value from 0 to 2π for smooth oscillation
        this.lookCycleSpeed = 0.5; // Speed of the look cycle
        
        // Vertical look limits
        this.minPitch = -Math.PI / 4; // About -45 degrees
        this.maxPitch = Math.PI / 4;  // About 45 degrees
        
        // Always aiming down sights
        this.isAimingDownSights = true;
        
        // Previous rotation values for smoothing
        this.prevRotation = {
            x: 0,
            y: 0
        };
        
        // Smoothing factor
        this.smoothingFactor = 0.92;
        
        // Create player model
        this.model = null;
        try {
            this.createModel();
        } catch (error) {
            console.error('Error in TestPlayerRotation.createModel:', error);
            throw new Error('Failed to create player model: ' + error.message);
        }
    }
    
    /**
     * Create a player model similar to the regular player model
     */
    createModel() {
        console.log("Creating test player rotation model");
        
        // Create a group for the player model
        this.model = new THREE.Group();
        this.model.name = 'test-player-rotation';
        
        // Create a simple material for the player - using green to distinguish from others
        const uniformMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        
        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            uniformMaterial
        );
        head.position.y = 1.75;
        head.name = 'head';
        this.model.add(head);
        
        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.3),
            uniformMaterial
        );
        body.position.y = 1.1;
        body.name = 'body';
        this.model.add(body);
        
        // Left arm
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            uniformMaterial
        );
        leftArm.position.set(0.4, 1.1, 0);
        leftArm.name = 'leftArm';
        this.model.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.7, 0.2),
            uniformMaterial
        );
        rightArm.position.set(-0.4, 1.1, 0);
        rightArm.name = 'rightArm';
        this.model.add(rightArm);
        
        // Left leg
        const leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.7, 0.3),
            uniformMaterial
        );
        leftLeg.position.set(0.2, 0.35, 0);
        leftLeg.name = 'leftLeg';
        this.model.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.7, 0.3),
            uniformMaterial
        );
        rightLeg.position.set(-0.2, 0.35, 0);
        rightLeg.name = 'rightLeg';
        this.model.add(rightLeg);
        
        // Add a rifle
        try {
            this.createRifle();
        } catch (error) {
            console.error('Error creating rifle:', error);
            // Continue without rifle if there's an error
        }
        
        // Position the model
        this.model.position.set(
            this.position.x,
            this.position.y,
            this.position.z
        );
        
        // Add a visual indicator for forward direction (for debugging)
        const directionArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, 1.75, 0),
            1.5,
            0xffff00
        );
        directionArrow.name = 'direction-indicator';
        this.model.add(directionArrow);
        
        // Add model to scene
        if (this.scene) {
            this.scene.add(this.model);
            console.log("Test player model added to scene at position:", this.model.position);
        } else {
            throw new Error('Cannot add model to scene - scene is null');
        }
        
        return this.model;
    }
    
    /**
     * Create a rifle model and add it to the player
     */
    createRifle() {
        console.log('Creating rifle for test player model');
        
        // Create a detailed rifle if game method exists, otherwise create a simple one
        let rifle = null;
        
        if (this.game && typeof this.game.createSimpleWeaponModel === 'function') {
            try {
                rifle = this.game.createSimpleWeaponModel();
                console.log('Created rifle using game.createSimpleWeaponModel');
            } catch (error) {
                console.error('Error creating rifle from game method:', error);
            }
        }
        
        // If we couldn't create a detailed rifle, create a simple one
        if (!rifle) {
            console.log('Creating simple rifle model');
            rifle = new THREE.Group();
            
            // Rifle body
            const rifleBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 1.2),
                new THREE.MeshLambertMaterial({ color: 0x5c2e00 })
            );
            rifleBody.position.z = 0.6;
            rifle.add(rifleBody);
            
            // Rifle barrel
            const rifleBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            rifleBarrel.rotation.x = Math.PI / 2;
            rifleBarrel.position.z = 1.1;
            rifle.add(rifleBarrel);
        }
        
        // Name and add the rifle
        rifle.name = 'playerModelRifle';
        
        // Position for aiming down sights
        rifle.position.set(0, 1.4, -0.3);
        
        // Add to model
        if (this.model) {
            this.model.add(rifle);
            console.log('Rifle added to test player model');
        } else {
            throw new Error('Cannot add rifle - model is null');
        }
        
        return rifle;
    }
    
    /**
     * Update the test player rotation
     * - Continuously rotate horizontally 360 degrees
     * - Continuously look up and down
     * - Always aim down sights
     */
    update(delta) {
        if (!this.model) {
            console.warn('Cannot update TestPlayerRotation - model is null');
            return;
        }
        
        // Use actual delta time for smoother animation
        const actualDelta = Math.min(delta, 0.1); // Cap delta to avoid large jumps
        
        // Update elapsed time
        this.timeElapsed += actualDelta;
        
        // 1. Update horizontal rotation (continuous 360 degrees)
        // Use a smooth sine-based rotation to simulate natural motion
        const targetRotY = (this.timeElapsed * this.rotationSpeed) % (Math.PI * 2);
        
        // Apply smoothing to horizontal rotation
        this.rotation.y = this.smoothRotation(this.rotation.y, targetRotY, this.smoothingFactor);
        
        // 2. Update vertical rotation (look up and down)
        // Use sine function for continuous smooth oscillation between up and down
        this.lookCycle += this.lookCycleSpeed * actualDelta;
        if (this.lookCycle > Math.PI * 2) {
            this.lookCycle -= Math.PI * 2;
        }
        
        // Calculate target pitch using a sine wave for smooth transitions at the extremes
        const targetRotX = Math.sin(this.lookCycle) * (this.maxPitch - this.minPitch) / 2;
        
        // Apply smoothing to vertical rotation
        this.rotation.x = this.smoothRotation(this.rotation.x, targetRotX, this.smoothingFactor);
        
        // 3. Update the model's orientation - handles base model rotation and rifle positioning
        this.updateModelOrientation();
        
        // 4. Base arm positioning (vertical adjustments are now handled in updateRifleForVerticalLook)
        // Only call this occasionally to set the base positions
        if (this.game && this.game.frameCounter % 100 === 0) {
            this.updateArmsForAiming();
        }
        
        // Save current rotation for next frame smoothing
        this.prevRotation.x = this.rotation.x;
        this.prevRotation.y = this.rotation.y;
        
        // Log rotation values occasionally
        if (this.game && this.game.frameCounter % 60 === 0) {
            console.log('Test Player Rotation:', {
                x: THREE.MathUtils.radToDeg(this.rotation.x).toFixed(2) + '°',
                y: THREE.MathUtils.radToDeg(this.rotation.y).toFixed(2) + '°'
            });
        }
    }
    
    /**
     * Smooth rotation between values
     */
    smoothRotation(current, target, smoothFactor) {
        // Handle the special case of wrapping around 2π
        if (Math.abs(target - current) > Math.PI) {
            // Adjust the current value to avoid the discontinuity
            if (target > current) {
                current += Math.PI * 2;
            } else {
                target += Math.PI * 2;
            }
        }
        
        // Apply smoothing
        const smoothed = current * smoothFactor + target * (1 - smoothFactor);
        
        // Keep the result in [0, 2π]
        return smoothed % (Math.PI * 2);
    }
    
    /**
     * Update the model's orientation based on rotation
     */
    updateModelOrientation() {
        if (!this.model) return;
        
        // Calculate forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        
        // Create quaternion from player rotation
        const playerQuaternion = new THREE.Quaternion();
        playerQuaternion.setFromEuler(this.rotation);
        
        // Apply rotation to forward vector
        forward.applyQuaternion(playerQuaternion);
        
        // Store current position and original rotation
        const modelPosition = this.model.position.clone();
        
        // FIXED: Instead of using lookAt, we'll apply the quaternion directly to allow for full 360 rotation
        // This avoids the lookAt limitations that can cause the 180-degree view restriction
        
        // Reset model rotation first (important to start from clean state)
        this.model.rotation.set(0, 0, 0);
        
        // Create a new quaternion for the model's orientation
        // We only want the Y component of the rotation (horizontal) to keep the model upright
        const modelQuaternion = new THREE.Quaternion();
        modelQuaternion.setFromEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        // Apply the rotation to the model
        this.model.quaternion.copy(modelQuaternion);
        
        // Flip model 180 degrees (model faces opposite direction by default)
        this.model.rotateY(Math.PI);
        
        // IMPORTANT: Now that we're using quaternions directly, we don't need to force x/z to zero
        
        // Restore position
        this.model.position.copy(modelPosition);
        
        // Now update rifle rotation separately based on vertical look
        this.updateRifleForVerticalLook(forward.y);
        
        // Update direction indicator
        const indicator = this.model.getObjectByName('direction-indicator');
        if (indicator) {
            indicator.setDirection(forward.normalize());
        }
        
        // Log rotation occasionally for debugging
        if (this.game && this.game.frameCounter % 240 === 0) {
            console.log(`DEBUG: Model rotation: ${THREE.MathUtils.radToDeg(this.model.rotation.y).toFixed(2)}°`);
            console.log(`DEBUG: Player rotation: ${THREE.MathUtils.radToDeg(this.rotation.y).toFixed(2)}°`);
        }
    }
    
    /**
     * Update arm positions for aiming down sights
     */
    updateArmsForAiming() {
        // This method is now only used for initial positioning
        // Vertical adjustments are handled by updateRifleForVerticalLook
        if (!this.model) return;
        
        // Get references to arm parts
        const leftArm = this.model.getObjectByName('leftArm');
        const rightArm = this.model.getObjectByName('rightArm');
        
        // Base position arms for aiming
        if (leftArm) {
            // Base rotation - will be modified by updateRifleForVerticalLook
            leftArm.rotation.set(
                -Math.PI / 4, // Raise arm up
                0,
                Math.PI / 8   // Angle slightly inward
            );
            // Move left arm forward to support rifle
            leftArm.position.set(0.3, 1.3, -0.2);
        }
        
        if (rightArm) {
            // Base rotation - will be modified by updateRifleForVerticalLook
            rightArm.rotation.set(
                -Math.PI / 3, // Raise arm up more for trigger hand
                0,
                -Math.PI / 8  // Angle slightly inward
            );
            // Move right arm to trigger position
            rightArm.position.set(-0.3, 1.3, -0.1);
        }
    }
    
    /**
     * Update rifle and arms based on vertical look angle
     * This matches the implementation in the main game's Player class
     */
    updateRifleForVerticalLook(verticalLookFactor) {
        if (!this.model) return;
        
        // Find the rifle in the player model
        const rifle = this.model.getObjectByName('playerModelRifle');
        if (!rifle) return;
        
        // Calculate pitch angle for the rifle based on vertical look factor
        // verticalLookFactor is the y component of the forward vector, ranging from -1 to 1
        // We'll convert this to an angle within reasonable limits
        const pitchAngle = Math.asin(Math.max(-0.7, Math.min(0.7, verticalLookFactor)));
        
        // Apply the pitch rotation to the rifle
        // We keep existing Y and Z rotation but modify X for up/down
        const currentYRotation = rifle.rotation.y;
        const currentZRotation = rifle.rotation.z;
        
        // When aiming, the rifle should follow the look direction precisely
        rifle.rotation.set(
            pitchAngle,         // X rotation (pitch) - up/down
            currentYRotation,   // Y rotation (maintained from current)
            currentZRotation    // Z rotation (maintained from current)
        );
        
        // Also adjust arms to match the rifle's orientation
        const leftArm = this.model.getObjectByName('leftArm');
        const rightArm = this.model.getObjectByName('rightArm');
        
        if (leftArm && rightArm) {
            // Adjust arm rotations to follow the rifle pitch
            leftArm.rotation.x = -Math.PI / 4 + pitchAngle;
            rightArm.rotation.x = -Math.PI / 3 + pitchAngle;
        }
        
        // Debug logging occasionally
        if (this.game && this.game.frameCounter % 240 === 0) {
            console.log(`DEBUG: Test player rifle pitch adjusted:`, pitchAngle);
        }
    }
    
    /**
     * Set the position of the test player
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.model) {
            this.model.position.set(x, y, z);
        }
    }
    
    /**
     * Remove the test player from the scene
     */
    dispose() {
        if (this.scene && this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }
    }
}

export default TestPlayerRotation; 