// Game.js - Main game controller class

class Game {
    constructor() {
        // Game state flags
        this.isInitialized = false;  // Whether the game has been initialized
        this.isRunning = false;      // Whether the game is currently running
        this.isPaused = false;       // Whether the game is paused
        
        // Performance optimization flags
        this.enableShadows = false;  // Disable shadows for better performance
        this.lowPolyMode = true;     // Use low poly models for better performance
        this.drawDistance = 1000;    // Limit draw distance for better performance
        
        // Debug mode
        this.debugMode = false;      // Whether debug mode is enabled
        this.showFPS = false;        // Whether to show FPS counter
        this.showColliders = false;  // Whether to show physics colliders
        this.fpsCounter = { value: 0, frames: 0, lastTime: 0 }; // FPS counter data
        
        // Game clock for timing
        this.clock = new THREE.Clock();
        
        // DOM element references
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingStatus = document.getElementById('loading-status');
        this.progressBar = document.querySelector('.progress-value');
        this.hudElement = document.getElementById('hud');
        this.gameOverScreen = document.getElementById('game-over');
        
        // Game components
        this.renderer = null;        // THREE.js renderer
        this.scene = null;           // THREE.js scene
        this.camera = null;          // Player camera
        this.world = null;           // Physics world
        this.player = null;          // Player entity
        this.assetLoader = null;     // Asset loader utility
        this.inputHandler = null;    // Input handler utility
        this.enemies = [];           // Array of enemy entities
        
        // Debug helpers
        this.debugHelpers = {
            colliders: [],           // Array of collider visualizations
            stats: null,             // Stats.js instance
            debugElement: null       // Debug info element
        };
        
        // Bind methods to this instance
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.toggleDebugMode = this.toggleDebugMode.bind(this);
    }
    
    /**
     * Initialize the game and load all necessary assets
     * @returns {Promise} A promise that resolves when initialization is complete
     */
    async init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Disable antialiasing for performance
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue color
        this.renderer.shadowMap.enabled = this.enableShadows;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 0, this.drawDistance); // Add fog for performance and atmosphere
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, this.drawDistance);
        this.scene.add(this.camera);
        
        // Initialize asset loader
        this.assetLoader = new AssetLoader();
        
        // Initialize input handler
        this.inputHandler = new InputHandler();
        
        // Initialize physics world
        this.world = new World(this.scene, this.assetLoader);
        
        // Set up window resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Initialize debug mode if needed
        this.initDebugMode();
        
        // Load assets
        try {
            await this.loadAssets();
            
            // Create player
            this.player = new Player(this.camera, this.world.physicsWorld, this.inputHandler, this.assetLoader);
            
            // Initialize world with player
            await this.world.init(this.player);
            
            // Spawn initial enemies
            this.spawnEnemies(5); // Start with 5 enemies
            
            this.isInitialized = true;
            return Promise.resolve();
        } catch (error) {
            console.error('Error during game initialization:', error);
            return Promise.reject(error);
        }
    }
    
    /**
     * Load all game assets with progress tracking
     * @returns {Promise} A promise that resolves when all assets are loaded
     */
    async loadAssets() {
        // Define assets to load
        const assets = [
            { type: 'texture', name: 'ground', path: 'assets/textures/ground.jpg' },
            { type: 'texture', name: 'sky', path: 'assets/textures/sky.jpg' },
            { type: 'model', name: 'player', path: 'assets/models/player.glb' },
            { type: 'model', name: 'enemy', path: 'assets/models/enemy.glb' },
            { type: 'model', name: 'rifle', path: 'assets/models/m1_garand.glb' },
            { type: 'model', name: 'building1', path: 'assets/models/building1.glb' },
            { type: 'model', name: 'building2', path: 'assets/models/building2.glb' },
            { type: 'sound', name: 'gunshot', path: 'assets/sounds/gunshot.mp3' },
            { type: 'sound', name: 'reload', path: 'assets/sounds/reload.mp3' },
            { type: 'sound', name: 'hit', path: 'assets/sounds/hit.mp3' }
        ];
        
        // Set up progress tracking
        let loaded = 0;
        const total = assets.length;
        
        // Load each asset
        for (const asset of assets) {
            try {
                this.loadingStatus.textContent = `Loading ${asset.name}...`;
                await this.assetLoader.loadAsset(asset.type, asset.name, asset.path);
                
                // Update progress
                loaded++;
                const progress = (loaded / total) * 100;
                this.progressBar.style.width = `${progress}%`;
            } catch (error) {
                console.error(`Failed to load asset ${asset.name}:`, error);
                throw error;
            }
        }
        
        this.loadingStatus.textContent = 'All assets loaded!';
    }
    
    /**
     * Start the game
     */
    start() {
        if (!this.isInitialized) {
            console.error('Cannot start game: not initialized');
            return;
        }
        
        // Hide loading screen
        this.loadingScreen.style.display = 'none';
        
        // Show HUD
        this.hudElement.classList.remove('hidden');
        
        // Start game loop
        this.isRunning = true;
        this.clock.start();
        this.gameLoop();
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.gameLoop);
        
        if (!this.isPaused) {
            const deltaTime = this.clock.getDelta();
            this.update(deltaTime);
            this.render();
        }
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update physics world
        this.world.update(deltaTime);
        
        // Update player
        this.player.update(deltaTime);
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player);
            
            // Remove dead enemies
            if (enemy.isDead) {
                this.scene.remove(enemy.mesh);
                this.enemies.splice(i, 1);
                
                // Spawn a new enemy to replace the dead one
                if (this.enemies.length < 5) {
                    this.spawnEnemies(1);
                }
            }
        }
        
        // Update HUD
        this.updateHUD();
        
        // Update debug info
        this.updateDebugInfo(deltaTime);
        
        // Check game over condition
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * Render the current game state
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Update the HUD with current player stats
     */
    updateHUD() {
        // Update health bar
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-value').style.width = `${healthPercent}%`;
        
        // Update ammo counter
        const currentWeapon = this.player.currentWeapon;
        if (currentWeapon) {
            document.getElementById('ammo-counter').textContent = 
                `${currentWeapon.currentAmmo}/${currentWeapon.reserveAmmo}`;
            document.getElementById('weapon-indicator').textContent = 
                currentWeapon.name;
        }
    }
    
    /**
     * Spawn a specified number of enemies at random positions
     * @param {number} count - Number of enemies to spawn
     */
    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            // Generate random position away from player
            let x, z;
            do {
                x = (Math.random() - 0.5) * 100;
                z = (Math.random() - 0.5) * 100;
            } while (Math.sqrt(x * x + z * z) < 20); // Ensure minimum distance from player
            
            const position = new THREE.Vector3(x, 1, z);
            
            // Create enemy
            const enemy = new Enemy(position, this.scene, this.world.physicsWorld, this.assetLoader);
            this.enemies.push(enemy);
        }
    }
    
    /**
     * Handle game over state
     */
    gameOver() {
        this.isPaused = true;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    /**
     * Restart the game after game over
     */
    restart() {
        // Reset player
        this.player.reset();
        
        // Remove all enemies
        for (const enemy of this.enemies) {
            this.scene.remove(enemy.mesh);
        }
        this.enemies = [];
        
        // Spawn new enemies
        this.spawnEnemies(5);
        
        // Reset game state
        this.isPaused = false;
        this.gameOverScreen.classList.add('hidden');
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    /**
     * Lock pointer controls for FPS camera
     */
    lockControls() {
        this.renderer.domElement.requestPointerLock();
    }
    
    /**
     * Handle pointer lock change event
     */
    handlePointerLockChange() {
        if (document.pointerLockElement === this.renderer.domElement) {
            this.inputHandler.isPointerLocked = true;
        } else {
            this.inputHandler.isPointerLocked = false;
            if (this.isRunning && !this.gameOverScreen.classList.contains('hidden')) {
                this.isPaused = true;
            }
        }
    }
    
    /**
     * Initialize debug mode
     */
    initDebugMode() {
        // Create debug info element
        this.debugHelpers.debugElement = document.createElement('div');
        this.debugHelpers.debugElement.id = 'debug-info';
        this.debugHelpers.debugElement.style.position = 'absolute';
        this.debugHelpers.debugElement.style.top = '10px';
        this.debugHelpers.debugElement.style.left = '10px';
        this.debugHelpers.debugElement.style.color = 'white';
        this.debugHelpers.debugElement.style.fontFamily = 'monospace';
        this.debugHelpers.debugElement.style.fontSize = '12px';
        this.debugHelpers.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.debugHelpers.debugElement.style.padding = '5px';
        this.debugHelpers.debugElement.style.borderRadius = '3px';
        this.debugHelpers.debugElement.style.display = 'none';
        document.getElementById('game-container').appendChild(this.debugHelpers.debugElement);
        
        // Add debug mode toggle key
        document.addEventListener('keydown', (event) => {
            if (event.key === '`') { // Backtick key
                this.toggleDebugMode();
            }
        });
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        // Show/hide debug info
        this.debugHelpers.debugElement.style.display = this.debugMode ? 'block' : 'none';
        
        // Show/hide colliders
        this.updateColliderVisibility();
        
        console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Update collider visibility based on debug mode
     */
    updateColliderVisibility() {
        // Clear existing collider visualizations
        for (const helper of this.debugHelpers.colliders) {
            this.scene.remove(helper);
        }
        this.debugHelpers.colliders = [];
        
        if (this.debugMode && this.showColliders) {
            // Add player collider visualization
            if (this.player && this.player.physicsBody) {
                const playerHelper = this.createColliderHelper(this.player.physicsBody, 0x00ff00);
                this.scene.add(playerHelper);
                this.debugHelpers.colliders.push(playerHelper);
            }
            
            // Add enemy collider visualizations
            for (const enemy of this.enemies) {
                if (enemy && enemy.physicsBody) {
                    const enemyHelper = this.createColliderHelper(enemy.physicsBody, 0xff0000);
                    this.scene.add(enemyHelper);
                    this.debugHelpers.colliders.push(enemyHelper);
                }
            }
            
            // Add world collider visualizations
            const worldObjects = this.world.getCollidableObjects();
            for (const obj of worldObjects) {
                if (obj && obj.body) {
                    const objHelper = this.createColliderHelper(obj.body, 0x0000ff);
                    this.scene.add(objHelper);
                    this.debugHelpers.colliders.push(objHelper);
                }
            }
        }
    }
    
    /**
     * Create a helper mesh to visualize a physics collider
     * @param {CANNON.Body} body - Physics body
     * @param {number} color - Color of the helper
     * @returns {THREE.Mesh} Helper mesh
     */
    createColliderHelper(body, color) {
        let geometry;
        
        // Create geometry based on shape type
        if (body.shapes[0] instanceof CANNON.Box) {
            const box = body.shapes[0];
            geometry = new THREE.BoxGeometry(
                box.halfExtents.x * 2,
                box.halfExtents.y * 2,
                box.halfExtents.z * 2
            );
        } else if (body.shapes[0] instanceof CANNON.Sphere) {
            const sphere = body.shapes[0];
            geometry = new THREE.SphereGeometry(sphere.radius, 16, 16);
        } else if (body.shapes[0] instanceof CANNON.Cylinder) {
            const cylinder = body.shapes[0];
            geometry = new THREE.CylinderGeometry(
                cylinder.radiusTop,
                cylinder.radiusBottom,
                cylinder.height,
                16
            );
        } else if (body.shapes[0] instanceof CANNON.Plane) {
            // For planes, create a large but thin box
            geometry = new THREE.BoxGeometry(100, 0.1, 100);
        } else {
            // Default to a small sphere for unknown shapes
            geometry = new THREE.SphereGeometry(0.5, 8, 8);
        }
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Set initial position and rotation
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
        
        // Store reference to body for updates
        mesh.userData.body = body;
        
        return mesh;
    }
    
    /**
     * Update debug info
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateDebugInfo(deltaTime) {
        if (!this.debugMode) return;
        
        // Update FPS counter
        this.fpsCounter.frames++;
        const now = performance.now();
        if (now - this.fpsCounter.lastTime >= 1000) {
            this.fpsCounter.value = Math.round(this.fpsCounter.frames * 1000 / (now - this.fpsCounter.lastTime));
            this.fpsCounter.frames = 0;
            this.fpsCounter.lastTime = now;
        }
        
        // Update collider positions
        for (const helper of this.debugHelpers.colliders) {
            const body = helper.userData.body;
            helper.position.copy(body.position);
            helper.quaternion.copy(body.quaternion);
        }
        
        // Update debug info text
        if (this.debugHelpers.debugElement) {
            let debugText = `FPS: ${this.fpsCounter.value}\n`;
            
            if (this.player) {
                const pos = this.player.physicsBody.position;
                debugText += `Player Position: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}\n`;
                debugText += `Health: ${this.player.health}/${this.player.maxHealth}\n`;
                
                if (this.player.currentWeapon) {
                    debugText += `Ammo: ${this.player.currentWeapon.currentAmmo}/${this.player.currentWeapon.magazineSize} (${this.player.currentWeapon.reserveAmmo} reserve)\n`;
                }
            }
            
            debugText += `Enemies: ${this.enemies.length}\n`;
            debugText += `Draw Distance: ${this.drawDistance}\n`;
            debugText += `Shadows: ${this.enableShadows ? 'ON' : 'OFF'}\n`;
            
            this.debugHelpers.debugElement.innerText = debugText;
        }
    }
} 