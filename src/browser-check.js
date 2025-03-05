// Browser Compatibility Checker for WebGL and Three.js
// This script checks if the browser supports all the features needed for the game

document.addEventListener('DOMContentLoaded', () => {
    const resultElement = document.getElementById('results');
    const detailsElement = document.getElementById('details');
    const checkButton = document.getElementById('check-button');
    
    // Results object to store all compatibility checks
    const results = {
        browser: {
            name: getBrowserName(),
            version: getBrowserVersion(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            mobile: isMobile(),
            supported: false
        },
        webgl: {
            supported: false,
            version: null,
            extensions: [],
            renderer: null,
            vendor: null,
            maxTextureSize: null
        },
        features: {
            webWorkers: 'Worker' in window,
            localStorage: storageAvailable('localStorage'),
            sessionStorage: storageAvailable('sessionStorage'),
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            pointerLock: 'pointerLockElement' in document || 
                         'mozPointerLockElement' in document || 
                         'webkitPointerLockElement' in document,
            fullscreen: 'fullscreenEnabled' in document || 
                        'mozFullScreenEnabled' in document || 
                        'webkitFullscreenEnabled' in document,
            fileAPI: 'FileReader' in window,
            webSockets: 'WebSocket' in window,
            webRTC: 'RTCPeerConnection' in window,
            gamepad: 'getGamepads' in navigator || 'webkitGetGamepads' in navigator
        },
        performance: {
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            connectionType: getConnectionType(),
            score: 0
        },
        overall: {
            compatible: false,
            score: 0,
            issues: []
        }
    };
    
    // Function to run all compatibility checks
    function runCompatibilityChecks() {
        updateStatus('Running compatibility checks...');
        
        // Check WebGL support
        checkWebGLSupport()
            .then(() => {
                // Calculate overall compatibility
                calculateOverallCompatibility();
                
                // Display results
                displayResults();
                
                updateStatus('Compatibility checks complete!', 'success');
            })
            .catch(error => {
                console.error('Error during compatibility checks:', error);
                updateStatus('Error during compatibility checks: ' + error.message, 'error');
            });
    }
    
    // Function to check WebGL support
    function checkWebGLSupport() {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2') || 
                           canvas.getContext('webgl') || 
                           canvas.getContext('experimental-webgl');
                
                if (!gl) {
                    results.webgl.supported = false;
                    results.overall.issues.push('WebGL not supported');
                    resolve();
                    return;
                }
                
                // WebGL is supported
                results.webgl.supported = true;
                results.webgl.version = gl instanceof WebGL2RenderingContext ? '2.0' : '1.0';
                
                // Get WebGL info
                results.webgl.renderer = gl.getParameter(gl.RENDERER);
                results.webgl.vendor = gl.getParameter(gl.VENDOR);
                results.webgl.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                
                // Get supported extensions
                const extensions = gl.getSupportedExtensions();
                results.webgl.extensions = extensions || [];
                
                // Check for required extensions
                const requiredExtensions = [
                    'OES_texture_float',
                    'OES_texture_float_linear',
                    'OES_element_index_uint',
                    'WEBGL_depth_texture'
                ];
                
                for (const ext of requiredExtensions) {
                    if (!extensions.includes(ext)) {
                        results.overall.issues.push(`Missing WebGL extension: ${ext}`);
                    }
                }
                
                resolve();
            } catch (error) {
                results.webgl.supported = false;
                results.overall.issues.push('Error checking WebGL support: ' + error.message);
                resolve(); // Resolve anyway to continue with other checks
            }
        });
    }
    
    // Function to calculate overall compatibility
    function calculateOverallCompatibility() {
        // Calculate browser support
        const modernBrowsers = ['chrome', 'firefox', 'safari', 'edge'];
        results.browser.supported = modernBrowsers.includes(results.browser.name.toLowerCase());
        
        // Calculate performance score (0-100)
        let perfScore = 0;
        
        // CPU cores
        const cores = parseInt(results.performance.hardwareConcurrency) || 1;
        perfScore += Math.min(cores * 10, 40); // Max 40 points for CPU
        
        // Memory
        const memory = parseInt(results.performance.deviceMemory) || 1;
        perfScore += Math.min(memory * 5, 30); // Max 30 points for memory
        
        // Connection
        if (results.performance.connectionType === 'wifi' || 
            results.performance.connectionType === 'ethernet') {
            perfScore += 30;
        } else if (results.performance.connectionType === '4g') {
            perfScore += 20;
        } else if (results.performance.connectionType === '3g') {
            perfScore += 10;
        }
        
        results.performance.score = perfScore;
        
        // Calculate overall compatibility
        let overallScore = 0;
        
        // WebGL is essential
        if (results.webgl.supported) {
            overallScore += 50;
            
            if (results.webgl.version === '2.0') {
                overallScore += 10;
            }
        } else {
            results.overall.issues.push('WebGL is required but not supported');
        }
        
        // Browser support
        if (results.browser.supported) {
            overallScore += 10;
        } else {
            results.overall.issues.push('Browser may not be fully supported');
        }
        
        // Required features
        const requiredFeatures = ['webWorkers', 'localStorage', 'webAudio', 'pointerLock'];
        for (const feature of requiredFeatures) {
            if (results.features[feature]) {
                overallScore += 5;
            } else {
                results.overall.issues.push(`Required feature not supported: ${feature}`);
            }
        }
        
        // Performance score
        overallScore += Math.floor(results.performance.score / 5);
        
        // Mobile penalty
        if (results.browser.mobile) {
            overallScore -= 20;
            results.overall.issues.push('Mobile devices may have performance issues');
        }
        
        results.overall.score = Math.max(0, Math.min(100, overallScore));
        results.overall.compatible = results.overall.score >= 70 && results.webgl.supported;
    }
    
    // Function to display results
    function displayResults() {
        if (!resultElement || !detailsElement) return;
        
        // Display overall result
        const compatibilityClass = results.overall.compatible ? 'compatible' : 'incompatible';
        const compatibilityIcon = results.overall.compatible ? '✅' : '❌';
        
        resultElement.innerHTML = `
            <div class="result-card ${compatibilityClass}">
                <div class="result-icon">${compatibilityIcon}</div>
                <div class="result-title">
                    ${results.overall.compatible ? 'Compatible' : 'Not Compatible'}
                </div>
                <div class="result-score">
                    Score: ${results.overall.score}/100
                </div>
            </div>
        `;
        
        // Display detailed results
        let detailsHTML = '';
        
        // Browser info
        detailsHTML += `
            <div class="details-section">
                <h3>Browser Information</h3>
                <div class="details-grid">
                    <div class="details-item">
                        <div class="details-label">Browser</div>
                        <div class="details-value">${results.browser.name} ${results.browser.version}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Platform</div>
                        <div class="details-value">${results.browser.platform}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Mobile Device</div>
                        <div class="details-value">${results.browser.mobile ? 'Yes' : 'No'}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">User Agent</div>
                        <div class="details-value small">${results.browser.userAgent}</div>
                    </div>
                </div>
            </div>
        `;
        
        // WebGL info
        detailsHTML += `
            <div class="details-section">
                <h3>WebGL Support</h3>
                <div class="details-grid">
                    <div class="details-item">
                        <div class="details-label">WebGL Support</div>
                        <div class="details-value ${results.webgl.supported ? 'success' : 'error'}">
                            ${results.webgl.supported ? 'Supported' : 'Not Supported'}
                        </div>
                    </div>
                    ${results.webgl.supported ? `
                        <div class="details-item">
                            <div class="details-label">WebGL Version</div>
                            <div class="details-value">${results.webgl.version}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Renderer</div>
                            <div class="details-value">${results.webgl.renderer}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Vendor</div>
                            <div class="details-value">${results.webgl.vendor}</div>
                        </div>
                        <div class="details-item">
                            <div class="details-label">Max Texture Size</div>
                            <div class="details-value">${results.webgl.maxTextureSize}px</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Feature support
        detailsHTML += `
            <div class="details-section">
                <h3>Feature Support</h3>
                <div class="details-grid">
                    ${Object.entries(results.features).map(([feature, supported]) => `
                        <div class="details-item">
                            <div class="details-label">${formatFeatureName(feature)}</div>
                            <div class="details-value ${supported ? 'success' : 'error'}">
                                ${supported ? 'Supported' : 'Not Supported'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Performance info
        detailsHTML += `
            <div class="details-section">
                <h3>Performance</h3>
                <div class="details-grid">
                    <div class="details-item">
                        <div class="details-label">CPU Cores</div>
                        <div class="details-value">${results.performance.hardwareConcurrency}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Device Memory</div>
                        <div class="details-value">${results.performance.deviceMemory} GB</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Connection Type</div>
                        <div class="details-value">${results.performance.connectionType}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-label">Performance Score</div>
                        <div class="details-value">${results.performance.score}/100</div>
                    </div>
                </div>
            </div>
        `;
        
        // Issues
        if (results.overall.issues.length > 0) {
            detailsHTML += `
                <div class="details-section">
                    <h3>Issues</h3>
                    <ul class="issues-list">
                        ${results.overall.issues.map(issue => `
                            <li class="issue-item">${issue}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        detailsElement.innerHTML = detailsHTML;
    }
    
    // Helper function to update status
    function updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status status-${type}`;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // Helper function to detect browser name
    function getBrowserName() {
        const userAgent = navigator.userAgent;
        let browser = "Unknown";
        
        if (userAgent.indexOf("Firefox") > -1) {
            browser = "Firefox";
        } else if (userAgent.indexOf("SamsungBrowser") > -1) {
            browser = "Samsung Browser";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browser = "Opera";
        } else if (userAgent.indexOf("Trident") > -1) {
            browser = "Internet Explorer";
        } else if (userAgent.indexOf("Edge") > -1) {
            browser = "Edge";
        } else if (userAgent.indexOf("Chrome") > -1) {
            browser = "Chrome";
        } else if (userAgent.indexOf("Safari") > -1) {
            browser = "Safari";
        }
        
        return browser;
    }
    
    // Helper function to detect browser version
    function getBrowserVersion() {
        const userAgent = navigator.userAgent;
        let version = "Unknown";
        
        try {
            // Extract version based on browser
            if (userAgent.indexOf("Firefox") > -1) {
                version = userAgent.match(/Firefox\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("SamsungBrowser") > -1) {
                version = userAgent.match(/SamsungBrowser\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
                version = userAgent.match(/(?:Opera|OPR)\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Trident") > -1) {
                version = userAgent.match(/rv:([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Edge") > -1) {
                version = userAgent.match(/Edge\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Chrome") > -1) {
                version = userAgent.match(/Chrome\/([0-9.]+)/)[1];
            } else if (userAgent.indexOf("Safari") > -1) {
                version = userAgent.match(/Version\/([0-9.]+)/)[1];
            }
        } catch (e) {
            console.error("Error detecting browser version:", e);
        }
        
        return version;
    }
    
    // Helper function to detect if device is mobile
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Helper function to check storage availability
    function storageAvailable(type) {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Helper function to get connection type
    function getConnectionType() {
        if (!navigator.connection) return 'unknown';
        
        const connection = navigator.connection;
        
        if (connection.type) {
            return connection.type;
        } else if (connection.effectiveType) {
            return connection.effectiveType;
        } else {
            return 'unknown';
        }
    }
    
    // Helper function to format feature names
    function formatFeatureName(feature) {
        // Convert camelCase to Title Case with spaces
        return feature
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }
    
    // Add event listener to the check button
    if (checkButton) {
        checkButton.addEventListener('click', runCompatibilityChecks);
        updateStatus('Ready to check compatibility. Click the button to start.');
    } else {
        updateStatus('Check button not found', 'error');
    }
}); 