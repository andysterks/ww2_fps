class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
    }
    
    async init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // Load sounds
            await Promise.all([
                this.loadSound('gunshot', '/sounds/m1_garand_shot.mp3'),
                this.loadSound('reload', '/sounds/m1_garand_reload.mp3'),
                this.loadSound('ping', '/sounds/m1_garand_ping.mp3'),
                this.loadSound('empty', '/sounds/empty_click.mp3')
            ]);
            
            this.isInitialized = true;
            console.log('Audio manager initialized successfully');
        } catch (error) {
            console.error('Error initializing audio manager:', error);
        }
    }
    
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
            console.log(`Loaded sound: ${name}`);
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
        }
    }
    
    playSound(name, options = {}) {
        if (!this.isInitialized) {
            console.warn('Audio manager not initialized');
            return;
        }
        
        const sound = this.sounds.get(name);
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return;
        }
        
        // Create source node
        const source = this.audioContext.createBufferSource();
        source.buffer = sound;
        
        // Create gain node for this sound
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume || 1;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Play sound
        source.start(0);
        
        return source;
    }
    
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    toggleMute() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterGain.gain.value > 0 ? 0 : 1;
            return this.masterGain.gain.value > 0;
        }
        return false;
    }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager; 