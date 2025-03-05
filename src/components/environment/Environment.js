import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';
import { createTestEnvironment } from '../../models/environment/test_environment.js';

/**
 * Environment class handles the creation and management of the game world
 */
export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.collidableObjects = [];
        this.textureLoader = new TextureLoader();
        this.gltfLoader = new GLTFLoader();
        
        // Environment state
        this.daytime = true;
        this.weather = 'clear';
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            // Create test environment
            const testEnvironment = createTestEnvironment();
            this.scene.add(testEnvironment);
            
            // Add fog to the scene
            this.scene.fog = testEnvironment.fog;
            
            // Store collidable objects
            testEnvironment.traverse((child) => {
                if (child.isMesh && child.name !== 'ground') {
                    this.collidableObjects.push(child);
                }
            });
            
            // Create ground plane for collision
            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(1000, 1000),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            ground.rotation.x = -Math.PI / 2;
            ground.name = 'ground';
            this.scene.add(ground);
            this.collidableObjects.push(ground);
            
            // Create sky and lighting
            this.createSky();
            this.createLighting();
            
            console.log('Environment initialized successfully');
        } catch (error) {
            console.error('Error initializing environment:', error);
        }
    }
    
    createSky() {
        // Create sky
        const sky = new Sky();
        sky.scale.setScalar(450000);
        this.scene.add(sky);
        
        // Configure sky parameters for natural look
        const sun = new THREE.Vector3();
        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = 3.0; // Increased turbidity for hazier sky
        uniforms['rayleigh'].value = 0.5; // Increased scattering for more diffuse light
        uniforms['mieCoefficient'].value = 0.005; // Slightly increased atmospheric effects
        uniforms['mieDirectionalG'].value = 0.5; // More diffuse sun effects
        
        // Position sun lower in the sky for softer lighting
        const phi = THREE.MathUtils.degToRad(25); // Lower sun angle
        const theta = THREE.MathUtils.degToRad(180);
        sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(sun);
        
        // Create clouds
        this.createClouds();
        
        // Very subtle fog
        this.scene.fog = new THREE.FogExp2(0x555555, 0.002);
    }
    
    createClouds() {
        const cloudCount = 10; // Fewer clouds
        const cloudGeometry = new THREE.PlaneGeometry(50, 50);
        
        // Create cloud texture
        const cloudTexture = this.createCloudTexture();
        
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.2, // Much lower opacity
            side: THREE.DoubleSide
        });
        
        // Create multiple cloud layers
        for (let i = 0; i < cloudCount; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
            
            // Random position in sky
            cloud.position.set(
                (Math.random() - 0.5) * 500,
                120 + Math.random() * 40, // Even higher clouds
                (Math.random() - 0.5) * 500
            );
            
            // Random rotation and scale for variety
            cloud.rotation.x = -Math.PI / 2;
            cloud.rotation.z = Math.random() * Math.PI;
            const scale = 1 + Math.random() * 2;
            cloud.scale.set(scale, scale, 1);
            
            this.scene.add(cloud);
        }
    }
    
    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        
        const context = canvas.getContext('2d');
        
        // Create cloud-like gradient
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        
        // Add some noise for texture
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const radius = Math.random() * 2;
            
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
            context.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createLighting() {
        // Minimal ambient light
        const ambientLight = new THREE.AmbientLight(0x333333, 0.15); // Reduced from 0.2
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xf5e5d6, 0.2); // Reduced from 0.3
        sunLight.position.set(-50, 80, -50);
        sunLight.castShadow = true;
        
        // Improve shadow quality
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.normalBias = 0.02;
        
        this.scene.add(sunLight);
        
        // Very subtle hemisphere light
        const hemiLight = new THREE.HemisphereLight(
            0x555555, // Sky color - very dark grey
            0x333333, // Ground color - darker grey
            0.15 // Reduced from 0.2
        );
        hemiLight.position.set(0, 100, 0);
        this.scene.add(hemiLight);
    }
    
    async createGround() {
        // Load ground textures
        const [diffuseMap, normalMap, roughnessMap, aoMap] = await Promise.all([
            this.textureLoader.loadAsync('/textures/ground/diffuse.jpg'),
            this.textureLoader.loadAsync('/textures/ground/normal.jpg'),
            this.textureLoader.loadAsync('/textures/ground/roughness.jpg'),
            this.textureLoader.loadAsync('/textures/ground/ao.jpg')
        ]);
        
        // Configure texture repeat
        [diffuseMap, normalMap, roughnessMap, aoMap].forEach(texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(20, 20);
        });
        
        // Create ground material
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: diffuseMap,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
            aoMap: aoMap,
            normalScale: new THREE.Vector2(1, 1),
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create ground mesh
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        this.collidableObjects.push(ground);
    }
    
    async createBuildings() {
        // Create destroyed building ruins
        const positions = [
            { x: -20, z: -30 },
            { x: 15, z: -25 },
            { x: -10, z: 20 },
            { x: 25, z: 10 }
        ];
        
        // Load building textures
        const [brickDiffuse, brickNormal, brickRoughness] = await Promise.all([
            this.textureLoader.loadAsync('/textures/brick/diffuse.jpg'),
            this.textureLoader.loadAsync('/textures/brick/normal.jpg'),
            this.textureLoader.loadAsync('/textures/brick/roughness.jpg')
        ]);
        
        // Configure texture repeat
        [brickDiffuse, brickNormal, brickRoughness].forEach(texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
        });
        
        // Create building material
        const buildingMaterial = new THREE.MeshStandardMaterial({
            map: brickDiffuse,
            normalMap: brickNormal,
            roughnessMap: brickRoughness,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create buildings with random damage
        positions.forEach(pos => {
            const height = 5 + Math.random() * 3;
            const segments = Math.floor(3 + Math.random() * 3);
            
            for (let i = 0; i < segments; i++) {
                const width = 2 + Math.random();
                const depth = 2 + Math.random();
                const segmentHeight = (height / segments) * (1 - Math.random() * 0.3);
                
                const geometry = new THREE.BoxGeometry(width, segmentHeight, depth);
                const building = new THREE.Mesh(geometry, buildingMaterial);
                
                // Position with slight randomness
                building.position.set(
                    pos.x + (Math.random() - 0.5) * 2,
                    segmentHeight / 2 + (height / segments) * i,
                    pos.z + (Math.random() - 0.5) * 2
                );
                
                // Random rotation for more natural destruction
                building.rotation.y = Math.random() * Math.PI * 2;
                
                building.castShadow = true;
                building.receiveShadow = true;
                
                this.scene.add(building);
                this.collidableObjects.push(building);
            }
        });
    }
    
    async createEnvironmentalDetails() {
        // Add debris and rubble
        const debrisGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const debrisMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < 100; i++) {
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.set(
                (Math.random() - 0.5) * 100,
                0.25,
                (Math.random() - 0.5) * 100
            );
            debris.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            debris.scale.set(
                0.5 + Math.random(),
                0.5 + Math.random(),
                0.5 + Math.random()
            );
            debris.castShadow = true;
            debris.receiveShadow = true;
            
            this.scene.add(debris);
        }
        
        // Add sandbag barriers
        await this.createSandbagBarriers();
        
        // Add barbed wire
        await this.createBarbedWire();
    }
    
    async createSandbagBarriers() {
        const sandbagGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.2);
        const sandbagMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 1,
            metalness: 0
        });
        
        const createSandbagWall = (startX, startZ, length, rotation) => {
            const wallGroup = new THREE.Group();
            
            for (let row = 0; row < 3; row++) {
                for (let i = 0; i < length; i++) {
                    const sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
                    sandbag.position.set(
                        i * 0.35 + (row % 2) * 0.175,
                        row * 0.15,
                        0
                    );
                    sandbag.rotation.y = (Math.random() - 0.5) * 0.2;
                    sandbag.castShadow = true;
                    sandbag.receiveShadow = true;
                    wallGroup.add(sandbag);
                }
            }
            
            wallGroup.position.set(startX, 0, startZ);
            wallGroup.rotation.y = rotation;
            this.scene.add(wallGroup);
            this.collidableObjects.push(wallGroup);
        };
        
        // Create sandbag walls at strategic positions
        createSandbagWall(-5, -10, 10, 0);
        createSandbagWall(5, 10, 8, Math.PI / 2);
        createSandbagWall(-15, 5, 12, Math.PI / 4);
    }
    
    async createBarbedWire() {
        // Create barbed wire posts
        const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.8,
            metalness: 0.5
        });
        
        const createBarbedWireFence = (startX, startZ, length, rotation) => {
            const fenceGroup = new THREE.Group();
            
            // Add posts
            for (let i = 0; i <= length; i++) {
                const post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(i * 2, 0.6, 0);
                post.castShadow = true;
                fenceGroup.add(post);
            }
            
            // Add wire
            const wireGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2, 4);
            wireGeometry.rotateZ(Math.PI / 2);
            const wireMaterial = new THREE.MeshStandardMaterial({
                color: 0x8a8a8a,
                roughness: 0.6,
                metalness: 0.8
            });
            
            for (let i = 0; i < length; i++) {
                for (let h = 0; h < 3; h++) {
                    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
                    wire.position.set(i * 2 + 1, 0.3 + h * 0.3, 0);
                    wire.castShadow = true;
                    fenceGroup.add(wire);
                }
            }
            
            fenceGroup.position.set(startX, 0, startZ);
            fenceGroup.rotation.y = rotation;
            this.scene.add(fenceGroup);
            this.collidableObjects.push(fenceGroup);
        };
        
        // Create barbed wire fences
        createBarbedWireFence(-20, -15, 5, 0);
        createBarbedWireFence(10, 15, 7, Math.PI / 3);
        createBarbedWireFence(-10, 10, 4, -Math.PI / 4);
    }
    
    createAtmosphericEffects() {
        // Add dust particles
        const particleCount = 1000;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            particlePositions[i] = (Math.random() - 0.5) * 100;
            particlePositions[i + 1] = Math.random() * 20;
            particlePositions[i + 2] = (Math.random() - 0.5) * 100;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.1,
            transparent: true,
            opacity: 0.4,
            map: this.createParticleTexture()
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    update(deltaTime) {
        // Animate clouds
        this.scene.traverse((object) => {
            if (object.isMesh && object.material.transparent) {
                // Simple cloud movement
                object.position.x += deltaTime * 0.5; // Slow drift
                
                // Reset cloud position when it moves too far
                if (object.position.x > 250) {
                    object.position.x = -250;
                }
            }
        });
    }
    
    getCollidableObjects() {
        return this.collidableObjects;
    }
}

export default Environment;
