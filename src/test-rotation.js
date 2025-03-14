import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TestPlayerRotation from './components/player/TestPlayerRotation.js';

// Log that the module is being imported
console.log('Test rotation script is being imported');

// Main class for the test scene
class RotationTestScene {
    constructor() {
        console.log('Initializing RotationTestScene');
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // Position camera to view the model from a good angle
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 1, 0);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x2c3e50);
        document.body.appendChild(this.renderer.domElement);
        
        // Add orbit controls for easy viewing
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0); // Look at player height
        this.controls.update();
        
        // Frame counter for logging
        this.frameCounter = 0;
        
        // Clock for tracking time
        this.clock = new THREE.Clock();
        
        // Add lighting
        this.setupLighting();
        
        // Add ground
        this.addGround();
        
        // Add coordinate axes
        this.addCoordinateAxes();
        
        // Create test player
        try {
            console.log('Creating test player rotation model');
            this.testPlayer = new TestPlayerRotation(this.scene, this);
            console.log('Test player rotation model created successfully');
        } catch (error) {
            console.error('Error creating test player:', error);
            throw new Error('Failed to create test player: ' + error.message);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Start animation loop
        this.animate();
        
        console.log("Rotation test scene initialized");
    }
    
    // Setup lighting for the scene
    setupLighting() {
        console.log('Setting up lighting');
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Hemisphere light for better outdoor lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3f7b9d, 0.6);
        this.scene.add(hemisphereLight);
    }
    
    // Add ground plane
    addGround() {
        console.log('Adding ground plane');
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3f7b9d,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add grid helper for better visualization
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);
    }
    
    // Add coordinate axes
    addCoordinateAxes() {
        console.log('Adding coordinate axes');
        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);
    }
    
    // Handle window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.frameCounter++;
        
        // Get the actual time delta
        const delta = this.clock.getDelta();
        
        // Update test player with actual delta time
        if (this.testPlayer) {
            try {
                this.testPlayer.update(delta);
            } catch (error) {
                console.error('Error updating test player:', error);
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Log occasional status
        if (this.frameCounter % 300 === 0) {
            console.log(`Running frame ${this.frameCounter}`);
        }
    }
    
    // Simple stub method to match the expected API
    createSimpleWeaponModel() {
        console.log('Creating simple weapon model');
        // Create a group for the weapon
        const weapon = new THREE.Group();
        
        // Rifle body
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 1.2),
            new THREE.MeshLambertMaterial({ color: 0x5c2e00 })
        );
        rifleBody.position.z = 0.6;
        weapon.add(rifleBody);
        
        // Rifle barrel
        const rifleBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        rifleBarrel.rotation.x = Math.PI / 2;
        rifleBarrel.position.z = 1.1;
        weapon.add(rifleBarrel);
        
        // Rifle scope
        const rifleScope = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8),
            new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        rifleScope.position.y = 0.08;
        rifleScope.position.z = 0.8;
        weapon.add(rifleScope);
        
        return weapon;
    }
}

// Create and initialize the test scene
console.log('Creating rotation test scene');
let testScene = null;

try {
    testScene = new RotationTestScene();
    
    // Add title and instructions
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '10px';
    infoDiv.style.left = '10px';
    infoDiv.style.color = 'white';
    infoDiv.style.fontFamily = 'Arial, sans-serif';
    infoDiv.style.padding = '10px';
    infoDiv.style.background = 'rgba(0, 0, 0, 0.5)';
    infoDiv.style.borderRadius = '5px';
    infoDiv.innerHTML = `
        <h2>Player Rotation Test</h2>
        <p>The green player model will continuously:</p>
        <ul>
            <li>Rotate 360° horizontally (smooth)</li>
            <li>Look up and down (smooth)</li>
            <li>Aim down sights</li>
        </ul>
        <p>Use mouse to orbit around the model<br>
        Scroll wheel to zoom in/out</p>
    `;
    document.body.appendChild(infoDiv);
    
    console.log('Rotation test scene setup complete');
} catch (error) {
    console.error('Error creating test scene:', error);
    // Show error on page
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '1000';
    errorDiv.textContent = 'Error: ' + error.message;
    document.body.appendChild(errorDiv);
}

export default testScene; 