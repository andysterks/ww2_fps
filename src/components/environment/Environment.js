import * as THREE from 'three';

/**
 * Environment class handles the creation and management of the game world
 */
class Environment {
    constructor(scene) {
        this.scene = scene;
        this.collidableObjects = [];
        
        // Initialize environment
        this.createEnvironment();
    }
    
    createEnvironment() {
        // Create ground
        this.createGround();
        
        // Create buildings
        this.createBuildings();
        
        // Create lighting
        this.createLighting();
    }
    
    createGround() {
        // Ground (street)
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        this.collidableObjects.push(ground);
    }
    
    createBuildings() {
        // Create a simple building layout
        this.createBuilding(10, 8, 10, new THREE.Vector3(-15, 4, -15));
        this.createBuilding(15, 10, 8, new THREE.Vector3(15, 5, -10));
        this.createBuilding(8, 6, 20, new THREE.Vector3(0, 3, -25));
        this.createBuilding(12, 12, 12, new THREE.Vector3(-20, 6, 10));
        
        // Create some barriers and obstacles
        this.createBarrier(10, 2, 1, new THREE.Vector3(0, 1, -5));
        this.createBarrier(1, 1, 8, new THREE.Vector3(5, 0.5, 0));
        this.createBarrier(8, 1, 1, new THREE.Vector3(-8, 0.5, 5));
    }
    
    createBuilding(width, height, depth, position) {
        // Building exterior
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.copy(position);
        building.castShadow = true;
        building.receiveShadow = true;
        
        this.scene.add(building);
        this.collidableObjects.push(building);
        
        // Add windows
        this.addWindowsToBuilding(building, width, height, depth);
        
        // Add roof
        this.addRoofToBuilding(building, width, height, depth);
    }
    
    addWindowsToBuilding(building, width, height, depth) {
        // Window material
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x114466,
            emissiveIntensity: 0.5
        });
        
        // Add windows to each side
        const windowSize = 1;
        const windowSpacing = 2;
        
        // Front and back windows
        for (let x = -width/2 + windowSpacing; x < width/2; x += windowSpacing) {
            for (let y = -height/2 + windowSpacing; y < height/2; y += windowSpacing) {
                // Front windows
                const frontWindow = new THREE.Mesh(
                    new THREE.PlaneGeometry(windowSize, windowSize),
                    windowMaterial
                );
                frontWindow.position.set(
                    building.position.x + x,
                    building.position.y + y,
                    building.position.z + depth/2 + 0.01
                );
                frontWindow.rotation.x = 0;
                frontWindow.rotation.y = Math.PI;
                
                // Back windows
                const backWindow = new THREE.Mesh(
                    new THREE.PlaneGeometry(windowSize, windowSize),
                    windowMaterial
                );
                backWindow.position.set(
                    building.position.x + x,
                    building.position.y + y,
                    building.position.z - depth/2 - 0.01
                );
                
                this.scene.add(frontWindow);
                this.scene.add(backWindow);
            }
        }
        
        // Side windows
        for (let z = -depth/2 + windowSpacing; z < depth/2; z += windowSpacing) {
            for (let y = -height/2 + windowSpacing; y < height/2; y += windowSpacing) {
                // Left side windows
                const leftWindow = new THREE.Mesh(
                    new THREE.PlaneGeometry(windowSize, windowSize),
                    windowMaterial
                );
                leftWindow.position.set(
                    building.position.x - width/2 - 0.01,
                    building.position.y + y,
                    building.position.z + z
                );
                leftWindow.rotation.y = -Math.PI / 2;
                
                // Right side windows
                const rightWindow = new THREE.Mesh(
                    new THREE.PlaneGeometry(windowSize, windowSize),
                    windowMaterial
                );
                rightWindow.position.set(
                    building.position.x + width/2 + 0.01,
                    building.position.y + y,
                    building.position.z + z
                );
                rightWindow.rotation.y = Math.PI / 2;
                
                this.scene.add(leftWindow);
                this.scene.add(rightWindow);
            }
        }
    }
    
    addRoofToBuilding(building, width, height, depth) {
        // Roof
        const roofGeometry = new THREE.BoxGeometry(width + 0.5, 0.5, depth + 0.5);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(
            building.position.x,
            building.position.y + height/2 + 0.25,
            building.position.z
        );
        
        roof.castShadow = true;
        roof.receiveShadow = true;
        
        this.scene.add(roof);
        this.collidableObjects.push(roof);
    }
    
    createBarrier(width, height, depth, position) {
        // Barrier geometry
        const barrierGeometry = new THREE.BoxGeometry(width, height, depth);
        const barrierMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown color for barriers
            roughness: 0.8,
            metalness: 0.2
        });
        
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.copy(position);
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        
        this.scene.add(barrier);
        this.collidableObjects.push(barrier);
    }
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Adjust shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Add some point lights for atmosphere
        this.addPointLight(0xffaa33, 0.8, new THREE.Vector3(-15, 5, -15));
        this.addPointLight(0x33aaff, 0.5, new THREE.Vector3(15, 5, -10));
        this.addPointLight(0xffaaaa, 0.6, new THREE.Vector3(-20, 7, 10));
    }
    
    addPointLight(color, intensity, position) {
        const pointLight = new THREE.PointLight(color, intensity, 20);
        pointLight.position.copy(position);
        pointLight.castShadow = true;
        
        this.scene.add(pointLight);
    }
    
    getCollidableObjects() {
        return this.collidableObjects;
    }
}

export default Environment;
