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
                    console.error(`Error loading texture ${name}:`, error);
                    reject(error);
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
            this.gltfLoader.load(
                path,
                (gltf) => {
                    // Apply model optimizations if in low poly mode
                    if (this.lowPolyMode) {
                        gltf.scene.traverse((child) => {
                            if (child.isMesh) {
                                // Simplify geometry
                                child.geometry.dispose();
                                child.geometry = new THREE.BufferGeometry().fromGeometry(child.geometry);
                                
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
                    console.error(`Error loading model ${name}:`, error);
                    reject(error);
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
                    console.error(`Error loading sound ${name}:`, error);
                    reject(error);
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
        
        return model.scene.clone();
    }
} 