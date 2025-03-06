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
        
        // Initialize UI elements
        if (this.ironSights) {
            this.ironSights.style.display = 'none';
            this.ironSights.style.opacity = '0';
            console.log('Iron sights initialized:', this.ironSights);
        } else {
            console.error('Iron sights element not found!');
        }
        
        if (this.crosshair) {
            this.crosshair.style.display = 'block';
            this.crosshair.style.opacity = '1';
        }
        
        if (this.scopeOverlay) {
            this.scopeOverlay.style.display = 'none';
            this.scopeOverlay.style.opacity = '0';
        }
        
        // Log initial state of elements
        console.log('UI Elements initialized:', {
            scopeOverlay: !!this.scopeOverlay,
            ironSights: !!this.ironSights,
            crosshair: !!this.crosshair
        });
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
        
        // Toggle iron sights with proper z-index and visibility
        if (this.ironSights) {
            // Force display block first to ensure visibility
            this.ironSights.style.display = 'block';
            
            // Set opacity with a slight delay to ensure transition works
            setTimeout(() => {
                this.ironSights.style.opacity = isAiming ? '1' : '0';
                
                // Only hide after transition completes if not aiming
                if (!isAiming) {
                    setTimeout(() => {
                        this.ironSights.style.display = 'none';
                    }, 200);
                }
            }, 10);
            
            this.ironSights.style.zIndex = isAiming ? '99999' : '0';
        }
        
        // Toggle crosshair with fade
        if (this.crosshair) {
            this.crosshair.style.opacity = isAiming ? '0' : '1';
            setTimeout(() => {
                this.crosshair.style.display = isAiming ? 'none' : 'block';
            }, isAiming ? 200 : 0);
        }
        
        // Toggle scope overlay with fade
        if (this.scopeOverlay) {
            this.scopeOverlay.style.display = 'block';
            this.scopeOverlay.style.opacity = isAiming ? '1' : '0';
            if (!isAiming) {
                setTimeout(() => {
                    this.scopeOverlay.style.display = 'none';
                }, 200);
            }
        }
        
        // Add/remove aiming class to body for additional styling
        document.body.classList.toggle('aiming', isAiming);
        
        // Log state for debugging
        console.log('Toggling scope:', {
            isAiming,
            ironSights: {
                display: this.ironSights?.style.display,
                opacity: this.ironSights?.style.opacity,
                zIndex: this.ironSights?.style.zIndex
            },
            crosshair: this.crosshair?.style.display,
            scopeOverlay: this.scopeOverlay?.style.display
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
