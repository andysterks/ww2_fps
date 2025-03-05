import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM loaded, initializing game...");
        // Create a simple Three.js scene directly
        const simpleGame = new SimpleGame();
    } catch (error) {
        console.error("Error initializing game:", error);
        // Display error on screen for debugging
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.color = 'red';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.zIndex = '1000';
        errorDiv.textContent = `Game initialization error: ${error.message}`;
        document.body.appendChild(errorDiv);
    }
});

class SimpleGame {
    constructor() {
        try {
            console.log("Initializing game");
            
            // Initialize properties
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            
            // Set up renderer
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Find game container
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                console.error("Game container not found!");
                return;
            }
            
            // Append renderer to container
            gameContainer.appendChild(this.renderer.domElement);
            
            // Set up camera and controls
            this.camera.position.y = 1.6; // Eye level
            this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
            
            // Add controls to scene to ensure they're properly initialized
            this.scene.add(this.controls.getObject());
            
            // Movement variables
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
            this.isSprinting = false;
            this.sprintMultiplier = 2.0; // Increased from 1.5 for more noticeable sprint
            
            // Physics variables
            this.velocity = new THREE.Vector3();
            this.direction = new THREE.Vector3();
            this.playerSpeed = 2.0; // Reduced from 5.0 for better matching with static player
            this.prevTime = performance.now();
            
            // Animation variables
            this.animationClock = 0;
            
            // Debug mode
            this.debugMode = true;
            
            // Create a simple test environment
            this.createSimpleTestEnvironment();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start animation loop
            this.animate();
            
            console.log("Game initialized successfully");
        } catch (error) {
            console.error("Error initializing game:", error);
        }
    }
    
    createSimpleTestEnvironment() {
        console.log("Creating simple test environment");
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create a simple box as a reference object
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(0, 0.5, -5);
        box.castShadow = true;
        this.scene.add(box);
        
        // Create a static player model
        this.createSimpleStaticPlayer(0, 0, -10);
        
        console.log("Simple test environment created");
    }
    
    // Simplified static player model
    createSimpleStaticPlayer(x, y, z) {
        console.log("Creating simple static player");
        
        // Create a group for the player model
        const playerGroup = new THREE.Group();
        
        // Define materials
        const uniformMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4D5D53, // Field gray
            roughness: 0.4,
            metalness: 0.1
        });
        
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, // Dark gray
            roughness: 0.2,
            metalness: 0.3
        });
        
        const skinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE0AC69, // Light skin tone
            roughness: 0.3,
            metalness: 0.1
        });
        
        const leatherMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A3C2A, // Brown leather
            roughness: 0.5,
            metalness: 0.1
        });
        
        // Create body parts
        // Head and helmet
        const headGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 16);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        playerGroup.add(head);
        
        // Add facial features
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.65, 0.18);
        playerGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.65, 0.18);
        playerGroup.add(rightEye);
        
        // Mouth
        const mouthGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.01);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.55, 0.2);
        playerGroup.add(mouth);
        
        // German Stahlhelm helmet
        const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.scale.set(1.1, 0.8, 1.1);
        helmet.position.y = 1.78;
        helmet.position.z = -0.05;
        helmet.castShadow = true;
        playerGroup.add(helmet);
        
        // Helmet rim
        const rimGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 24, Math.PI * 1.2);
        const rim = new THREE.Mesh(rimGeometry, helmetMaterial);
        rim.position.y = 1.7;
        rim.position.z = -0.05;
        rim.rotation.x = Math.PI / 2;
        rim.castShadow = true;
        playerGroup.add(rim);
        
        // Torso
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.2);
        const torso = new THREE.Mesh(torsoGeometry, uniformMaterial);
        torso.position.y = 1.25;
        torso.castShadow = true;
        playerGroup.add(torso);
        
        // Add uniform details - collar
        const collarGeometry = new THREE.BoxGeometry(0.42, 0.08, 0.22);
        const collar = new THREE.Mesh(collarGeometry, uniformMaterial);
        collar.position.y = 1.5;
        collar.castShadow = true;
        playerGroup.add(collar);
        
        // Add insignia - eagle
        const eagleGeometry = new THREE.PlaneGeometry(0.15, 0.08);
        const eagleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xCCCCCC,
            roughness: 0.4,
            metalness: 0.6,
            side: THREE.DoubleSide
        });
        const eagle = new THREE.Mesh(eagleGeometry, eagleMaterial);
        eagle.position.set(0, 1.4, 0.11);
        eagle.castShadow = true;
        playerGroup.add(eagle);
        
        // Belt
        const beltGeometry = new THREE.BoxGeometry(0.42, 0.08, 0.22);
        const belt = new THREE.Mesh(beltGeometry, leatherMaterial);
        belt.position.y = 1.0;
        belt.castShadow = true;
        playerGroup.add(belt);
        
        // Create leg groups for animation
        const leftLegGroup = new THREE.Group();
        const rightLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.12, 0.9, 0);
        rightLegGroup.position.set(0.12, 0.9, 0);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.18, 0.5, 0.18);
        
        const leftLeg = new THREE.Mesh(legGeometry, uniformMaterial);
        leftLeg.position.set(0, -0.3, 0);
        leftLeg.castShadow = true;
        leftLegGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, uniformMaterial);
        rightLeg.position.set(0, -0.3, 0);
        rightLeg.castShadow = true;
        rightLegGroup.add(rightLeg);
        
        // Boots
        const bootGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.22);
        const bootMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.3,
            metalness: 0.2
        });
        
        const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        leftBoot.position.set(0, -0.6, 0.02);
        leftBoot.castShadow = true;
        leftLegGroup.add(leftBoot);
        
        const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        rightBoot.position.set(0, -0.6, 0.02);
        rightBoot.castShadow = true;
        rightLegGroup.add(rightBoot);
        
        // Create arm groups for animation
        const leftArmGroup = new THREE.Group();
        const rightArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.28, 1.25, 0);
        rightArmGroup.position.set(0.28, 1.25, 0);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.15, 0.45, 0.15);
        
        const leftArm = new THREE.Mesh(armGeometry, uniformMaterial);
        leftArm.position.set(0, 0, 0);
        leftArm.castShadow = true;
        leftArmGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, uniformMaterial);
        rightArm.position.set(0, 0, 0);
        rightArm.castShadow = true;
        rightArmGroup.add(rightArm);
        
        // Hands
        const handGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
        
        const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
        leftHand.rotation.x = Math.PI / 2;
        leftHand.position.set(0, -0.25, 0);
        leftHand.castShadow = true;
        leftArmGroup.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
        rightHand.rotation.x = Math.PI / 2;
        rightHand.position.set(0, -0.25, 0);
        rightHand.castShadow = true;
        rightArmGroup.add(rightHand);
        
        // Add equipment - bread bag
        const breadBagGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.1);
        const breadBag = new THREE.Mesh(breadBagGeometry, leatherMaterial);
        breadBag.position.set(-0.2, 1.0, 0.15);
        breadBag.castShadow = true;
        playerGroup.add(breadBag);
        
        // Add canteen
        const canteenGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
        const canteen = new THREE.Mesh(canteenGeometry, new THREE.MeshStandardMaterial({ color: 0x5D4037 }));
        canteen.position.set(0.2, 1.0, 0.15);
        canteen.castShadow = true;
        playerGroup.add(canteen);
        
        // Add rifle (simplified Kar98k)
        const rifleGroup = new THREE.Group();
        
        // Rifle stock
        const stockGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.6);
        const stock = new THREE.Mesh(stockGeometry, new THREE.MeshStandardMaterial({ color: 0x5C4033 }));
        stock.position.z = 0.2;
        rifleGroup.add(stock);
        
        // Rifle barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8);
        const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.15;
        rifleGroup.add(barrel);
        
        // Position rifle in right hand
        rifleGroup.position.set(0, -0.25, 0.1);
        rifleGroup.rotation.x = -Math.PI / 4;
        rightArmGroup.add(rifleGroup);
        
        // Add limbs to player group
        playerGroup.add(leftLegGroup);
        playerGroup.add(rightLegGroup);
        playerGroup.add(leftArmGroup);
        playerGroup.add(rightArmGroup);
        
        // Store references for animation
        playerGroup.leftLegGroup = leftLegGroup;
        playerGroup.rightLegGroup = rightLegGroup;
        playerGroup.leftArmGroup = leftArmGroup;
        playerGroup.rightArmGroup = rightArmGroup;
        
        // Position the player
        playerGroup.position.set(x, y, z);
        playerGroup.rotation.y = Math.PI; // Face toward the player
        
        // Add to scene
        this.scene.add(playerGroup);
        
        // Store reference to the player model
        this.staticPlayerModel = playerGroup;
        
        console.log("Simple static player created");
        return playerGroup;
    }
    
    createEnvironment() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create road
        const roadGeometry = new THREE.PlaneGeometry(10, 100);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.receiveShadow = true;
        this.scene.add(road);
        
        // Add some buildings
        this.addBuilding(0x8B0000, -15, 1, -20); // Dark red building
        this.addBuilding(0xFF0000, -15, 1, 0); // Red building
        this.addBuilding(0x0000FF, 15, 1, -20); // Blue building
        this.addBuilding(0xFFFF00, 0, 1, -40); // Yellow building
        
        // Add a static player model (LEGO-like German soldier)
        this.createStaticPlayerModel(0, 0, -15);
        
        // Add WW2 scene elements
        this.addWW2SceneElements();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
    }
    
    addWW2SceneElements() {
        // Create sandbag barrier
        this.createSandbags(-5, 0, -10);
        
        // Create a fallen helmet
        this.createFallenHelmet(-3, 0.1, -8);
        
        // Create wooden crates
        this.createWoodenCrate(4, 0.5, -12);
        this.createWoodenCrate(4.5, 0.5, -13);
    }
    
    createSandbags(x, y, z) {
        const sandbagGroup = new THREE.Group();
        
        const sandbagMaterial = new THREE.MeshStandardMaterial({
            color: 0xB5651D,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const sandbagGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.3);
        
        // Create rows of sandbags
        for (let h = 0; h < 2; h++) {
            const rowOffset = (h % 2) * 0.3; // Offset every other row
            
            for (let i = 0; i < 5; i++) {
                const sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
                sandbag.position.set(x + i * 0.6 + rowOffset, y + h * 0.3, z);
                sandbag.castShadow = true;
                sandbag.receiveShadow = true;
                
                // Add some random rotation for realism
                sandbag.rotation.y = (Math.random() - 0.5) * 0.2;
                sandbag.rotation.z = (Math.random() - 0.5) * 0.1;
                
                sandbagGroup.add(sandbag);
            }
        }
        
        this.scene.add(sandbagGroup);
        return sandbagGroup;
    }
    
    createFallenHelmet(x, y, z) {
        const helmetGroup = new THREE.Group();
        
        // Helmet material
        const helmetMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.3
        });
        
        // Create improved German Stahlhelm (helmet)
        // Main helmet dome - complete shape to avoid gaps
        const helmetGeometry = new THREE.SphereGeometry(0.25, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.scale.set(1.1, 0.8, 1.1);
        helmet.position.y = 1.78; // Raised significantly higher
        helmet.position.z = -0.05; // Moved further back
        helmet.castShadow = true;
        
        // Helmet rim - complete circle to avoid gaps
        const helmetRimGeometry = new THREE.TorusGeometry(0.27, 0.04, 16, 32);
        const helmetRim = new THREE.Mesh(helmetRimGeometry, helmetMaterial);
        helmetRim.position.y = 1.7; // Raised higher
        helmetRim.position.z = -0.05; // Moved back
        helmetRim.rotation.x = Math.PI / 2;
        helmetRim.castShadow = true;
        
        // Helmet neck guard - characteristic of Stahlhelm
        const neckGuardGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.15);
        const neckGuard = new THREE.Mesh(neckGuardGeometry, helmetMaterial);
        neckGuard.position.set(0, 1.7, -0.23); // Adjusted position
        neckGuard.castShadow = true;
        
        // Helmet side flares - characteristic of Stahlhelm
        const leftFlareGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.15);
        const leftFlare = new THREE.Mesh(leftFlareGeometry, helmetMaterial);
        leftFlare.position.set(-0.25, 1.7, -0.05); // Adjusted position
        leftFlare.rotation.z = Math.PI / 6;
        leftFlare.castShadow = true;
        
        const rightFlareGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.15);
        const rightFlare = new THREE.Mesh(rightFlareGeometry, helmetMaterial);
        rightFlare.position.set(0.25, 1.7, -0.05); // Adjusted position
        rightFlare.rotation.z = -Math.PI / 6;
        rightFlare.castShadow = true;
        
        // Helmet front extension (more accurate)
        const frontBrimGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.1);
        const frontBrim = new THREE.Mesh(frontBrimGeometry, helmetMaterial);
        frontBrim.position.set(0, 1.7, 0.2); // Adjusted position
        frontBrim.castShadow = true;
        
        // Inner helmet liner to fill any gaps
        const helmetLinerGeometry = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const helmetLiner = new THREE.Mesh(helmetLinerGeometry, helmetMaterial);
        helmetLiner.scale.set(1.05, 0.75, 1.05);
        helmetLiner.position.y = 1.78; // Raised to match helmet
        helmetLiner.position.z = -0.05; // Moved back to match helmet
        helmetLiner.castShadow = true;
        
        // Add parts to group
        helmetGroup.add(helmet);
        helmetGroup.add(helmetRim);
        helmetGroup.add(neckGuard);
        helmetGroup.add(leftFlare);
        helmetGroup.add(rightFlare);
        helmetGroup.add(frontBrim);
        helmetGroup.add(helmetLiner);
        
        // Position and rotate to look like it's fallen on the ground
        helmetGroup.position.set(x, y, z);
        helmetGroup.rotation.set(Math.PI / 3, Math.PI / 4, 0);
        
        this.scene.add(helmetGroup);
        return helmetGroup;
    }
    
    createWoodenCrate(x, y, z) {
        const crateGeometry = new THREE.BoxGeometry(1, 1, 1);
        const crateMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.8,
            metalness: 0.1
        });
        
        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(x, y, z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        
        // Add some details to the crate
        const edgeGeometry = new THREE.BoxGeometry(1.02, 0.1, 0.1);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x5D4037, // Darker brown
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Add edges to the crate
        const edges = [];
        
        // Bottom edges
        for (let i = 0; i < 4; i++) {
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edge.position.set(0, -0.45, 0);
            edge.rotation.y = Math.PI / 2 * i;
            edge.rotation.z = Math.PI / 2;
            edge.castShadow = true;
            crate.add(edge);
            edges.push(edge);
        }
        
        // Top edges
        for (let i = 0; i < 4; i++) {
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edge.position.set(0, 0.45, 0);
            edge.rotation.y = Math.PI / 2 * i;
            edge.rotation.z = Math.PI / 2;
            edge.castShadow = true;
            crate.add(edge);
            edges.push(edge);
        }
        
        // Add some random rotation for realism
        crate.rotation.y = Math.random() * Math.PI * 2;
        
        this.scene.add(crate);
        return crate;
    }
    
    addBuilding(color, x, y, z) {
        // Create building group
        const buildingGroup = new THREE.Group();
        
        // Main building structure
        const height = 5 + Math.random() * 3; // Random height between 5-8
        const width = 6 + Math.random() * 2;
        const depth = 6 + Math.random() * 2;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(0, height/2, 0);
        building.castShadow = true;
        building.receiveShadow = true;
        
        // Add damage to buildings (holes and cracks)
        if (Math.random() > 0.3) { // 70% chance of damage
            // Create a hole in the building (simulating bomb damage)
            const holeSize = 1 + Math.random() * 2;
            const holeGeometry = new THREE.SphereGeometry(holeSize, 8, 8);
            const holeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x222222,
                roughness: 1.0,
                metalness: 0.0
            });
            
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            
            // Random position on the building
            const side = Math.floor(Math.random() * 4); // 0-3 for different sides
            const xPos = (Math.random() - 0.5) * width * 0.8;
            const yPos = (Math.random() * 0.6 + 0.2) * height; // Middle 60% of height
            const zPos = (Math.random() - 0.5) * depth * 0.8;
            
            switch(side) {
                case 0: // Front
                    hole.position.set(xPos, yPos, depth/2);
                    break;
                case 1: // Back
                    hole.position.set(xPos, yPos, -depth/2);
                    break;
                case 2: // Left
                    hole.position.set(-width/2, yPos, zPos);
                    break;
                case 3: // Right
                    hole.position.set(width/2, yPos, zPos);
                    break;
            }
            
            buildingGroup.add(hole);
        }
        
        // Add windows
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, 
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Front and back windows
        const windowRows = Math.floor(height / 2);
        const windowCols = Math.floor(width / 2);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                // Skip some windows randomly to create variation
                if (Math.random() < 0.3) continue;
                
                const windowGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
                
                // Front windows
                const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                frontWindow.position.set(
                    (col * 2 - (windowCols-1)) * (width/(windowCols*2)),
                    row * 2 + 1,
                    depth/2 + 0.05
                );
                buildingGroup.add(frontWindow);
                
                // Back windows
                const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                backWindow.position.set(
                    (col * 2 - (windowCols-1)) * (width/(windowCols*2)),
                    row * 2 + 1,
                    -depth/2 - 0.05
                );
                buildingGroup.add(backWindow);
                
                // Randomly break some windows (WW2 damage)
                if (Math.random() < 0.4) {
                    frontWindow.material = new THREE.MeshStandardMaterial({ 
                        color: 0x222222, 
                        roughness: 1.0,
                        metalness: 0.0
                    });
                }
                
                if (Math.random() < 0.4) {
                    backWindow.material = new THREE.MeshStandardMaterial({ 
                        color: 0x222222, 
                        roughness: 1.0,
                        metalness: 0.0
                    });
                }
            }
        }
        
        // Side windows
        const sideWindowRows = Math.floor(height / 2);
        const sideWindowCols = Math.floor(depth / 2);
        
        for (let row = 0; row < sideWindowRows; row++) {
            for (let col = 0; col < sideWindowCols; col++) {
                // Skip some windows randomly
                if (Math.random() < 0.3) continue;
                
                const windowGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.8);
                
                // Left side windows
                const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                leftWindow.position.set(
                    -width/2 - 0.05,
                    row * 2 + 1,
                    (col * 2 - (sideWindowCols-1)) * (depth/(sideWindowCols*2))
                );
                buildingGroup.add(leftWindow);
                
                // Right side windows
                const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                rightWindow.position.set(
                    width/2 + 0.05,
                    row * 2 + 1,
                    (col * 2 - (sideWindowCols-1)) * (depth/(sideWindowCols*2))
                );
                buildingGroup.add(rightWindow);
                
                // Randomly break some windows
                if (Math.random() < 0.4) {
                    leftWindow.material = new THREE.MeshStandardMaterial({ 
                        color: 0x222222, 
                        roughness: 1.0,
                        metalness: 0.0
                    });
                }
                
                if (Math.random() < 0.4) {
                    rightWindow.material = new THREE.MeshStandardMaterial({ 
                        color: 0x222222, 
                        roughness: 1.0,
                        metalness: 0.0
                    });
                }
            }
        }
        
        // Add a simple roof
        const roofGeometry = new THREE.BoxGeometry(width + 0.5, 0.3, depth + 0.5);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height + 0.15, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        buildingGroup.add(roof);
        
        // Add the main building to the group
        buildingGroup.add(building);
        
        // Position the building group
        buildingGroup.position.set(x, y, z);
        
        // Add to scene
        this.scene.add(buildingGroup);
        
        return buildingGroup;
    }
    
    createWeapon() {
        // Create weapon group
        const weaponGroup = new THREE.Group();
        
        // Create materials with proper depth settings
        const metalMaterial = new THREE.MeshPhongMaterial({
            color: 0x2c2c2c,
            specular: 0x111111,
            shininess: 30,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        
        const woodMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a2a0a,
            specular: 0x222222,
            shininess: 10,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        
        const blackMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            specular: 0x222222,
            shininess: 30,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
        
        // IMPORTANT: Create a separate group for the weapon body
        // This will allow us to position the sights separately
        const weaponBodyGroup = new THREE.Group();
        
        // Create rifle body - positioned lower to not block view
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.1, 0.9),
            metalMaterial.clone()
        );
        rifleBody.position.set(0, -0.05, 0);
        rifleBody.castShadow = true;
        rifleBody.receiveShadow = true;
        rifleBody.renderOrder = 1;
        
        // Create rifle stock - positioned lower
        const rifleStock = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.15, 0.5),
            woodMaterial.clone()
        );
        rifleStock.position.set(0, -0.05, 0.4);
        rifleStock.castShadow = true;
        rifleStock.receiveShadow = true;
        rifleStock.renderOrder = 1;
        
        // Add body parts to the weapon body group
        weaponBodyGroup.add(rifleBody);
        weaponBodyGroup.add(rifleStock);
        
        // Create a separate group for iron sights
        const ironSightsGroup = new THREE.Group();
        
        // Front sight post - thin and tall
        const frontSightPost = new THREE.Mesh(
            new THREE.BoxGeometry(0.003, 0.035, 0.003),
            blackMaterial.clone()
        );
        frontSightPost.position.set(0, 0.095, -0.4);
        frontSightPost.renderOrder = 3;
        frontSightPost.castShadow = true;
        
        // Front sight protective wings
        const frontSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.02, 0.02),
            metalMaterial.clone()
        );
        frontSightBase.position.set(0, 0.075, -0.4);
        frontSightBase.renderOrder = 2;
        frontSightBase.castShadow = true;
        
        // Left wing
        const leftWing = new THREE.Mesh(
            new THREE.BoxGeometry(0.004, 0.03, 0.02),
            metalMaterial.clone()
        );
        leftWing.position.set(-0.02, 0.09, -0.4);
        leftWing.renderOrder = 2;
        leftWing.castShadow = true;
        
        // Right wing
        const rightWing = new THREE.Mesh(
            new THREE.BoxGeometry(0.004, 0.03, 0.02),
            metalMaterial.clone()
        );
        rightWing.position.set(0.02, 0.09, -0.4);
        rightWing.renderOrder = 2;
        rightWing.castShadow = true;
        
        // Create a proper rear sight assembly
        // Main rear sight housing
        const rearSightBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16),
            metalMaterial.clone()
        );
        rearSightBase.rotation.x = Math.PI / 2;
        rearSightBase.position.set(0, 0.09, 0.1);
        rearSightBase.renderOrder = 2;
        rearSightBase.castShadow = true;
        
        // Create the aperture ring
        const innerRadius = 0.006;
        const outerRadius = 0.01;
        const thetaSegments = 32;
        
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
        const apertureMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1.0,
            depthWrite: true,
            depthTest: true
        });
        
        const rearSightAperture = new THREE.Mesh(ringGeometry, apertureMaterial);
        rearSightAperture.rotation.x = Math.PI / 2;
        rearSightAperture.position.set(0, 0.09, 0.1);
        rearSightAperture.renderOrder = 1000;
        
        // Add adjustment knobs on sides
        const leftKnob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8),
            metalMaterial.clone()
        );
        leftKnob.rotation.z = Math.PI / 2;
        leftKnob.position.set(-0.03, 0.09, 0.1);
        leftKnob.renderOrder = 2;
        leftKnob.castShadow = true;
        
        const rightKnob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8),
            metalMaterial.clone()
        );
        rightKnob.rotation.z = Math.PI / 2;
        rightKnob.position.set(0.03, 0.09, 0.1);
        rightKnob.renderOrder = 2;
        rightKnob.castShadow = true;
        
        // Add sights to group
        ironSightsGroup.add(frontSightPost);
        ironSightsGroup.add(frontSightBase);
        ironSightsGroup.add(leftWing);
        ironSightsGroup.add(rightWing);
        ironSightsGroup.add(rearSightBase);
        ironSightsGroup.add(rearSightAperture);
        ironSightsGroup.add(leftKnob);
        ironSightsGroup.add(rightKnob);
        
        // Add all parts to weapon group
        weaponGroup.add(weaponBodyGroup);
        weaponGroup.add(ironSightsGroup);
        
        // Store reference to iron sights for toggling visibility
        this.ironSights = ironSightsGroup;
        
        // Define positions with adjusted z-depth
        this.weaponDefaultPosition = new THREE.Vector3(0.3, -0.3, -0.6);
        this.weaponDefaultRotation = new THREE.Vector3(0, Math.PI / 12, 0);
        
        // Adjusted aim position for proper sight picture
        this.weaponAimPosition = new THREE.Vector3(0, -0.045, -0.3);
        this.weaponAimRotation = new THREE.Vector3(0, 0, 0);
        
        // Position weapon in hip-fire position
        weaponGroup.position.copy(this.weaponDefaultPosition);
        weaponGroup.rotation.setFromVector3(this.weaponDefaultRotation);
        
        // Add weapon to camera
        this.camera.add(weaponGroup);
        
        // Store weapon reference
        this.weapon = weaponGroup;
        this.weaponBody = weaponBodyGroup;
        
        // Add aiming properties
        this.aimTransitionSpeed = 8.0;
        this.defaultFOV = 75;
        this.aimFOV = 65; // Wider FOV to better see through sights
        this.isAimingDownSights = false;
    }
    
    setupEventListeners() {
        // Lock pointer on click and shoot
        document.addEventListener('click', (event) => {
            // Ignore clicks on the instructions popup
            if (this.instructionsContainer && this.instructionsContainer.contains(event.target)) {
                return;
            }
            
            if (!this.controls.isLocked) {
                this.controls.lock();
            } else {
                // Always attempt to shoot when clicked
                console.log('Click detected, attempting to shoot');
                this.shoot();
            }
        });
        
        // Handle key presses for movement and actions
        document.addEventListener('keydown', (event) => {
            if (this.controls.isLocked) {
                switch (event.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        this.moveForward = true;
                        break;
                        
                    case 'KeyS':
                    case 'ArrowDown':
                        this.moveBackward = true;
                        break;
                        
                    case 'KeyA':
                    case 'ArrowLeft':
                        this.moveLeft = true;
                        break;
                        
                    case 'KeyD':
                    case 'ArrowRight':
                        this.moveRight = true;
                        break;
                        
                    case 'ShiftLeft':
                        this.isSprinting = true;
                        break;
                        
                    case 'KeyR':
                        // Reload weapon
                        if (!this.isReloading && this.bulletCount < this.maxBullets) {
                            this.reload();
                        }
                        break;
                        
                    case 'KeyF':
                        // Toggle aim
                        this.toggleAim();
                        break;
                        
                    case 'NumpadAdd':
                    case 'Equal':
                        // Increase player speed
                        this.setPlayerSpeed(this.playerSpeed + 0.5);
                        console.log(`Increased player speed to ${this.playerSpeed.toFixed(1)}`);
                        break;
                        
                    case 'NumpadSubtract':
                    case 'Minus':
                        // Decrease player speed (minimum 0.5)
                        this.setPlayerSpeed(Math.max(0.5, this.playerSpeed - 0.5));
                        console.log(`Decreased player speed to ${this.playerSpeed.toFixed(1)}`);
                        break;
                        
                    case 'KeyM':
                        // Match player speeds
                        this.matchPlayerSpeeds();
                        break;
                }
            }
        });
        
        // Handle key releases for movement
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = false;
                    break;
                    
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = false;
                    break;
                    
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = false;
                    break;
                    
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = false;
                    break;
                    
                case 'ShiftLeft':
                    this.isSprinting = false;
                    break;
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            // Update UI based on pointer lock state
            const instructions = document.getElementById('instructions');
            if (instructions) {
                instructions.style.display = this.controls.isLocked ? 'none' : 'block';
            }
            
            // Reset movement when pointer is unlocked
            if (!this.controls.isLocked) {
                this.moveForward = false;
                this.moveBackward = false;
                this.moveLeft = false;
                this.moveRight = false;
                this.isSprinting = false;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Initialize sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleSound();
            });
        }
    }
    
    animate() {
        try {
            requestAnimationFrame(() => this.animate());
            
            // Calculate delta time
            const time = performance.now();
            const delta = (time - this.prevTime) / 1000; // Convert to seconds
            
            // Check if any movement keys are pressed
            const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
            
            // Basic movement implementation
            if (isMoving) {
                // Calculate the base movement speed
                const baseSpeed = this.playerSpeed * delta;
                
                // Apply sprint multiplier if sprinting
                const speedMultiplier = this.isSprinting ? this.sprintMultiplier : 1.0;
                
                // Calculate final movement speed
                const moveSpeed = baseSpeed * speedMultiplier * 0.1; // Scaling factor
                
                // Apply movement based on key presses
                if (this.moveForward) {
                    this.controls.moveForward(moveSpeed);
                }
                if (this.moveBackward) {
                    this.controls.moveForward(-moveSpeed);
                }
                if (this.moveLeft) {
                    this.controls.moveRight(-moveSpeed);
                }
                if (this.moveRight) {
                    this.controls.moveRight(moveSpeed);
                }
            }
            
            // Animate static player with constant speed
            this.animateSimpleStaticPlayer(delta);
            
            // Update debug info
            if (this.debugMode) {
                this.updateDebugInfo();
            }
            
            // Store current time for next frame
            this.prevTime = time;
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error("Error in animate method:", error);
        }
    }
    
    // Simplified animation method
    animateSimpleStaticPlayer(delta, speedMultiplier = 1.0) {
        if (!this.staticPlayerModel) {
            console.error("No static player model found for animation");
            return;
        }
        
        try {
            // Always use base speed for static player, ignoring any sprint multiplier
            const staticPlayerSpeed = this.playerSpeed;
            
            // Update animation clock - use constant speed for animation
            this.animationClock += delta * staticPlayerSpeed;
            
            // Calculate leg and arm swing based on sine wave
            // Use constant animation speed regardless of player sprint
            const legSwing = Math.sin(this.animationClock * Math.PI) * 0.4;
            const armSwing = Math.sin(this.animationClock * Math.PI) * 0.3;
            
            // Apply rotations to legs
            if (this.staticPlayerModel.leftLegGroup) {
                this.staticPlayerModel.leftLegGroup.rotation.x = legSwing;
            }
            if (this.staticPlayerModel.rightLegGroup) {
                this.staticPlayerModel.rightLegGroup.rotation.x = -legSwing;
            }
            
            // Apply rotations to arms (opposite to legs for natural walking)
            if (this.staticPlayerModel.leftArmGroup) {
                this.staticPlayerModel.leftArmGroup.rotation.x = -armSwing;
            }
            if (this.staticPlayerModel.rightArmGroup) {
                this.staticPlayerModel.rightArmGroup.rotation.x = armSwing;
            }
            
            // Move the player forward - use constant speed regardless of player sprint
            const moveDistance = delta * staticPlayerSpeed;
            this.staticPlayerModel.position.z += moveDistance;
            
            // Reset position if the player goes too far
            if (this.staticPlayerModel.position.z > 10) {
                this.staticPlayerModel.position.z = -30;
            }
        } catch (error) {
            console.error("Error in animateSimpleStaticPlayer:", error);
        }
    }
    
    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.style.display = 'block';
            
            // Calculate delta time for this frame
            const delta = performance.now() / 1000 - this.prevTime / 1000;
            
            // Calculate player's effective speed with sprint
            const playerEffectiveSpeed = this.playerSpeed * (this.isSprinting ? this.sprintMultiplier : 1.0);
            
            // Static player always uses base speed
            const staticPlayerSpeed = this.playerSpeed;
            
            // Check if player is moving
            const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
            
            debugInfo.innerHTML = `
                <div>Bullets: ${this.bulletCount}/${this.maxBullets}</div>
                <div>Can Shoot: ${this.canShoot}</div>
                <div>Is Reloading: ${this.isReloading}</div>
                <div>Is Aiming: ${this.isAimingDownSights}</div>
                <div>Position: ${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)}</div>
                <div>Movement: F:${this.moveForward} B:${this.moveBackward} L:${this.moveLeft} R:${this.moveRight}</div>
                <div>Is Moving: ${isMoving}</div>
                <div>Base Speed: ${this.playerSpeed.toFixed(1)}</div>
                <div>Sprint: ${this.isSprinting ? 'ON' : 'OFF'} (Multiplier: ${this.sprintMultiplier.toFixed(1)}x)</div>
                <div>Player Speed: ${playerEffectiveSpeed.toFixed(1)} (with sprint)</div>
                <div>Static Player Speed: ${staticPlayerSpeed.toFixed(1)} (constant)</div>
                <div>Movement System: Direct control</div>
            `;
        }
    }
    
    shoot() {
        // Debug the current state
        console.log(`Shooting - Bullets: ${this.bulletCount}, CanShoot: ${this.canShoot}, IsReloading: ${this.isReloading}, IsAiming: ${this.isAimingDownSights}`);
        
        if (this.bulletCount <= 0 || !this.canShoot || this.isReloading) {
            // Play empty click sound
            if (this.bulletCount <= 0) {
                console.log('Empty click');
                // Create and play a click sound if not muted
                if (!this.muted) {
                    const clickSound = new Audio('./sounds/empty_click.mp3');
                    clickSound.volume = 0.5;
                    clickSound.play().catch(e => console.error('Error playing empty click:', e));
                }
            }
            return;
        }
        
        // Calculate spread based on aiming
        const spread = this.isAimingDownSights ? 0.01 : 0.05; // Less spread when aiming
        
        // Add spread to raycaster
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        
        // Update raycaster direction with spread
        const direction = new THREE.Vector3(spreadX, spreadY, -1);
        direction.unproject(this.camera);
        direction.sub(this.camera.position).normalize();
        
        // Create raycaster with spread
        const raycaster = new THREE.Raycaster(this.camera.position, direction);
        
        // Prevent rapid firing
        this.canShoot = false;
        
        // Decrease bullet count
        this.bulletCount--;
        console.log(`Bullets remaining: ${this.bulletCount}`);
        
        // Update ammo counter
        this.updateAmmoCounter();
        
        // Play gunshot sound if not muted
        console.log('Playing gunshot sound');
        if (!this.muted) {
            const gunshotSound = new Audio('./sounds/m1_garand_shot.mp3');
            gunshotSound.volume = 0.5;
            gunshotSound.play().catch(e => console.error('Error playing gunshot:', e));
            
            // Play M1 Garand ping if last bullet
            if (this.bulletCount === 0) {
                setTimeout(() => {
                    const pingSound = new Audio('./sounds/m1_garand_ping.mp3');
                    pingSound.volume = 0.5;
                    pingSound.play().catch(e => console.error('Error playing ping:', e));
                }, 300);
            }
        }
        
        // Show muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlash.visible = true;
            setTimeout(() => {
                this.muzzleFlash.visible = false;
            }, 50);
        }
        
        // Create bullet impact
        this.createBulletImpact();
        
        // Add recoil effect
        this.addRecoilEffect();
        
        // Auto reload if empty
        if (this.bulletCount === 0) {
            setTimeout(() => this.reload(), 1000);
        }
        
        // Reset shooting ability after delay
        setTimeout(() => {
            this.canShoot = true;
            console.log('Ready to shoot again');
        }, 200);
    }
    
    reload() {
        if (this.isReloading || this.bulletCount >= this.maxBullets) return;
        
        this.isReloading = true;
        
        // Play reload sound if not muted
        console.log('Playing reload sound');
        if (!this.muted) {
            const reloadSound = new Audio('./sounds/m1_garand_reload.mp3');
            reloadSound.volume = 0.5;
            reloadSound.play().catch(e => console.error('Error playing reload sound:', e));
        }
        
        // Reload animation could be added here
        
        // Complete reload after delay
        setTimeout(() => {
            this.bulletCount = this.maxBullets;
            this.isReloading = false;
            this.updateAmmoCounter();
        }, 2000);
    }
    
    toggleAim() {
        this.isAimingDownSights = !this.isAimingDownSights;
        
        // When aiming, hide the weapon body but keep the sights visible
        if (this.isAimingDownSights) {
            this.weaponBody.visible = false;
        } else {
            this.weaponBody.visible = true;
        }
        
        const fovTransition = () => {
            const currentFOV = this.camera.fov;
            const targetFOV = this.isAimingDownSights ? this.aimFOV : this.defaultFOV;
            
            // Smoothly transition FOV
            if (Math.abs(currentFOV - targetFOV) > 0.1) {
                this.camera.fov += (targetFOV - currentFOV) * 0.1;
                this.camera.updateProjectionMatrix();
                requestAnimationFrame(fovTransition);
            } else {
                this.camera.fov = targetFOV;
                this.camera.updateProjectionMatrix();
            }
        };
        
        fovTransition();
        
        // Update debug info
        if (this.debugMode) {
            this.updateDebugInfo();
        }
    }
    
    toggleSound() {
        // Toggle mute state
        this.muted = !this.muted;
        
        // Update sound toggle button
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            if (this.muted) {
                soundToggle.textContent = '🔇';
                soundToggle.className = 'sound-off';
            } else {
                soundToggle.textContent = '🔊';
                soundToggle.className = 'sound-on';
            }
        }
        
        console.log('Sound ' + (this.muted ? 'muted' : 'unmuted'));
    }
    
    updateAmmoCounter() {
        const ammoCounter = document.getElementById('ammo');
        if (ammoCounter) {
            ammoCounter.textContent = `${this.bulletCount}/${this.maxBullets}`;
            
            // Highlight the ammo counter when low on ammo
            if (this.bulletCount <= 2) {
                ammoCounter.style.color = '#ff4444';
                ammoCounter.style.animation = 'pulse 1s infinite';
            } else {
                ammoCounter.style.color = 'white';
                ammoCounter.style.animation = 'none';
            }
        }
    }
    
    createBulletImpact() {
        // Create a raycaster for bullet trajectory
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        
        // Check for intersections with objects in the scene
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            // Get the first intersection point
            const intersection = intersects[0];
            
            // Create a simple bullet hole
            const bulletHole = new THREE.Mesh(
                new THREE.CircleGeometry(0.05, 8),
                new THREE.MeshBasicMaterial({ color: 0x000000 })
            );
            
            // Position the bullet hole at the intersection point
            bulletHole.position.copy(intersection.point);
            
            // Orient the bullet hole to face the camera
            bulletHole.lookAt(this.camera.position);
            
            // Add a small offset to prevent z-fighting
            bulletHole.position.add(intersection.face.normal.multiplyScalar(0.01));
            
            // Add the bullet hole to the scene
            this.scene.add(bulletHole);
            
            // Create simple impact particles
            this.createImpactParticles(intersection.point, intersection.face.normal);
        }
    }
    
    createImpactParticles(position, normal) {
        // Create a simple particle system for impact effect
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFFF00,
            size: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        // Create particles
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            // Random position around impact point
            const x = position.x + (Math.random() - 0.5) * 0.2;
            const y = position.y + (Math.random() - 0.5) * 0.2;
            const z = position.z + (Math.random() - 0.5) * 0.2;
            
            particles.push(x, y, z);
        }
        
        // Set particle positions
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particles, 3));
        
        // Create particle system
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);
        
        // Remove particles after a short time
        setTimeout(() => {
            this.scene.remove(particleSystem);
            particleGeometry.dispose();
            particleMaterial.dispose();
        }, 500);
    }
    
    addRecoilEffect() {
        // Recoil effect that's reduced when aiming
        if (this.weapon) {
            // Store original position
            const originalPosition = this.weapon.position.clone();
            
            // Calculate recoil amount (less when aiming)
            const recoilAmount = this.isAimingDownSights ? 0.02 : 0.05;
            
            // Apply recoil to weapon
            this.weapon.position.z += recoilAmount;
            
            // Apply camera recoil
            const cameraRecoil = this.isAimingDownSights ? 0.2 : 0.5;
            this.camera.rotation.x -= THREE.MathUtils.degToRad(cameraRecoil);
            
            // Return weapon to original position
            setTimeout(() => {
                this.weapon.position.copy(originalPosition);
            }, 100);
            
            // Return camera to original rotation
            setTimeout(() => {
                this.camera.rotation.x += THREE.MathUtils.degToRad(cameraRecoil);
            }, 150);
        }
    }
    
    updateWeaponSway() {
        if (!this.weapon) return;
        
        const targetPosition = this.isAimingDownSights ? this.weaponAimPosition : this.weaponDefaultPosition;
        const targetRotation = this.isAimingDownSights ? this.weaponAimRotation : this.weaponDefaultRotation;
        
        // Calculate movement amount based on velocity
        const swayAmount = this.isAimingDownSights ? 0.002 : 0.005;
        const bobAmount = this.isAimingDownSights ? 0.002 : 0.005;
        
        // Add subtle weapon sway
        const time = performance.now() * 0.001;
        const swayX = Math.sin(time * 1.5) * swayAmount;
        const swayY = Math.cos(time * 2) * swayAmount;
        
        // Add movement-based bob
        const speedBob = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        const bobX = Math.sin(time * 10) * speedBob * bobAmount;
        const bobY = Math.abs(Math.cos(time * 5)) * speedBob * bobAmount;
        
        // Smoothly interpolate position
        this.weapon.position.lerp(
            new THREE.Vector3(
                targetPosition.x + swayX + bobX,
                targetPosition.y + swayY + bobY,
                targetPosition.z
            ),
            this.aimTransitionSpeed * 0.016
        );
        
        // Smoothly interpolate rotation
        this.weapon.rotation.x += (targetRotation.x - this.weapon.rotation.x) * this.aimTransitionSpeed * 0.016;
        this.weapon.rotation.y += (targetRotation.y - this.weapon.rotation.y) * this.aimTransitionSpeed * 0.016;
        this.weapon.rotation.z += (targetRotation.z - this.weapon.rotation.z) * this.aimTransitionSpeed * 0.016;
    }
    
    createStaticPlayerModel(x, y, z) {
        // Create a group for the player model
        const playerGroup = new THREE.Group();
        
        // Define materials with better colors for LEGO-style appearance
        const skinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE0AC69, // Light skin tone
            roughness: 0.3,
            metalness: 0.1
        });
        
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, // Dark gray
            roughness: 0.2,
            metalness: 0.3
        });
        
        const uniformMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4D5D53, // Field gray (slightly more green-tinted)
            roughness: 0.4,
            metalness: 0.1
        });
        
        const beltMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Black
            roughness: 0.3,
            metalness: 0.2
        });
        
        const leatherMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3D2817, // Brown leather
            roughness: 0.6,
            metalness: 0.1
        });
        
        // LEGO-style head (more cylindrical)
        const headGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 16);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        
        // Create improved German Stahlhelm (helmet)
        // Main helmet dome - complete shape to avoid gaps
        const helmetGeometry = new THREE.SphereGeometry(0.25, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.scale.set(1.1, 0.8, 1.1);
        helmet.position.y = 1.78; // Raised significantly higher
        helmet.position.z = -0.05; // Moved further back
        helmet.castShadow = true;
        
        // Helmet rim - complete circle to avoid gaps
        const helmetRimGeometry = new THREE.TorusGeometry(0.27, 0.04, 16, 32);
        const helmetRim = new THREE.Mesh(helmetRimGeometry, helmetMaterial);
        helmetRim.position.y = 1.7; // Raised higher
        helmetRim.position.z = -0.05; // Moved back
        helmetRim.rotation.x = Math.PI / 2;
        helmetRim.castShadow = true;
        
        // Helmet neck guard - characteristic of Stahlhelm
        const neckGuardGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.15);
        const neckGuard = new THREE.Mesh(neckGuardGeometry, helmetMaterial);
        neckGuard.position.set(0, 1.7, -0.23); // Adjusted position
        neckGuard.castShadow = true;
        
        // Helmet side flares - characteristic of Stahlhelm
        const leftFlareGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.15);
        const leftFlare = new THREE.Mesh(leftFlareGeometry, helmetMaterial);
        leftFlare.position.set(-0.25, 1.7, -0.05); // Adjusted position
        leftFlare.rotation.z = Math.PI / 6;
        leftFlare.castShadow = true;
        
        const rightFlareGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.15);
        const rightFlare = new THREE.Mesh(rightFlareGeometry, helmetMaterial);
        rightFlare.position.set(0.25, 1.7, -0.05); // Adjusted position
        rightFlare.rotation.z = -Math.PI / 6;
        rightFlare.castShadow = true;
        
        // Helmet front extension (more accurate)
        const frontBrimGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.1);
        const frontBrim = new THREE.Mesh(frontBrimGeometry, helmetMaterial);
        frontBrim.position.set(0, 1.7, 0.2); // Adjusted position
        frontBrim.castShadow = true;
        
        // Inner helmet liner to fill any gaps
        const helmetLinerGeometry = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const helmetLiner = new THREE.Mesh(helmetLinerGeometry, helmetMaterial);
        helmetLiner.scale.set(1.05, 0.75, 1.05);
        helmetLiner.position.y = 1.78; // Raised to match helmet
        helmetLiner.position.z = -0.05; // Moved back to match helmet
        helmetLiner.castShadow = true;
        
        // LEGO-style torso (more rectangular)
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.2);
        const torso = new THREE.Mesh(torsoGeometry, uniformMaterial);
        torso.position.y = 1.25;
        torso.castShadow = true;
        
        // Belt
        const beltGeometry = new THREE.BoxGeometry(0.42, 0.08, 0.22);
        const belt = new THREE.Mesh(beltGeometry, beltMaterial);
        belt.position.y = 1.0;
        belt.castShadow = true;
        
        // Belt buckle (more prominent)
        const buckleGeometry = new THREE.BoxGeometry(0.12, 0.1, 0.05);
        const buckle = new THREE.Mesh(buckleGeometry, new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0,
            roughness: 0.2,
            metalness: 0.8
        }));
        buckle.position.set(0, 1.0, 0.14);
        buckle.castShadow = true;
        
        // Hip connector to fix the gap between legs and waist
        const hipGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.2);
        const hip = new THREE.Mesh(hipGeometry, uniformMaterial);
        hip.position.y = 0.9;
        hip.castShadow = true;
        
        // Create leg groups for animation
        const leftLegGroup = new THREE.Group();
        const rightLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.12, 0.9, 0);
        rightLegGroup.position.set(0.12, 0.9, 0);
        
        // LEGO-style legs (more blocky) - adjusted for animation
        const legGeometry = new THREE.BoxGeometry(0.18, 0.5, 0.18);
        const legMaterial = uniformMaterial.clone();
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(0, -0.3, 0); // Position relative to leg group
        leftLeg.castShadow = true;
        leftLegGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0, -0.3, 0); // Position relative to leg group
        rightLeg.castShadow = true;
        rightLegGroup.add(rightLeg);
        
        // LEGO-style boots (flat on bottom)
        const bootGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.22);
        const bootMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.3,
            metalness: 0.2
        });
        
        const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        leftBoot.position.set(0, -0.6, 0.02); // Position relative to leg group
        leftBoot.castShadow = true;
        leftLegGroup.add(leftBoot);
        
        const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        rightBoot.position.set(0, -0.6, 0.02); // Position relative to leg group
        rightBoot.castShadow = true;
        rightLegGroup.add(rightBoot);
        
        // Create arm groups for animation
        const leftArmGroup = new THREE.Group();
        const rightArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.28, 1.25, 0);
        rightArmGroup.position.set(0.28, 1.25, 0);
        
        // LEGO-style arms (cylindrical with angle)
        const armGeometry = new THREE.BoxGeometry(0.15, 0.45, 0.15);
        const armMaterial = uniformMaterial.clone();
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(0, 0, 0); // Position relative to arm group
        leftArm.castShadow = true;
        leftArmGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0, 0, 0); // Position relative to arm group
        rightArm.castShadow = true;
        rightArmGroup.add(rightArm);
        
        // LEGO-style hands (C-shaped)
        const handGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
        
        const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
        leftHand.rotation.x = Math.PI / 2;
        leftHand.position.set(0, -0.25, 0); // Position relative to arm group
        leftHand.castShadow = true;
        leftArmGroup.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
        rightHand.rotation.x = Math.PI / 2;
        rightHand.position.set(0, -0.25, 0); // Position relative to arm group
        rightHand.castShadow = true;
        rightArmGroup.add(rightHand);
        
        // Create rifle (Kar98k) - more LEGO-like
        const rifleGroup = new THREE.Group();
        
        // Rifle body
        const rifleBodyGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.8);
        const rifleBody = new THREE.Mesh(rifleBodyGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x5C3A21, // Wood color
            roughness: 0.7,
            metalness: 0.1
        }));
        rifleBody.position.set(0, 0, 0);
        rifleBody.castShadow = true;
        rifleGroup.add(rifleBody);
        
        // Rifle barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.7
        }));
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.3);
        barrel.castShadow = true;
        rifleGroup.add(barrel);
        
        // Rifle stock
        const rifleStockGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.3);
        const rifleStock = new THREE.Mesh(rifleStockGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x5C3A21,
            roughness: 0.7,
            metalness: 0.1
        }));
        rifleStock.position.set(0, -0.02, 0.3);
        rifleStock.castShadow = true;
        rifleGroup.add(rifleStock);
        
        // Rifle bolt
        const boltGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const bolt = new THREE.Mesh(boltGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.7
        }));
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(0.06, 0.03, 0.1);
        bolt.castShadow = true;
        rifleGroup.add(bolt);
        
        // Position rifle in right hand
        rifleGroup.position.set(0.4, 1.0, 0.1);
        rifleGroup.rotation.y = Math.PI / 2;
        rifleGroup.rotation.z = Math.PI / 12;
        
        // Create equipment - more LEGO-like
        // Bread bag
        const breadBagGeometry = new THREE.BoxGeometry(0.18, 0.15, 0.1);
        const breadBag = new THREE.Mesh(breadBagGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x6B8E23, // Olive green
            roughness: 0.6,
            metalness: 0.1
        }));
        breadBag.position.set(-0.2, 1.0, 0.15);
        breadBag.castShadow = true;
        
        // Water canteen
        const canteenGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8);
        const canteen = new THREE.Mesh(canteenGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x3D2817,
            roughness: 0.5,
            metalness: 0.2
        }));
        canteen.position.set(0.2, 1.0, 0.15);
        canteen.castShadow = true;
        
        // Gas mask container (cylindrical)
        const gasMaskGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
        const gasMask = new THREE.Mesh(gasMaskGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x2C2C2C,
            roughness: 0.4,
            metalness: 0.3
        }));
        gasMask.rotation.x = Math.PI / 2;
        gasMask.position.set(0, 1.0, -0.15);
        gasMask.castShadow = true;
        
        // Add all parts to player group
        playerGroup.add(head);
        playerGroup.add(helmetLiner); // Add helmet liner first (behind helmet)
        playerGroup.add(helmet);
        playerGroup.add(helmetRim);
        playerGroup.add(frontBrim);
        playerGroup.add(neckGuard);
        playerGroup.add(leftFlare);
        playerGroup.add(rightFlare);
        playerGroup.add(torso);
        playerGroup.add(belt);
        playerGroup.add(buckle);
        playerGroup.add(hip);
        playerGroup.add(leftLegGroup); // Add leg groups instead of individual legs
        playerGroup.add(rightLegGroup);
        playerGroup.add(leftArmGroup); // Add arm groups instead of individual arms
        playerGroup.add(rightArmGroup);
        playerGroup.add(rifleGroup);
        playerGroup.add(breadBag);
        playerGroup.add(canteen);
        playerGroup.add(gasMask);
        
        // Add uniform details (cleaner pattern)
        // Function to add uniform details
        const addUniformDetail = (parent, width, height, depth, x, y, z, color) => {
            const detailGeometry = new THREE.BoxGeometry(width, height, depth);
            const detailMaterial = new THREE.MeshStandardMaterial({ 
                color: color || 0x6B8E23, // Olive green default
                roughness: 0.5,
                metalness: 0.1
            });
            const detail = new THREE.Mesh(detailGeometry, detailMaterial);
            detail.position.set(x, y, z);
            parent.add(detail);
            return detail;
        };
        
        // Add uniform details to torso (pockets and insignia)
        addUniformDetail(torso, 0.15, 0.12, 0.05, -0.1, 0.05, 0.13, 0x6B8E23); // Left pocket
        addUniformDetail(torso, 0.15, 0.12, 0.05, 0.1, 0.05, 0.13, 0x6B8E23); // Right pocket
        addUniformDetail(torso, 0.15, 0.12, 0.05, 0, -0.1, 0.13, 0x6B8E23); // Lower pocket
        
        // Add face details (more LEGO-like)
        // Eyes
        const eyeGeometry = new THREE.BoxGeometry(0.06, 0.03, 0.01);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.07, 1.65, 0.21);
        playerGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.07, 1.65, 0.21);
        playerGroup.add(rightEye);
        
        // Mouth (simple line)
        const mouthGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.01);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.57, 0.21);
        playerGroup.add(mouth);
        
        // Add insignia (eagle emblem on helmet) - more defined
        const insigniaGeometry = new THREE.PlaneGeometry(0.12, 0.08);
        const insigniaMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xC0C0C0,
            side: THREE.DoubleSide
        });
        
        const eagleInsignia = new THREE.Mesh(insigniaGeometry, insigniaMaterial);
        eagleInsignia.position.set(0, 1.75, 0.26);
        eagleInsignia.rotation.x = Math.PI / 2;
        eagleInsignia.rotation.z = Math.PI;
        playerGroup.add(eagleInsignia);
        
        // Store references for animation
        playerGroup.leftLegGroup = leftLegGroup;
        playerGroup.rightLegGroup = rightLegGroup;
        playerGroup.leftArmGroup = leftArmGroup;
        playerGroup.rightArmGroup = rightArmGroup;
        
        // Position the player
        playerGroup.position.set(x, y, z);
        playerGroup.rotation.y = Math.PI; // Face toward the player
        
        // Add to scene
        this.scene.add(playerGroup);
        
        // Store reference to the player model
        this.staticPlayerModel = playerGroup;
        
        return playerGroup;
    }

    createInstructionsPopup() {
        // Create the instructions container
        const instructionsContainer = document.createElement('div');
        instructionsContainer.id = 'instructions-popup';
        instructionsContainer.style.position = 'absolute';
        instructionsContainer.style.top = '50%';
        instructionsContainer.style.left = '50%';
        instructionsContainer.style.transform = 'translate(-50%, -50%)';
        instructionsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        instructionsContainer.style.color = 'white';
        instructionsContainer.style.padding = '20px';
        instructionsContainer.style.borderRadius = '10px';
        instructionsContainer.style.fontFamily = 'Arial, sans-serif';
        instructionsContainer.style.zIndex = '1000';
        instructionsContainer.style.maxWidth = '500px';
        instructionsContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        
        // Create the header
        const header = document.createElement('h2');
        header.textContent = 'WW2 FPS Controls';
        header.style.textAlign = 'center';
        header.style.marginTop = '0';
        header.style.color = '#FFD700'; // Gold color
        instructionsContainer.appendChild(header);
        
        // Create the controls list
        const controlsList = document.createElement('ul');
        controlsList.style.listStyleType = 'none';
        controlsList.style.padding = '0';
        
        // Define all controls
        const controls = [
            { key: 'W, A, S, D', action: 'Move around' },
            { key: 'SHIFT', action: 'Sprint' },
            { key: 'SPACE', action: 'Jump' },
            { key: 'LEFT CLICK', action: 'Shoot' },
            { key: 'RIGHT CLICK', action: 'Aim down sights' },
            { key: 'R', action: 'Reload weapon' },
            { key: 'F', action: 'Toggle aim' },
            { key: '+/-', action: 'Increase/decrease player speed' },
            { key: 'M', action: 'Match player speeds' },
            { key: 'ESC', action: 'Pause game / Release mouse' }
        ];
        
        // Add each control to the list
        controls.forEach(control => {
            const listItem = document.createElement('li');
            listItem.style.margin = '10px 0';
            listItem.style.display = 'flex';
            listItem.style.justifyContent = 'space-between';
            
            const keySpan = document.createElement('span');
            keySpan.textContent = control.key;
            keySpan.style.backgroundColor = '#333';
            keySpan.style.padding = '3px 8px';
            keySpan.style.borderRadius = '4px';
            keySpan.style.fontFamily = 'monospace';
            keySpan.style.marginRight = '10px';
            keySpan.style.minWidth = '100px';
            keySpan.style.display = 'inline-block';
            keySpan.style.textAlign = 'center';
            
            const actionSpan = document.createElement('span');
            actionSpan.textContent = control.action;
            actionSpan.style.flexGrow = '1';
            
            listItem.appendChild(keySpan);
            listItem.appendChild(actionSpan);
            controlsList.appendChild(listItem);
        });
        
        instructionsContainer.appendChild(controlsList);
        
        // Create start button
        const startButton = document.createElement('button');
        startButton.textContent = 'START GAME';
        startButton.style.display = 'block';
        startButton.style.margin = '20px auto 0';
        startButton.style.padding = '10px 20px';
        startButton.style.backgroundColor = '#4CAF50';
        startButton.style.color = 'white';
        startButton.style.border = 'none';
        startButton.style.borderRadius = '5px';
        startButton.style.cursor = 'pointer';
        startButton.style.fontSize = '16px';
        startButton.style.fontWeight = 'bold';
        startButton.style.transition = 'background-color 0.3s';
        
        startButton.addEventListener('mouseover', () => {
            startButton.style.backgroundColor = '#45a049';
        });
        
        startButton.addEventListener('mouseout', () => {
            startButton.style.backgroundColor = '#4CAF50';
        });
        
        // Store reference to this for use in event handlers
        const game = this;
        
        // Add click event to start button
        startButton.onclick = function() {
            console.log('Start button clicked');
            game.controls.lock();
        };
        
        instructionsContainer.appendChild(startButton);
        
        // Add instructions for showing the popup again
        const note = document.createElement('p');
        note.textContent = 'Press ESC to show these instructions again';
        note.style.textAlign = 'center';
        note.style.fontSize = '12px';
        note.style.marginTop = '15px';
        note.style.opacity = '0.7';
        instructionsContainer.appendChild(note);
        
        // Add to DOM
        document.body.appendChild(instructionsContainer);
        
        // Store reference to instructions container
        this.instructionsContainer = instructionsContainer;
        
        // Show/hide instructions based on pointer lock
        this.controls.addEventListener('lock', () => {
            instructionsContainer.style.display = 'none';
        });
        
        this.controls.addEventListener('unlock', () => {
            instructionsContainer.style.display = 'block';
        });
    }

    // Method to set player speed for all characters
    setPlayerSpeed(speed) {
        if (typeof speed === 'number' && speed > 0) {
            console.log(`Setting player speed to ${speed}`);
            this.playerSpeed = speed;
            return true;
        } else {
            console.error("Invalid speed value. Speed must be a positive number.");
            return false;
        }
    }
    
    // Method to match player speed to static player
    matchPlayerSpeeds() {
        // Reset to default values
        this.playerSpeed = 2.0;
        this.sprintMultiplier = 2.0;
        
        // Reset velocity to prevent lingering momentum
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        console.log("Player and static player speeds configured.");
        console.log("Base speed: 2.0 (used by static player at all times)");
        console.log("Sprint multiplier: 2.0x - Hold SHIFT to sprint (affects only player, not static player)");
        console.log("Movements are now decoupled - static player maintains constant speed");
        console.log("Drifting has been eliminated - player will stop immediately when keys are released");
        
        return true;
    }
}
