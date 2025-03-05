import * as THREE from '/node_modules/three/build/three.module.js';

// Diagnostic information container
const diagnostics = {
    webgl: {
        supported: false,
        renderer: null,
        extensions: [],
        maxTextureSize: 0,
        vendor: '',
        renderer: '',
        version: '',
        shadingLanguageVersion: '',
        errors: []
    },
    three: {
        version: THREE.REVISION,
        loaded: true
    },
    browser: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        language: navigator.language,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown'
    },
    screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        colorDepth: window.screen.colorDepth
    },
    tests: {
        basicRendering: false,
        animation: false,
        materials: false,
        lighting: false,
        shadows: false
    }
};

// Log function that both logs to console and updates the UI
function log(message, type = 'info') {
    const logElement = document.getElementById('log');
    if (logElement) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = message;
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Function to check WebGL support
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        diagnostics.webgl.supported = true;
        diagnostics.webgl.vendor = gl.getParameter(gl.VENDOR);
        diagnostics.webgl.renderer = gl.getParameter(gl.RENDERER);
        diagnostics.webgl.version = gl.getParameter(gl.VERSION);
        diagnostics.webgl.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        diagnostics.webgl.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // Get supported extensions
        const extensions = gl.getSupportedExtensions();
        diagnostics.webgl.extensions = extensions || [];
        
        log(`WebGL supported: ${diagnostics.webgl.version}`, 'success');
        log(`Renderer: ${diagnostics.webgl.renderer}`, 'info');
        log(`Vendor: ${diagnostics.webgl.vendor}`, 'info');
        log(`Max texture size: ${diagnostics.webgl.maxTextureSize}`, 'info');
        
        return true;
    } catch (error) {
        diagnostics.webgl.supported = false;
        diagnostics.webgl.errors.push(error.message);
        log(`WebGL not supported: ${error.message}`, 'error');
        return false;
    }
}

// Function to run basic Three.js tests
async function runThreeJsTests() {
    log('Starting Three.js tests...', 'info');
    
    try {
        // Create container for the test scene
        const container = document.createElement('div');
        container.id = 'three-container';
        container.style.width = '100%';
        container.style.height = '300px';
        container.style.position = 'relative';
        document.getElementById('test-container').appendChild(container);
        
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        camera.position.z = 5;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        
        log('Basic scene setup complete', 'success');
        diagnostics.tests.basicRendering = true;
        
        // Test basic geometry and materials
        const geometries = [
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.ConeGeometry(0.5, 1, 32)
        ];
        
        const materials = [
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
            new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 })
        ];
        
        // Create meshes
        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const mesh = new THREE.Mesh(geometries[i], materials[i]);
            mesh.position.x = (i - 1) * 2;
            scene.add(mesh);
            meshes.push(mesh);
        }
        
        log('Created test geometries and materials', 'success');
        diagnostics.tests.materials = true;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 2, 0);
        scene.add(pointLight);
        
        log('Added lights to the scene', 'success');
        diagnostics.tests.lighting = true;
        
        // Test shadows
        try {
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            
            // Add a plane to receive shadows
            const planeGeometry = new THREE.PlaneGeometry(10, 10);
            const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = -1;
            plane.receiveShadow = true;
            scene.add(plane);
            
            // Make meshes cast shadows
            meshes.forEach(mesh => {
                mesh.castShadow = true;
            });
            
            log('Shadow rendering enabled', 'success');
            diagnostics.tests.shadows = true;
        } catch (error) {
            log(`Shadow test failed: ${error.message}`, 'warning');
        }
        
        // Animation function
        let frameCount = 0;
        const animate = () => {
            const animationId = requestAnimationFrame(animate);
            
            // Rotate meshes
            meshes.forEach((mesh, index) => {
                mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.01 * (index + 1);
            });
            
            // Move point light in a circle
            const time = Date.now() * 0.001;
            pointLight.position.x = Math.sin(time) * 3;
            pointLight.position.z = Math.cos(time) * 3;
            
            // Render scene
            renderer.render(scene, camera);
            
            frameCount++;
            if (frameCount === 60) {
                log('Animation test passed: 60 frames rendered', 'success');
                diagnostics.tests.animation = true;
            }
            
            // Stop after 120 frames to prevent unnecessary rendering
            if (frameCount >= 120) {
                cancelAnimationFrame(animationId);
                log('All tests completed', 'success');
                updateDiagnosticSummary();
            }
        };
        
        // Start animation
        animate();
        
    } catch (error) {
        log(`Three.js test failed: ${error.message}`, 'error');
        console.error(error);
    }
}

// Update the diagnostic summary
function updateDiagnosticSummary() {
    const summaryElement = document.getElementById('summary');
    if (!summaryElement) return;
    
    // Create a formatted summary
    let summary = '<h3>Diagnostic Summary</h3>';
    
    // WebGL support
    summary += `<div class="summary-section">
        <h4>WebGL</h4>
        <p class="${diagnostics.webgl.supported ? 'success' : 'error'}">
            Supported: ${diagnostics.webgl.supported ? 'Yes' : 'No'}
        </p>
        ${diagnostics.webgl.supported ? `
            <p>Renderer: ${diagnostics.webgl.renderer}</p>
            <p>Vendor: ${diagnostics.webgl.vendor}</p>
            <p>Version: ${diagnostics.webgl.version}</p>
            <p>Shading Language: ${diagnostics.webgl.shadingLanguageVersion}</p>
            <p>Max Texture Size: ${diagnostics.webgl.maxTextureSize}</p>
        ` : `
            <p class="error">Errors: ${diagnostics.webgl.errors.join(', ')}</p>
        `}
    </div>`;
    
    // Three.js
    summary += `<div class="summary-section">
        <h4>Three.js</h4>
        <p>Version: r${diagnostics.three.version}</p>
        <p class="${diagnostics.three.loaded ? 'success' : 'error'}">
            Loaded: ${diagnostics.three.loaded ? 'Yes' : 'No'}
        </p>
    </div>`;
    
    // Browser
    summary += `<div class="summary-section">
        <h4>Browser</h4>
        <p>User Agent: ${diagnostics.browser.userAgent}</p>
        <p>Platform: ${diagnostics.browser.platform}</p>
        <p>CPU Cores: ${diagnostics.browser.hardwareConcurrency}</p>
        <p>Memory: ${diagnostics.browser.deviceMemory}</p>
    </div>`;
    
    // Screen
    summary += `<div class="summary-section">
        <h4>Display</h4>
        <p>Resolution: ${diagnostics.screen.width}x${diagnostics.screen.height}</p>
        <p>Pixel Ratio: ${diagnostics.screen.pixelRatio}</p>
        <p>Color Depth: ${diagnostics.screen.colorDepth}</p>
    </div>`;
    
    // Tests
    summary += `<div class="summary-section">
        <h4>Tests</h4>
        <p class="${diagnostics.tests.basicRendering ? 'success' : 'error'}">
            Basic Rendering: ${diagnostics.tests.basicRendering ? 'Passed' : 'Failed'}
        </p>
        <p class="${diagnostics.tests.animation ? 'success' : 'error'}">
            Animation: ${diagnostics.tests.animation ? 'Passed' : 'Failed'}
        </p>
        <p class="${diagnostics.tests.materials ? 'success' : 'error'}">
            Materials: ${diagnostics.tests.materials ? 'Passed' : 'Failed'}
        </p>
        <p class="${diagnostics.tests.lighting ? 'success' : 'error'}">
            Lighting: ${diagnostics.tests.lighting ? 'Passed' : 'Failed'}
        </p>
        <p class="${diagnostics.tests.shadows ? 'success' : 'error'}">
            Shadows: ${diagnostics.tests.shadows ? 'Passed' : 'Failed'}
        </p>
    </div>`;
    
    // Update the summary element
    summaryElement.innerHTML = summary;
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    log('Diagnostic tool loaded', 'info');
    
    // Check WebGL support
    if (checkWebGLSupport()) {
        // Run Three.js tests
        runThreeJsTests();
    } else {
        log('Skipping Three.js tests due to lack of WebGL support', 'warning');
        updateDiagnosticSummary();
    }
}); 