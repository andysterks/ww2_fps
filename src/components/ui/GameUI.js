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

        // Ensure iron sights are visible
        if (this.ironSights) {
            this.ironSights.style.opacity = '1';
            this.ironSights.style.display = 'block';
        }

        // Hide crosshair initially since we're showing iron sights
        if (this.crosshair) {
            this.crosshair.style.display = 'none';
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
        
        // Toggle scope overlay and iron sights
        if (this.scopeOverlay) {
            this.scopeOverlay.style.display = isAiming ? 'block' : 'none';
        }
        
        // Toggle iron sights
        if (this.ironSights) {
            this.ironSights.style.display = isAiming ? 'block' : 'none';
        }
        
        // Add/remove aiming class to body for additional styling
        document.body.classList.toggle('aiming', isAiming);
        
        // Log state for debugging
        console.log('Toggling scope:', {
            isAiming,
            scopeOverlay: this.scopeOverlay?.style.display,
            ironSights: this.ironSights?.style.display,
            crosshair: 'hidden'
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
