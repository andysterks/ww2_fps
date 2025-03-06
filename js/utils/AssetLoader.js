// AssetLoader.js - Utility class for loading and managing game assets

class AssetLoader {
    constructor() {
        // Initialize asset storage objects
        this.textures = {};  // Store loaded textures
        this.models = {};    // Store loaded 3D models
        this.sounds = {};    // Store loaded audio files
        this.fonts = {};     // Store loaded fonts
        
        // Create loaders
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new THREE.GLTFLoader();
        this.audioLoader = new THREE.AudioLoader();
        this.fontLoader = new THREE.FontLoader();
        
        // For low-poly mode optimization
        this.lowPolyMode = true;
        
        // Flag to use placeholder assets when real assets are not available
        this.usePlaceholders = true;
    }
    
    /**
     * Load an asset of the specified type
     * @param {string} type - Type of asset ('texture', 'model', 'sound', 'font')
     * @param {string} name - Name to reference the asset by
     * @param {string} path - Path to the asset file
     * @returns {Promise} A promise that resolves when the asset is loaded
     */
    loadAsset(type, name, path) {
        switch (type) {
            case 'texture':
                return this.loadTexture(name, path);
            case 'model':
                return this.loadModel(name, path);
            case 'sound':
                return this.loadSound(name, path);
            case 'font':
                return this.loadFont(name, path);
            default:
                return Promise.reject(new Error(`Unknown asset type: ${type}`));
        }
    }
    
    /**
     * Load a texture
     * @param {string} name - Name to reference the texture by
     * @param {string} path - Path to the texture file
     * @returns {Promise} A promise that resolves when the texture is loaded
     */
    loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            // Try to load the texture from file
            this.textureLoader.load(
                path,
                (texture) => {
                    // Apply texture optimizations
                    texture.minFilter = THREE.NearestFilter;  // Use nearest filter for pixelated look and better performance
                    texture.magFilter = THREE.NearestFilter;
                    texture.anisotropy = 1;  // Disable anisotropic filtering for performance
                    texture.generateMipmaps = false;  // Disable mipmaps for performance
                    
                    this.textures[name] = texture;
                    resolve(texture);
                },
                undefined,  // onProgress callback not supported by TextureLoader
                (error) => {
                    console.warn(`Error loading texture ${name} from ${path}:`, error);
                    
                    // If placeholders are enabled, generate a placeholder texture
                    if (this.usePlaceholders) {
                        console.log(`Generating placeholder texture for ${name}`);
                        let texture;
                        
                        // Generate different placeholder textures based on name
                        if (name === 'ground') {
                            texture = TextureGenerator.generateGroundTexture();
                        } else if (name === 'sky') {
                            texture = TextureGenerator.generateSkyTexture();
                        } else if (name.includes('weapon') || name.includes('rifle')) {
                            texture = TextureGenerator.generateWeaponTexture();
                        } else if (name.includes('enemy')) {
                            texture = TextureGenerator.generateEnemyTexture();
                        } else if (name.includes('building')) {
                            texture = TextureGenerator.generateBuildingTexture(256, 256, 'brick');
                        } else {
                            // Default placeholder texture
                            texture = new THREE.Texture(this.createPlaceholderImage(name));
                            texture.needsUpdate = true;
                        }
                        
                        this.textures[name] = texture;
                        resolve(texture);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
    
    /**
     * Load a 3D model
     * @param {string} name - Name to reference the model by
     * @param {string} path - Path to the model file
     * @returns {Promise} A promise that resolves when the model is loaded
     */
    loadModel(name, path) {
        return new Promise((resolve, reject) => {
            // Try to load the model from file
            this.gltfLoader.load(
                path,
                (gltf) => {
                    // Apply model optimizations if in low poly mode
                    if (this.lowPolyMode) {
                        gltf.scene.traverse((child) => {
                            if (child.isMesh) {
                                // Simplify geometry
                                if (child.geometry) {
                                    child.geometry.dispose();
                                    child.geometry = new THREE.BufferGeometry().fromGeometry(child.geometry);
                                }
                                
                                // Simplify materials
                                if (child.material) {
                                    child.material.flatShading = true;
                                    child.material.needsUpdate = true;
                                }
                            }
                        });
                    }
                    
                    this.models[name] = gltf;
                    resolve(gltf);
                },
                (xhr) => {
                    // Optional: report loading progress
                    // console.log(`${name} model: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                (error) => {
                    console.warn(`Error loading model ${name} from ${path}:`, error);
                    
                    // If placeholders are enabled, generate a placeholder model
                    if (this.usePlaceholders) {
                        console.log(`Generating placeholder model for ${name}`);
                        const placeholderModel = this.createPlaceholderModel(name);
                        this.models[name] = placeholderModel;
                        resolve(placeholderModel);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
    
    /**
     * Load a sound file
     * @param {string} name - Name to reference the sound by
     * @param {string} path - Path to the sound file
     * @returns {Promise} A promise that resolves when the sound is loaded
     */
    loadSound(name, path) {
        return new Promise((resolve, reject) => {
            // Try to load the sound from file
            this.audioLoader.load(
                path,
                (buffer) => {
                    this.sounds[name] = buffer;
                    resolve(buffer);
                },
                (xhr) => {
                    // Optional: report loading progress
                    // console.log(`${name} sound: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                (error) => {
                    console.warn(`Error loading sound ${name} from ${path}:`, error);
                    
                    // If placeholders are enabled, generate a placeholder sound
                    if (this.usePlaceholders) {
                        console.log(`Using placeholder sound for ${name}`);
                        // Create an empty audio buffer as placeholder
                        const context = new (window.AudioContext || window.webkitAudioContext)();
                        const placeholderBuffer = context.createBuffer(2, 44100, 44100);
                        this.sounds[name] = placeholderBuffer;
                        resolve(placeholderBuffer);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
    
    /**
     * Load a font file
     * @param {string} name - Name to reference the font by
     * @param {string} path - Path to the font file
     * @returns {Promise} A promise that resolves when the font is loaded
     */
    loadFont(name, path) {
        return new Promise((resolve, reject) => {
            this.fontLoader.load(
                path,
                (font) => {
                    this.fonts[name] = font;
                    resolve(font);
                },
                undefined,  // onProgress callback not supported by FontLoader
                (error) => {
                    console.error(`Error loading font ${name}:`, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Get a loaded texture by name
     * @param {string} name - Name of the texture to get
     * @returns {THREE.Texture} The requested texture
     */
    getTexture(name) {
        if (!this.textures[name]) {
            console.warn(`Texture ${name} not found`);
            return null;
        }
        return this.textures[name];
    }
    
    /**
     * Get a loaded model by name
     * @param {string} name - Name of the model to get
     * @returns {Object} The requested model
     */
    getModel(name) {
        if (!this.models[name]) {
            console.warn(`Model ${name} not found`);
            return null;
        }
        return this.models[name];
    }
    
    /**
     * Get a loaded sound by name
     * @param {string} name - Name of the sound to get
     * @returns {AudioBuffer} The requested sound
     */
    getSound(name) {
        if (!this.sounds[name]) {
            console.warn(`Sound ${name} not found`);
            return null;
        }
        return this.sounds[name];
    }
    
    /**
     * Get a loaded font by name
     * @param {string} name - Name of the font to get
     * @returns {Font} The requested font
     */
    getFont(name) {
        if (!this.fonts[name]) {
            console.warn(`Font ${name} not found`);
            return null;
        }
        return this.fonts[name];
    }
    
    /**
     * Create a clone of a model
     * @param {string} name - Name of the model to clone
     * @returns {THREE.Object3D} A clone of the requested model
     */
    createModelInstance(name) {
        const model = this.getModel(name);
        if (!model) return null;
        
        if (model.scene) {
            return model.scene.clone();
        } else if (model.isGroup || model.isObject3D) {
            return model.clone();
        }
        
        return null;
    }
    
    /**
     * Create a placeholder image with text
     * @param {string} text - Text to display on the placeholder
     * @returns {HTMLCanvasElement} Canvas element with placeholder image
     */
    createPlaceholderImage(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Fill with checkerboard pattern
        const tileSize = 32;
        for (let x = 0; x < canvas.width; x += tileSize) {
            for (let y = 0; y < canvas.height; y += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                context.fillStyle = isEven ? '#FF00FF' : '#00FFFF';
                context.fillRect(x, y, tileSize, tileSize);
            }
        }
        
        // Add text
        context.fillStyle = '#000000';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`Missing: ${text}`, canvas.width / 2, canvas.height / 2);
        
        return canvas;
    }
    
    /**
     * Create a placeholder model
     * @param {string} name - Name of the model to create a placeholder for
     * @returns {Object} Placeholder model object
     */
    createPlaceholderModel(name) {
        let model;
        
        // Create different placeholder models based on name using ModelGenerator
        if (name === 'player' || name.includes('player')) {
            // Player placeholder using ModelGenerator
            model = ModelGenerator.generateCharacter({
                isEnemy: false,
                color: 0x1E3F8A, // Blue for player
                hasHelmet: true,
                hasWeapon: true
            });
        } else if (name === 'enemy' || name.includes('enemy')) {
            // Enemy placeholder using ModelGenerator
            model = ModelGenerator.generateCharacter({
                isEnemy: true,
                color: 0x4F5F43, // Green for enemies
                hasHelmet: true,
                hasWeapon: true
            });
        } else if (name === 'rifle' || name.includes('weapon')) {
            // Weapon placeholder using ModelGenerator
            model = ModelGenerator.generateWeapon({
                type: name.includes('rifle') ? 'rifle' : 'pistol',
                color: 0x8B4513 // Brown
            });
        } else if (name.includes('building')) {
            // Building placeholder using ModelGenerator
            const damaged = name.includes('damaged') || name.includes('ruin');
            const type = name.includes('house') ? 'house' : 'building';
            
            model = ModelGenerator.generateBuilding({
                type: type,
                width: 10,
                height: 8,
                depth: 10,
                color: 0xA52A2A, // Brown
                damaged: damaged
            });
        } else if (name.includes('barrel')) {
            // Barrel placeholder
            model = ModelGenerator.generateProp({
                type: 'barrel',
                color: 0x8B4513 // Brown
            });
        } else if (name.includes('crate')) {
            // Crate placeholder
            model = ModelGenerator.generateProp({
                type: 'crate',
                color: 0x8B4513 // Brown
            });
        } else if (name.includes('sandbag')) {
            // Sandbag placeholder
            model = ModelGenerator.generateProp({
                type: 'sandbag'
            });
        } else {
            // Default placeholder (white cube)
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true });
            model = new THREE.Mesh(geometry, material);
        }
        
        // Create a group to mimic GLTF structure if the model isn't already a group
        let group;
        if (model.isGroup) {
            group = model;
        } else {
            group = new THREE.Group();
            group.add(model);
        }
        
        // Create a placeholder object that mimics a GLTF result
        return {
            scene: group,
            isPlaceholder: true
        };
    }
} 