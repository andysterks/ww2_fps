class AudioManager {
    constructor() {
        this.sounds = {};
        this.audioElements = {}; // Using HTML5 Audio elements as fallback
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
        this.muted = false;
        this.pendingUserInteraction = true; // Flag to track if we're waiting for user interaction
        this.preloadedSounds = false; // Flag to track if sounds have been preloaded
        this.currentlyPlaying = {}; // Track currently playing sounds to avoid overlaps
        
        // Sound files with descriptions for better debugging
        this.soundFiles = {
            'gunshot': { path: './sounds/m1_garand_shot.mp3', description: 'M1 Garand gunshot' },
            'empty': { path: './sounds/empty_click.mp3', description: 'Empty gun click' },
            'reload': { path: './sounds/m1_garand_reload.mp3', description: 'M1 Garand reload' },
            'ping': { path: './sounds/m1_garand_ping.mp3', description: 'M1 Garand ping' }
            // We're now using the converted MP3 file directly as 'gunshot'
        };
    }

    init() {
        console.log('Initializing audio system');
        
        try {
            // Try to create Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Created audio context, state:', this.audioContext.state);
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.7; // Default volume at 70%
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.error('Could not create audio context:', e);
            // We'll fall back to HTML5 Audio
        }
        
        // Setup HTML5 Audio elements as fallback
        this.preloadSounds();
        
        // Add event listeners for user interaction to resume audio context
        const resumeAudioContext = () => {
            console.log('User interaction detected');
            this.pendingUserInteraction = false;
            
            if (this.audioContext && this.audioContext.state === 'suspended') {
                console.log('Trying to resume audio context');
                this.audioContext.resume().then(() => {
                    console.log('AudioContext resumed successfully');
                    this.initialized = true;
                }).catch(error => {
                    console.error('Failed to resume AudioContext:', error);
                });
            } else {
                this.initialized = true;
            }
            
            // Try to play a silent sound to unblock audio
            this.playTestSound();
        };
        
        // Listen for various user interactions
        ['click', 'touchstart', 'keydown', 'mousedown'].forEach(eventType => {
            document.addEventListener(eventType, resumeAudioContext, { once: true });
        });
        
        // Also add a regular click listener
        document.addEventListener('click', () => {
            if (this.pendingUserInteraction) {
                this.pendingUserInteraction = false;
                this.initialized = true;
                this.playTestSound();
            }
        });
        
        console.log('Audio system setup complete');
    }
    
    playTestSound() {
        // Play a silent sound to unblock audio
        try {
            const audio = new Audio();
            audio.volume = 0.01; // Almost silent
            audio.src = 'data:audio/mp3;base64,SUQzAwAAAAAAJlRJVDIAAAAZAAAAaHR0cDovL3d3dy5mcmVlc2Z4LmNvLnVrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            audio.play().then(() => {
                console.log('Test sound played successfully');
            }).catch(e => {
                console.warn('Could not play test sound:', e);
            });
        } catch (e) {
            console.error('Error playing test sound:', e);
        }
    }
    
    preloadSounds() {
        console.log('Preloading sounds...');
        
        // Preload all sounds defined in soundFiles
        Object.keys(this.soundFiles).forEach(name => {
            const sound = this.soundFiles[name];
            console.log(`Preloading ${name}: ${sound.description} from ${sound.path}`);
            
            // Check if the file exists by making a HEAD request
            fetch(sound.path, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        console.error(`Sound file not found: ${sound.path}`);
                        return;
                    }
                    console.log(`Sound file exists: ${sound.path}`);
                    
                    // Load using Web Audio API
                    this.loadSound(name, sound.path);
                    
                    // Also create HTML5 Audio elements as fallback
                    try {
                        const audio = new Audio(sound.path);
                        audio.preload = 'auto';
                        this.audioElements[name] = audio;
                        console.log(`Created HTML5 Audio element for ${name}`);
                        
                        // Add event listeners for debugging
                        audio.addEventListener('canplaythrough', () => {
                            console.log(`${name} can play through`);
                        });
                        audio.addEventListener('error', (e) => {
                            console.error(`Error loading ${name}:`, e);
                        });
                    } catch (e) {
                        console.error(`Could not create Audio element for ${name}:`, e);
                    }
                })
                .catch(error => {
                    console.error(`Error checking sound file ${sound.path}:`, error);
                });
        });
        
        this.preloadedSounds = true;
    }

    loadSound(name, url) {
        if (!this.audioContext) {
            console.log(`No audio context available for ${name}, will use HTML5 Audio fallback`);
            return;
        }
        
        console.log(`Loading sound via Web Audio API: ${name} from ${url}`);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    console.warn(`Failed to load sound: ${url} - Status: ${response.status}`);
                    return null;
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                if (arrayBuffer) {
                    console.log(`Decoding audio data for ${name}, size: ${arrayBuffer.byteLength} bytes`);
                    return this.audioContext.decodeAudioData(arrayBuffer);
                }
                return null;
            })
            .then(audioBuffer => {
                if (audioBuffer) {
                    console.log(`Successfully decoded ${name}, duration: ${audioBuffer.duration}s`);
                    this.sounds[name] = audioBuffer;
                }
            })
            .catch(error => {
                console.error(`Error loading sound ${name}:`, error);
            });
    }

    play(name, options = {}) {
        console.log(`Attempting to play sound: ${name}`);
        
        // Check if sound file is defined
        if (!this.soundFiles[name]) {
            console.error(`Sound not defined in soundFiles: ${name}`);
            return null;
        }
        
        if (this.muted) {
            console.log(`Sound muted: ${name}`);
            return null;
        }
        
        // Special handling for reload sound to prevent overlapping
        if (name === 'reload' && this.currentlyPlaying['reload']) {
            console.log('Reload sound already playing, stopping previous instance');
            this.currentlyPlaying['reload'].stop();
            delete this.currentlyPlaying['reload'];
        }
        
        // Try to play using HTML5 Audio as the primary method
        if (this.audioElements[name]) {
            try {
                const audio = this.audioElements[name];
                console.log(`Playing ${name} using HTML5 Audio`);
                
                // Reset the audio element
                audio.currentTime = 0;
                audio.volume = options.volume !== undefined ? options.volume : 1;
                audio.loop = !!options.loop;
                
                // Play the sound
                const playPromise = audio.play();
                
                const soundController = {
                    stop: () => {
                        try {
                            audio.pause();
                            audio.currentTime = 0;
                            if (this.currentlyPlaying[name] === soundController) {
                                delete this.currentlyPlaying[name];
                            }
                        } catch (e) {
                            console.warn(`Error stopping ${name}:`, e);
                        }
                    }
                };
                
                // Track currently playing sound
                this.currentlyPlaying[name] = soundController;
                
                // Add ended event to clean up
                audio.addEventListener('ended', () => {
                    if (this.currentlyPlaying[name] === soundController) {
                        delete this.currentlyPlaying[name];
                    }
                }, { once: true });
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log(`${name} started playing successfully`);
                    }).catch(error => {
                        console.error(`Error playing ${name}:`, error);
                        delete this.currentlyPlaying[name];
                        this.playWithWebAudio(name, options); // Fallback to Web Audio API
                    });
                }
                
                return soundController;
            } catch (e) {
                console.error(`Error with HTML5 Audio for ${name}:`, e);
                delete this.currentlyPlaying[name];
            }
        }
        
        // Fallback to Web Audio API
        return this.playWithWebAudio(name, options);
    }
    
    playWithWebAudio(name, options = {}) {
        // If we don't have Web Audio API available or initialized
        if (!this.audioContext || this.pendingUserInteraction || !this.initialized) {
            console.warn(`Web Audio API not available for ${name}`);
            return null;
        }
        
        // If audio context is suspended, try to resume it
        if (this.audioContext.state === 'suspended') {
            console.log('Resuming suspended audio context');
            this.audioContext.resume().catch(error => {
                console.error('Failed to resume AudioContext:', error);
            });
        }
        
        // Special handling for reload sound to prevent overlapping
        if (name === 'reload' && this.currentlyPlaying['reload']) {
            console.log('Reload sound already playing, stopping previous instance');
            this.currentlyPlaying['reload'].stop();
            delete this.currentlyPlaying['reload'];
        }
        
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound buffer not loaded: ${name}`);
            return null;
        }
        
        console.log(`Playing ${name} using Web Audio API`);
        
        try {
            // Create source node
            const source = this.audioContext.createBufferSource();
            source.buffer = sound;
            
            // Create gain node for this sound
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = options.volume !== undefined ? options.volume : 1;
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Apply options
            if (options.loop) {
                source.loop = true;
            }
            
            // Create sound controller
            const soundController = {
                source,
                gainNode,
                stop: () => {
                    try {
                        source.stop();
                        if (this.currentlyPlaying[name] === soundController) {
                            delete this.currentlyPlaying[name];
                        }
                    } catch (e) {
                        // Ignore errors if sound already stopped
                    }
                }
            };
            
            // Track currently playing sound
            this.currentlyPlaying[name] = soundController;
            
            // Add ended event to clean up
            source.onended = () => {
                if (this.currentlyPlaying[name] === soundController) {
                    delete this.currentlyPlaying[name];
                }
            };
            
            // Play sound
            source.start(0);
            console.log(`${name} started playing via Web Audio API`);
            
            return soundController;
        } catch (e) {
            console.error(`Error playing ${name} with Web Audio API:`, e);
            delete this.currentlyPlaying[name];
            return null;
        }
    }

    setVolume(volume) {
        if (!this.initialized) return;
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    mute() {
        if (!this.initialized) return;
        this.muted = true;
        this.masterGain.gain.value = 0;
    }

    unmute() {
        if (!this.initialized) return;
        this.muted = false;
        this.masterGain.gain.value = 0.7;
    }

    toggleMute() {
        if (this.muted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.muted;
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Export both the class and the singleton instance
export { AudioManager, audioManager };
