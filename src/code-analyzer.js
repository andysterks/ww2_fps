// Code Analyzer for Three.js Applications
// This script analyzes the main game code for common issues

document.addEventListener('DOMContentLoaded', () => {
    const logElement = document.getElementById('log');
    const summaryElement = document.getElementById('summary');
    const analyzeButton = document.getElementById('analyze-button');
    
    // Log function
    function log(message, type = 'info') {
        if (logElement) {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type}`;
            entry.textContent = message;
            logElement.appendChild(entry);
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // Function to fetch and analyze code
    async function analyzeCode() {
        log('Starting code analysis...', 'info');
        
        try {
            // Fetch the main game code
            const response = await fetch('/index.js');
            if (!response.ok) {
                throw new Error(`Failed to fetch code: ${response.status} ${response.statusText}`);
            }
            
            const code = await response.text();
            log(`Successfully fetched main game code (${code.length} bytes)`, 'success');
            
            // Perform analysis
            const analysis = {
                totalLines: code.split('\n').length,
                issues: [],
                warnings: [],
                suggestions: [],
                threeJsUsage: {
                    sceneCreation: false,
                    rendererCreation: false,
                    cameraCreation: false,
                    animationLoop: false,
                    eventListeners: false,
                    modelLoading: false,
                    errorHandling: false
                }
            };
            
            // Check for basic Three.js setup
            analysis.threeJsUsage.sceneCreation = code.includes('new THREE.Scene()');
            analysis.threeJsUsage.rendererCreation = code.includes('new THREE.WebGLRenderer');
            analysis.threeJsUsage.cameraCreation = code.includes('new THREE.PerspectiveCamera') || 
                                                 code.includes('new THREE.OrthographicCamera');
            analysis.threeJsUsage.animationLoop = code.includes('requestAnimationFrame') && 
                                                code.includes('render');
            analysis.threeJsUsage.eventListeners = code.includes('addEventListener');
            analysis.threeJsUsage.modelLoading = code.includes('GLTFLoader') || 
                                               code.includes('OBJLoader') || 
                                               code.includes('FBXLoader');
            analysis.threeJsUsage.errorHandling = code.includes('try') && code.includes('catch');
            
            // Check for common issues
            if (!analysis.threeJsUsage.errorHandling) {
                analysis.issues.push('No error handling (try/catch) found in the code');
            }
            
            if (!code.includes('window.addEventListener(\'resize\'')) {
                analysis.warnings.push('No window resize event handler found - may not be responsive');
            }
            
            if (code.includes('console.log') && !code.includes('console.error')) {
                analysis.warnings.push('Console logging found but no error logging - consider adding error handling');
            }
            
            // Check for memory leaks
            if (code.includes('new THREE.') && !code.includes('dispose()')) {
                analysis.warnings.push('Creating Three.js objects but no dispose() calls found - potential memory leaks');
            }
            
            // Check for performance issues
            if (code.includes('new THREE.BoxGeometry') || 
                code.includes('new THREE.SphereGeometry') || 
                code.includes('new THREE.PlaneGeometry')) {
                
                if (!code.includes('BufferGeometry')) {
                    analysis.suggestions.push('Consider using BufferGeometry for better performance');
                }
            }
            
            // Check for animation loop issues
            if (code.includes('requestAnimationFrame') && !code.includes('cancelAnimationFrame')) {
                analysis.warnings.push('Animation loop without cancelAnimationFrame - may cause issues when cleaning up');
            }
            
            // Check for renderer settings
            if (code.includes('new THREE.WebGLRenderer') && !code.includes('setPixelRatio')) {
                analysis.suggestions.push('Consider setting pixel ratio for better rendering on high-DPI displays');
            }
            
            // Check for socket.io usage
            if (code.includes('socket.io') || code.includes('io.connect') || code.includes('io(')) {
                log('Socket.io usage detected - checking for proper connection handling', 'info');
                
                if (!code.includes('socket.on(\'connect\'') || !code.includes('socket.on(\'disconnect\'')) {
                    analysis.warnings.push('Socket.io used but connect/disconnect events not properly handled');
                }
                
                if (!code.includes('socket.on(\'error\'')) {
                    analysis.warnings.push('Socket.io error events not handled');
                }
            }
            
            // Log analysis results
            log(`Analysis complete: ${analysis.issues.length} issues, ${analysis.warnings.length} warnings, ${analysis.suggestions.length} suggestions`, 'success');
            
            // Update summary
            updateSummary(analysis);
            
        } catch (error) {
            log(`Error during analysis: ${error.message}`, 'error');
            console.error(error);
        }
    }
    
    // Update the summary with analysis results
    function updateSummary(analysis) {
        if (!summaryElement) return;
        
        let summary = '<h3>Code Analysis Summary</h3>';
        
        // Three.js usage
        summary += `<div class="summary-section">
            <h4>Three.js Usage</h4>
            <ul>
                <li class="${analysis.threeJsUsage.sceneCreation ? 'success' : 'error'}">
                    Scene Creation: ${analysis.threeJsUsage.sceneCreation ? 'Found' : 'Not Found'}
                </li>
                <li class="${analysis.threeJsUsage.rendererCreation ? 'success' : 'error'}">
                    Renderer Creation: ${analysis.threeJsUsage.rendererCreation ? 'Found' : 'Not Found'}
                </li>
                <li class="${analysis.threeJsUsage.cameraCreation ? 'success' : 'error'}">
                    Camera Creation: ${analysis.threeJsUsage.cameraCreation ? 'Found' : 'Not Found'}
                </li>
                <li class="${analysis.threeJsUsage.animationLoop ? 'success' : 'error'}">
                    Animation Loop: ${analysis.threeJsUsage.animationLoop ? 'Found' : 'Not Found'}
                </li>
                <li class="${analysis.threeJsUsage.eventListeners ? 'success' : 'warning'}">
                    Event Listeners: ${analysis.threeJsUsage.eventListeners ? 'Found' : 'Not Found'}
                </li>
                <li class="${analysis.threeJsUsage.modelLoading ? 'success' : 'warning'}">
                    Model Loading: ${analysis.threeJsUsage.modelLoading ? 'Found' : 'Not Found'}
                </li>
                <li class="${analysis.threeJsUsage.errorHandling ? 'success' : 'error'}">
                    Error Handling: ${analysis.threeJsUsage.errorHandling ? 'Found' : 'Not Found'}
                </li>
            </ul>
        </div>`;
        
        // Issues
        if (analysis.issues.length > 0) {
            summary += `<div class="summary-section">
                <h4>Issues (${analysis.issues.length})</h4>
                <ul class="error">
                    ${analysis.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            </div>`;
        }
        
        // Warnings
        if (analysis.warnings.length > 0) {
            summary += `<div class="summary-section">
                <h4>Warnings (${analysis.warnings.length})</h4>
                <ul class="warning">
                    ${analysis.warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>`;
        }
        
        // Suggestions
        if (analysis.suggestions.length > 0) {
            summary += `<div class="summary-section">
                <h4>Suggestions (${analysis.suggestions.length})</h4>
                <ul class="info">
                    ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>`;
        }
        
        // Code stats
        summary += `<div class="summary-section">
            <h4>Code Statistics</h4>
            <p>Total Lines: ${analysis.totalLines}</p>
        </div>`;
        
        // Update the summary element
        summaryElement.innerHTML = summary;
    }
    
    // Add event listener to the analyze button
    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeCode);
        log('Code analyzer ready. Click "Analyze Code" to start.', 'info');
    } else {
        log('Analyze button not found', 'error');
    }
}); 