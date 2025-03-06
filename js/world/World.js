// World.js - Manages the game world, terrain, and physics

class World {
    constructor(scene, assetLoader) {
        // Store references
        this.scene = scene;            // THREE.js scene
        this.assetLoader = assetLoader; // Asset loader utility
        
        // Physics world
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.82, 0); // Earth gravity
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 10; // More iterations = more accurate but slower
        
        // Performance settings
        this.enableShadows = false;    // Disable shadows for performance
        this.maxLights = 4;            // Limit number of lights for performance
        this.maxObjects = 100;         // Limit number of objects for performance
        
        // World objects
        this.terrain = null;           // Terrain mesh
        this.buildings = [];           // Array of building objects
        this.props = [];               // Array of prop objects (barrels, crates, etc.)
        this.lights = [];              // Array of light objects
        
        // World size
        this.worldSize = 200;          // Size of the world in units
        
        // World generation parameters
        this.buildingCount = 15;       // Number of buildings to generate
        this.propCount = 30;           // Number of props to generate
    }
    
    /**
     * Initialize the world
     * @param {Player} player - Reference to the player object
     * @returns {Promise} A promise that resolves when initialization is complete
     */
    async init(player) {
        // Create terrain
        this.createTerrain();
        
        // Create skybox
        this.createSkybox();
        
        // Add ambient light
        this.addAmbientLight();
        
        // Add directional light (sun)
        this.addDirectionalLight();
        
        // Generate buildings
        this.generateBuildings();
        
        // Generate props
        this.generateProps();
        
        // Add player to physics world
        this.physicsWorld.addBody(player.physicsBody);
        
        return Promise.resolve();
    }
    
    /**
     * Update the world
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update physics world
        this.physicsWorld.step(1/60, deltaTime, 3);
        
        // Update buildings
        for (const building of this.buildings) {
            if (building.update) {
                building.update(deltaTime);
            }
        }
        
        // Update props
        for (const prop of this.props) {
            if (prop.update) {
                prop.update(deltaTime);
            }
        }
    }
    
    /**
     * Create the terrain
     */
    createTerrain() {
        // Create ground plane geometry
        const groundGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 1, 1);
        
        // Create ground material with texture
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: this.assetLoader.getTexture('ground'),
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Repeat texture to avoid stretching
        if (groundMaterial.map) {
            groundMaterial.map.wrapS = THREE.RepeatWrapping;
            groundMaterial.map.wrapT = THREE.RepeatWrapping;
            groundMaterial.map.repeat.set(20, 20);
        }
        
        // Create ground mesh
        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.terrain.receiveShadow = this.enableShadows;
        this.scene.add(this.terrain);
        
        // Create ground physics body
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 }); // Mass 0 = static body
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.physicsWorld.addBody(groundBody);
    }
    
    /**
     * Create the skybox
     */
    createSkybox() {
        // Simple skybox using a large sphere with material applied inside
        const skyGeometry = new THREE.SphereGeometry(this.worldSize / 2, 32, 32);
        
        // Create sky material with texture
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: this.assetLoader.getTexture('sky'),
            side: THREE.BackSide // Render on inside of sphere
        });
        
        // Create sky mesh
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    /**
     * Add ambient light to the scene
     */
    addAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
    }
    
    /**
     * Add directional light to the scene (sun)
     */
    addDirectionalLight() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = this.enableShadows;
        
        // Optimize shadow settings for performance
        if (this.enableShadows) {
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
        }
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
    }
    
    /**
     * Generate buildings in the world
     */
    generateBuildings() {
        // Building types
        const buildingTypes = ['building1', 'building2'];
        
        // Generate buildings
        for (let i = 0; i < this.buildingCount; i++) {
            // Choose random building type
            const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            
            // Generate random position
            const x = (Math.random() - 0.5) * (this.worldSize - 20);
            const z = (Math.random() - 0.5) * (this.worldSize - 20);
            
            // Generate random rotation
            const rotation = Math.random() * Math.PI * 2;
            
            // Create building
            this.createBuilding(buildingType, x, z, rotation);
        }
    }
    
    /**
     * Create a building at the specified position
     * @param {string} type - Type of building to create
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {number} rotation - Y rotation in radians
     */
    createBuilding(type, x, z, rotation) {
        // Get building model
        const buildingModel = this.assetLoader.createModelInstance(type);
        
        if (!buildingModel) {
            console.warn(`Building model ${type} not found`);
            return;
        }
        
        // Set position and rotation
        buildingModel.position.set(x, 0, z);
        buildingModel.rotation.y = rotation;
        
        // Apply shadows
        if (this.enableShadows) {
            buildingModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
        
        // Add to scene
        this.scene.add(buildingModel);
        
        // Create physics body for building
        // Simple box shape for collision
        const size = type === 'building1' ? 10 : 8;
        const height = type === 'building1' ? 15 : 10;
        
        const buildingShape = new CANNON.Box(new CANNON.Vec3(size / 2, height / 2, size / 2));
        const buildingBody = new CANNON.Body({ mass: 0 }); // Static body
        buildingBody.addShape(buildingShape);
        buildingBody.position.set(x, height / 2, z);
        buildingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
        
        // Add to physics world
        this.physicsWorld.addBody(buildingBody);
        
        // Store building data
        this.buildings.push({
            mesh: buildingModel,
            body: buildingBody,
            type: type
        });
    }
    
    /**
     * Generate props in the world (barrels, crates, etc.)
     */
    generateProps() {
        // Prop types (we'll create these procedurally for now)
        const propTypes = ['barrel', 'crate', 'sandbag'];
        
        // Generate props
        for (let i = 0; i < this.propCount; i++) {
            // Choose random prop type
            const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
            
            // Generate random position
            const x = (Math.random() - 0.5) * (this.worldSize - 10);
            const z = (Math.random() - 0.5) * (this.worldSize - 10);
            
            // Generate random rotation
            const rotation = Math.random() * Math.PI * 2;
            
            // Create prop
            this.createProp(propType, x, z, rotation);
        }
    }
    
    /**
     * Create a prop at the specified position
     * @param {string} type - Type of prop to create
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {number} rotation - Y rotation in radians
     */
    createProp(type, x, z, rotation) {
        let geometry, material, shape, size;
        
        // Create geometry and material based on prop type
        switch (type) {
            case 'barrel':
                geometry = new THREE.CylinderGeometry(1, 1, 2, 16);
                material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                shape = new CANNON.Cylinder(1, 1, 2, 8);
                size = { radius: 1, height: 2 };
                break;
            case 'crate':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                material = new THREE.MeshStandardMaterial({ color: 0xA0522D });
                shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
                size = { width: 2, height: 2, depth: 2 };
                break;
            case 'sandbag':
                geometry = new THREE.BoxGeometry(2, 1, 1);
                material = new THREE.MeshStandardMaterial({ color: 0xC2B280 });
                shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 0.5));
                size = { width: 2, height: 1, depth: 1 };
                break;
            default:
                console.warn(`Unknown prop type: ${type}`);
                return;
        }
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, size.height / 2, z);
        mesh.rotation.y = rotation;
        
        // Apply shadows
        if (this.enableShadows) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        
        // Add to scene
        this.scene.add(mesh);
        
        // Create physics body
        const mass = type === 'sandbag' ? 10 : 5; // Sandbags are heavier
        const body = new CANNON.Body({ mass: mass });
        body.addShape(shape);
        body.position.set(x, size.height / 2, z);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
        
        // Add to physics world
        this.physicsWorld.addBody(body);
        
        // Store prop data
        this.props.push({
            mesh: mesh,
            body: body,
            type: type,
            
            // Update function to sync mesh with physics body
            update: function() {
                this.mesh.position.copy(this.body.position);
                this.mesh.quaternion.copy(this.body.quaternion);
            }
        });
    }
    
    /**
     * Get all collidable objects in the world
     * @returns {Array} Array of objects with mesh and body properties
     */
    getCollidableObjects() {
        return [...this.buildings, ...this.props];
    }
    
    /**
     * Perform a raycast to find intersections with world objects
     * @param {THREE.Vector3} origin - Origin of the ray
     * @param {THREE.Vector3} direction - Direction of the ray
     * @param {number} maxDistance - Maximum distance of the ray
     * @returns {Object|null} First intersected object or null if none found
     */
    raycast(origin, direction, maxDistance) {
        // Create raycaster
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
        
        // Get all meshes to test
        const meshes = [
            this.terrain,
            ...this.buildings.map(b => b.mesh),
            ...this.props.map(p => p.mesh)
        ];
        
        // Perform raycast
        const intersects = raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            // Find the corresponding object data for the intersected mesh
            const intersectedMesh = intersects[0].object;
            
            // Check if it's the terrain
            if (intersectedMesh === this.terrain) {
                return {
                    type: 'terrain',
                    point: intersects[0].point,
                    distance: intersects[0].distance
                };
            }
            
            // Check if it's a building
            for (const building of this.buildings) {
                if (building.mesh === intersectedMesh || building.mesh.children.includes(intersectedMesh)) {
                    return {
                        type: 'building',
                        object: building,
                        point: intersects[0].point,
                        distance: intersects[0].distance
                    };
                }
            }
            
            // Check if it's a prop
            for (const prop of this.props) {
                if (prop.mesh === intersectedMesh) {
                    return {
                        type: 'prop',
                        object: prop,
                        point: intersects[0].point,
                        distance: intersects[0].distance
                    };
                }
            }
        }
        
        return null;
    }
} 