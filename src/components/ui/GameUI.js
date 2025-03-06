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
        this.frontPost = document.getElementById('front-post');
        this.rearSight = document.getElementById('rear-sight');
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
        
        // Initialize UI elements with detailed logging
        console.log('Iron sights elements:', {
            ironSights: this.ironSights,
            frontPost: this.frontPost,
            rearSight: this.rearSight
        });
        
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
        console.log('TOGGLE SCOPE CALLED with isAiming:', isAiming);
        
        // Direct approach to toggle iron sights
        if (this.ironSights) {
            if (isAiming) {
                // Show iron sights immediately when aiming
                this.ironSights.style.display = 'block';
                this.ironSights.style.opacity = '1';
                this.ironSights.style.zIndex = '99999';
                
                // Force browser to recognize the change
                void this.ironSights.offsetWidth;
                
                console.log('SHOWING IRON SIGHTS:', {
                    display: this.ironSights.style.display,
                    opacity: this.ironSights.style.opacity,
                    zIndex: this.ironSights.style.zIndex
                });
            } else {
                // Hide iron sights when not aiming
                this.ironSights.style.opacity = '0';
                setTimeout(() => {
                    this.ironSights.style.display = 'none';
                }, 200);
                
                console.log('HIDING IRON SIGHTS');
            }
        } else {
            console.error('Iron sights element not available for toggle!');
        }
        
        // Toggle crosshair
        if (this.crosshair) {
            if (isAiming) {
                this.crosshair.style.opacity = '0';
                setTimeout(() => {
                    this.crosshair.style.display = 'none';
                }, 200);
            } else {
                this.crosshair.style.display = 'block';
                setTimeout(() => {
                    this.crosshair.style.opacity = '1';
                }, 10);
            }
        }
        
        // Toggle scope overlay
        if (this.scopeOverlay) {
            if (isAiming) {
                this.scopeOverlay.style.display = 'block';
                setTimeout(() => {
                    this.scopeOverlay.style.opacity = '1';
                }, 10);
            } else {
                this.scopeOverlay.style.opacity = '0';
                setTimeout(() => {
                    this.scopeOverlay.style.display = 'none';
                }, 200);
            }
        }
        
        // Add/remove aiming class to body
        if (isAiming) {
            document.body.classList.add('aiming');
        } else {
            document.body.classList.remove('aiming');
        }
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
