import * as THREE from 'three';

export function createTestEnvironment() {
    const environment = new THREE.Group();
    
    // Materials
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x7CFC00,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.2
    });
    
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Create ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    environment.add(ground);
    
    // Create road
    const road = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 100),
        roadMaterial
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01; // Slightly above ground to prevent z-fighting
    road.receiveShadow = true;
    environment.add(road);
    
    // Create buildings
    const createBuilding = (x, z, width, height, depth) => {
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            buildingMaterial
        );
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        environment.add(building);
        
        return building;
    };
    
    // Add some buildings
    createBuilding(10, -20, 8, 10, 8);
    createBuilding(-10, -15, 6, 8, 6);
    createBuilding(15, -30, 10, 12, 10);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    environment.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    environment.add(directionalLight);
    
    // Add some fog for atmosphere
    environment.fog = new THREE.FogExp2(0xcccccc, 0.002);
    
    return environment;
} 