// InputHandler.js - Utility class for handling user input

class InputHandler {
    constructor() {
        // Key state tracking
        this.keys = {
            forward: false,    // W key
            backward: false,   // S key
            left: false,       // A key
            right: false,      // D key
            jump: false,       // Space key
            sprint: false,     // Shift key
            reload: false,     // R key
            crouch: false,     // C key
            interact: false    // E key
        };
        
        // Mouse state tracking
        this.mouse = {
            x: 0,              // Mouse X position
            y: 0,              // Mouse Y position
            movementX: 0,      // Mouse X movement (for camera rotation)
            movementY: 0,      // Mouse Y movement (for camera rotation)
            leftButton: false, // Left mouse button state (for shooting)
            rightButton: false // Right mouse button state (for aiming)
        };
        
        // Touch state tracking for mobile devices
        this.touch = {
            active: false,     // Whether touch is currently active
            joystickStart: { x: 0, y: 0 },  // Starting position of virtual joystick
            joystickCurrent: { x: 0, y: 0 } // Current position of virtual joystick
        };
        
        // Pointer lock state
        this.isPointerLocked = false;
        
        // Sensitivity settings
        this.mouseSensitivity = 0.2;
        
        // Initialize event listeners
        this.initKeyboardListeners();
        this.initMouseListeners();
        this.initTouchListeners();
        
        // Reset mouse movement each frame to prevent continuous rotation
        this.resetMouseMovement = this.resetMouseMovement.bind(this);
        setInterval(this.resetMouseMovement, 16); // ~60fps
    }
    
    /**
     * Initialize keyboard event listeners
     */
    initKeyboardListeners() {
        // Key down event
        document.addEventListener('keydown', (event) => {
            this.updateKeyState(event.code, true);
        });
        
        // Key up event
        document.addEventListener('keyup', (event) => {
            this.updateKeyState(event.code, false);
        });
    }
    
    /**
     * Initialize mouse event listeners
     */
    initMouseListeners() {
        // Mouse move event
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                // Use movementX/Y for camera rotation when pointer is locked
                this.mouse.movementX += event.movementX * this.mouseSensitivity;
                this.mouse.movementY += event.movementY * this.mouseSensitivity;
            } else {
                // Track mouse position when pointer is not locked
                this.mouse.x = event.clientX;
                this.mouse.y = event.clientY;
            }
        });
        
        // Mouse down event
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                this.mouse.leftButton = true;
            } else if (event.button === 2) {
                this.mouse.rightButton = true;
            }
        });
        
        // Mouse up event
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.mouse.leftButton = false;
            } else if (event.button === 2) {
                this.mouse.rightButton = false;
            }
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * Initialize touch event listeners for mobile devices
     */
    initTouchListeners() {
        // Touch start event
        document.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            const touch = event.touches[0];
            this.touch.active = true;
            
            // Set joystick start position
            this.touch.joystickStart.x = touch.clientX;
            this.touch.joystickStart.y = touch.clientY;
            this.touch.joystickCurrent.x = touch.clientX;
            this.touch.joystickCurrent.y = touch.clientY;
            
            // If touch is on the right half of the screen, it's for looking
            if (touch.clientX > window.innerWidth / 2) {
                this.mouse.leftButton = true;
            }
        });
        
        // Touch move event
        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            const touch = event.touches[0];
            
            // Update joystick current position
            this.touch.joystickCurrent.x = touch.clientX;
            this.touch.joystickCurrent.y = touch.clientY;
            
            // If touch is on the left half of the screen, it's for movement
            if (touch.clientX < window.innerWidth / 2) {
                // Calculate joystick delta
                const deltaX = this.touch.joystickCurrent.x - this.touch.joystickStart.x;
                const deltaY = this.touch.joystickCurrent.y - this.touch.joystickStart.y;
                
                // Update movement keys based on joystick position
                this.keys.forward = deltaY < -20;
                this.keys.backward = deltaY > 20;
                this.keys.left = deltaX < -20;
                this.keys.right = deltaX > 20;
            } 
            // If touch is on the right half of the screen, it's for looking
            else {
                // Calculate touch movement for camera rotation
                const deltaX = touch.clientX - this.touch.joystickCurrent.x;
                const deltaY = touch.clientY - this.touch.joystickCurrent.y;
                
                this.mouse.movementX += deltaX * this.mouseSensitivity;
                this.mouse.movementY += deltaY * this.mouseSensitivity;
                
                // Update current position for next delta calculation
                this.touch.joystickCurrent.x = touch.clientX;
                this.touch.joystickCurrent.y = touch.clientY;
            }
        });
        
        // Touch end event
        document.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            this.touch.active = false;
            this.mouse.leftButton = false;
            
            // Reset movement keys
            this.keys.forward = false;
            this.keys.backward = false;
            this.keys.left = false;
            this.keys.right = false;
        });
    }
    
    /**
     * Update key state based on key code
     * @param {string} code - Key code from keyboard event
     * @param {boolean} isPressed - Whether the key is pressed or released
     */
    updateKeyState(code, isPressed) {
        switch (code) {
            case 'KeyW':
                this.keys.forward = isPressed;
                break;
            case 'KeyS':
                this.keys.backward = isPressed;
                break;
            case 'KeyA':
                this.keys.left = isPressed;
                break;
            case 'KeyD':
                this.keys.right = isPressed;
                break;
            case 'Space':
                this.keys.jump = isPressed;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = isPressed;
                break;
            case 'KeyR':
                this.keys.reload = isPressed;
                break;
            case 'KeyC':
                this.keys.crouch = isPressed;
                break;
            case 'KeyE':
                this.keys.interact = isPressed;
                break;
        }
    }
    
    /**
     * Reset mouse movement values
     * Called each frame to prevent continuous rotation
     */
    resetMouseMovement() {
        this.mouse.movementX = 0;
        this.mouse.movementY = 0;
    }
    
    /**
     * Get movement direction vector based on current key states
     * @returns {Object} Object with x and z components representing movement direction
     */
    getMovementDirection() {
        const direction = { x: 0, z: 0 };
        
        if (this.keys.forward) direction.z -= 1;
        if (this.keys.backward) direction.z += 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;
        
        // Normalize for diagonal movement
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }
        
        return direction;
    }
    
    /**
     * Get camera rotation based on mouse movement
     * @returns {Object} Object with x and y components representing rotation
     */
    getCameraRotation() {
        return {
            x: this.mouse.movementY,
            y: this.mouse.movementX
        };
    }
    
    /**
     * Check if player is trying to shoot
     * @returns {boolean} True if left mouse button is pressed
     */
    isShooting() {
        return this.mouse.leftButton;
    }
    
    /**
     * Check if player is trying to aim
     * @returns {boolean} True if right mouse button is pressed
     */
    isAiming() {
        return this.mouse.rightButton;
    }
    
    /**
     * Set mouse sensitivity
     * @param {number} sensitivity - New sensitivity value
     */
    setMouseSensitivity(sensitivity) {
        this.mouseSensitivity = sensitivity;
    }
} 