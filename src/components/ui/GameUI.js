import { audioManager } from '../../audio.js';

/**
 * GameUI class handles all user interface elements
 */
class GameUI {
    constructor() {
        // Get UI elements
        this.crosshair = document.getElementById('crosshair');
        this.scopeOverlay = document.getElementById('scope-overlay');
        this.ironSights = document.getElementById('iron-sights');
        this.ammoDisplay = document.getElementById('ammo');
        this.healthDisplay = document.getElementById('health');
        this.instructions = document.getElementById('instructions');
        this.soundToggle = document.getElementById('sound-toggle');
        this.audioStatus = document.getElementById('audio-status');
        this.debugInfo = document.getElementById('debug-info');
        
        // Initialize state
        this.isAiming = false;
        this.ammo = 8;
        this.maxAmmo = 8;
        this.health = 100;
        this.isMuted = false;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Log initial state of elements
        console.log('UI Elements initialized:', {
            scopeOverlay: !!this.scopeOverlay,
            ironSights: !!this.ironSights,
            crosshair: !!this.crosshair
        });

        // Ensure iron sights are initially hidden
        if (this.ironSights) {
            this.ironSights.style.opacity = '0';
            this.ironSights.style.display = 'block';
        }
    }
    
    setupEventListeners() {
        // Handle sound toggle
        this.soundToggle.addEventListener('click', () => {
            this.toggleSound();
        });
    }
    
    toggleSound() {
        this.isMuted = !this.isMuted;
        this.soundToggle.textContent = this.isMuted ? '🔇' : '🔊';
        this.soundToggle.className = this.isMuted ? 'sound-off' : 'sound-on';
    }
    
    toggleScope(isAiming) {
        this.isAiming = isAiming;
        
        // Toggle scope overlay
        if (this.scopeOverlay) {
            this.scopeOverlay.style.display = isAiming ? 'block' : 'none';
        }
        
        // Toggle crosshair
        if (this.crosshair) {
            this.crosshair.style.display = isAiming ? 'none' : 'block';
        }
        
        // Toggle iron sights with opacity for smooth transition
        if (this.ironSights) {
            this.ironSights.style.opacity = isAiming ? '1' : '0';
        }
        
        // Add/remove aiming class to body for additional styling
        document.body.classList.toggle('aiming', isAiming);
        
        // Log state for debugging
        console.log('Toggling scope:', {
            isAiming,
            scopeOverlay: this.scopeOverlay?.style.display,
            ironSights: this.ironSights?.style.opacity,
            crosshair: this.crosshair?.style.display
        });
    }
    
    updateAmmo(current, max) {
        this.ammo = current;
        this.maxAmmo = max;
        this.ammoDisplay.textContent = `${current}/${max}`;
    }
    
    updateHealth(value) {
        this.health = value;
        this.healthDisplay.textContent = value;
    }
    
    showMessage(message, duration = 3000) {
        this.instructions.textContent = message;
        this.instructions.style.opacity = '1';
        
        setTimeout(() => {
            this.instructions.style.opacity = '0';
        }, duration);
    }
    
    showAudioPrompt() {
        this.audioStatus.style.display = 'block';
    }
    
    hideAudioPrompt() {
        this.audioStatus.style.display = 'none';
    }
    
    updateDebugInfo(info) {
        if (this.debugInfo) {
            this.debugInfo.innerHTML = info;
        }
    }
    
    showDebugInfo() {
        if (this.debugInfo) {
            this.debugInfo.style.display = 'block';
        }
    }
    
    hideDebugInfo() {
        if (this.debugInfo) {
            this.debugInfo.style.display = 'none';
        }
    }
}

export default GameUI;
