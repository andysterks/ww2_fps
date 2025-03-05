import * as THREE from '/node_modules/three/build/three.module.js';

console.log("Test script loaded");

// Initialize the scene when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing test scene...");
    
    try {
        // Create scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Set up renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        // Create a simple cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Position camera
        camera.position.z = 5;
        
        // Add some text to the screen
        const textDiv = document.createElement('div');
        textDiv.style.position = 'absolute';
        textDiv.style.top = '50px';
        textDiv.style.left = '50px';
        textDiv.style.color = 'white';
        textDiv.style.backgroundColor = 'black';
        textDiv.style.padding = '10px';
        textDiv.style.zIndex = '1000';
        textDiv.textContent = 'Test scene running';
        document.body.appendChild(textDiv);
        
        // Animation function
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Rotate cube
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            
            // Render scene
            renderer.render(scene, camera);
        };
        
        // Start animation
        animate();
        
        console.log("Test scene created and running");
    } catch (error) {
        console.error("Error initializing test scene:", error);
        
        // Display error on screen
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.color = 'red';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.zIndex = '1000';
        errorDiv.textContent = `Test scene error: ${error.message}`;
        document.body.appendChild(errorDiv);
    }
}); 