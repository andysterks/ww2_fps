import { audioManager } from '../../audio.js';

/**
 * GameUI class handles all user interface elements
 */
class GameUI {
    constructor() {
        // UI elements
        this.crosshair = null;
        this.ammoCounter = null;
        this.soundToggle = null;
        this.messageContainer = null;
        
        // Initialize UI
        this.init();
    }
    
    init() {
        // Create crosshair
        this.createCrosshair();
        
        // Create ammo counter
        this.createAmmoCounter();
        
        // Create sound toggle
        this.createSoundToggle();
        
        // Create message container
        this.createMessageContainer();
    }
    
    createCrosshair() {
        // Create crosshair element
        this.crosshair = document.createElement('div');
        this.crosshair.id = 'crosshair';
        this.crosshair.innerHTML = '+';
        this.crosshair.style.position = 'absolute';
        this.crosshair.style.top = '50%';
        this.crosshair.style.left = '50%';
        this.crosshair.style.transform = 'translate(-50%, -50%)';
        this.crosshair.style.color = 'white';
        this.crosshair.style.fontSize = '24px';
        this.crosshair.style.fontWeight = 'bold';
        this.crosshair.style.textShadow = '1px 1px 1px rgba(0, 0, 0, 0.5)';
        this.crosshair.style.userSelect = 'none';
        this.crosshair.style.pointerEvents = 'none';
        
        // Add to document
        document.body.appendChild(this.crosshair);
    }
    
    createAmmoCounter() {
        // Create ammo counter element
        this.ammoCounter = document.createElement('div');
        this.ammoCounter.id = 'ammo-counter';
        this.ammoCounter.style.position = 'absolute';
        this.ammoCounter.style.bottom = '20px';
        this.ammoCounter.style.right = '20px';
        this.ammoCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.ammoCounter.style.color = 'white';
        this.ammoCounter.style.padding = '10px 15px';
        this.ammoCounter.style.borderRadius = '5px';
        this.ammoCounter.style.fontFamily = 'monospace';
        this.ammoCounter.style.fontSize = '24px';
        this.ammoCounter.style.fontWeight = 'bold';
        this.ammoCounter.style.userSelect = 'none';
        this.ammoCounter.style.pointerEvents = 'none';
        
        // Set initial value
        this.updateAmmoCounter(8);
        
        // Add to document
        document.body.appendChild(this.ammoCounter);
    }
    
    createSoundToggle() {
        // Create sound toggle button
        this.soundToggle = document.createElement('button');
        this.soundToggle.id = 'sound-toggle';
        this.soundToggle.innerHTML = '🔊';
        this.soundToggle.style.position = 'absolute';
        this.soundToggle.style.top = '20px';
        this.soundToggle.style.right = '20px';
        this.soundToggle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.soundToggle.style.color = 'white';
        this.soundToggle.style.border = 'none';
        this.soundToggle.style.borderRadius = '5px';
        this.soundToggle.style.padding = '10px';
        this.soundToggle.style.fontSize = '20px';
        this.soundToggle.style.cursor = 'pointer';
        
        // Add event listener
        this.soundToggle.addEventListener('click', () => {
            const isMuted = audioManager.toggleMute();
            this.soundToggle.innerHTML = isMuted ? '🔇' : '🔊';
        });
        
        // Add to document
        document.body.appendChild(this.soundToggle);
    }
    
    createMessageContainer() {
        // Create message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.id = 'message-container';
        this.messageContainer.style.position = 'absolute';
        this.messageContainer.style.top = '50%';
        this.messageContainer.style.left = '50%';
        this.messageContainer.style.transform = 'translate(-50%, -50%)';
        this.messageContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.messageContainer.style.color = 'white';
        this.messageContainer.style.padding = '20px';
        this.messageContainer.style.borderRadius = '5px';
        this.messageContainer.style.textAlign = 'center';
        this.messageContainer.style.fontFamily = 'Arial, sans-serif';
        this.messageContainer.style.fontSize = '18px';
        this.messageContainer.style.display = 'none';
        this.messageContainer.style.userSelect = 'none';
        this.messageContainer.style.pointerEvents = 'none';
        
        // Add to document
        document.body.appendChild(this.messageContainer);
    }
    
    updateAmmoCounter(ammo) {
        if (this.ammoCounter) {
            this.ammoCounter.innerHTML = `Ammo: ${ammo}/8`;
            
            // Change color when low on ammo
            if (ammo <= 2) {
                this.ammoCounter.style.color = 'red';
            } else {
                this.ammoCounter.style.color = 'white';
            }
        }
    }
    
    updateCrosshair(isAiming, isAimingDownSights) {
        console.log('updateCrosshair called with:', { isAiming, isAimingDownSights });
        
        if (this.crosshair) {
            if (isAimingDownSights) {
                console.log('Setting crosshair for aiming down sights (hidden)');
                // Hide crosshair when aiming down sights
                this.crosshair.style.opacity = '0';
            } else if (isAiming) {
                console.log('Setting crosshair for regular aiming (small)');
                // Smaller crosshair when aiming
                this.crosshair.style.fontSize = '16px';
                this.crosshair.style.opacity = '0.8';
            } else {
                console.log('Setting crosshair for hip fire (normal)');
                // Normal crosshair
                this.crosshair.style.fontSize = '24px';
                this.crosshair.style.opacity = '1';
            }
        } else {
            console.error('Crosshair element is null or undefined');
        }
    }
    
    showMessage(message, duration = 3000) {
        if (this.messageContainer) {
            // Set message text
            this.messageContainer.innerHTML = message;
            
            // Show message
            this.messageContainer.style.display = 'block';
            
            // Hide after duration
            setTimeout(() => {
                this.messageContainer.style.display = 'none';
            }, duration);
        }
    }
    
    showControls() {
        const controlsMessage = `
            <h2>Controls</h2>
            <p>WASD - Move</p>
            <p>Shift - Sprint</p>
            <p>Right Click - Aim</p>
            <p>F - Aim Down Sights</p>
            <p>R - Reload</p>
            <p>Left Click - Shoot</p>
            <p>ESC - Exit pointer lock</p>
        `;
        
        this.showMessage(controlsMessage, 5000);
    }
    
    showGameStartMessage() {
        this.showMessage('Click to start game', 3000);
    }
}

export default GameUI;
