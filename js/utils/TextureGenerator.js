// TextureGenerator.js - Utility class for generating placeholder textures

class TextureGenerator {
    /**
     * Generate a procedural ground texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @returns {THREE.Texture} Generated texture
     */
    static generateGroundTexture(width = 256, height = 256) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Fill background
        context.fillStyle = '#8B7355'; // Dirt brown
        context.fillRect(0, 0, width, height);
        
        // Add noise
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                // Random noise value
                const noise = Math.random() * 0.1;
                
                // Get base color components
                const r = 139; // Base red component of #8B7355
                const g = 115; // Base green component of #8B7355
                const b = 85;  // Base blue component of #8B7355
                
                // Apply noise
                const noiseR = Math.floor(r * (1 + noise));
                const noiseG = Math.floor(g * (1 + noise));
                const noiseB = Math.floor(b * (1 + noise));
                
                // Set pixel color
                context.fillStyle = `rgb(${noiseR}, ${noiseG}, ${noiseB})`;
                context.fillRect(x, y, 1, 1);
            }
        }
        
        // Add some darker spots for variation
        for (let i = 0; i < 100; i++) {
            const spotX = Math.floor(Math.random() * width);
            const spotY = Math.floor(Math.random() * height);
            const spotRadius = 3 + Math.floor(Math.random() * 10);
            
            context.fillStyle = 'rgba(60, 40, 20, 0.3)';
            context.beginPath();
            context.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Create texture from canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        // Set texture properties
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        return texture;
    }
    
    /**
     * Generate a procedural sky texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @returns {THREE.Texture} Generated texture
     */
    static generateSkyTexture(width = 512, height = 512) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1E90FF'); // Dodger blue
        gradient.addColorStop(0.5, '#87CEEB'); // Sky blue
        gradient.addColorStop(1, '#E0FFFF'); // Light cyan
        
        // Fill background with gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        
        // Add clouds
        context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // Function to draw a cloud
        const drawCloud = (x, y, size) => {
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.arc(x + size * 0.5, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
            context.arc(x + size, y, size * 0.7, 0, Math.PI * 2);
            context.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
            context.arc(x + size * 0.5, y + size * 0.2, size * 0.8, 0, Math.PI * 2);
            context.fill();
        };
        
        // Draw several clouds
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * (height / 2);
            const size = 20 + Math.random() * 30;
            drawCloud(x, y, size);
        }
        
        // Create texture from canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a procedural weapon texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @returns {THREE.Texture} Generated texture
     */
    static generateWeaponTexture(width = 256, height = 256) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Fill background with dark gray (metal)
        context.fillStyle = '#444444';
        context.fillRect(0, 0, width, height);
        
        // Add wood grain for stock
        context.fillStyle = '#8B4513'; // Saddle brown
        context.fillRect(0, height / 2, width / 2, height / 2);
        
        // Add wood grain lines
        context.strokeStyle = '#A0522D'; // Sienna
        context.lineWidth = 2;
        
        for (let i = 0; i < 10; i++) {
            const y = height / 2 + Math.random() * (height / 2);
            context.beginPath();
            context.moveTo(0, y);
            context.bezierCurveTo(
                width / 4, y + Math.random() * 10 - 5,
                width / 3, y + Math.random() * 10 - 5,
                width / 2, y
            );
            context.stroke();
        }
        
        // Add metal details
        context.fillStyle = '#333333';
        context.fillRect(width / 2, 0, width / 2, height);
        
        // Add highlights
        context.fillStyle = '#666666';
        context.fillRect(width / 2 + 10, 10, width / 2 - 20, 5);
        context.fillRect(width / 2 + 10, 20, width / 2 - 20, 5);
        
        // Create texture from canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a procedural enemy texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @returns {THREE.Texture} Generated texture
     */
    static generateEnemyTexture(width = 256, height = 256) {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        // Fill background with gray-green (uniform)
        context.fillStyle = '#4F5F43'; // Military green
        context.fillRect(0, 0, width, height);
        
        // Add uniform details
        context.fillStyle = '#3A4A33'; // Darker green
        context.fillRect(width / 4, 0, width / 2, height / 2); // Torso
        
        // Add helmet
        context.fillStyle = '#3A3A3A'; // Dark gray
        context.fillRect(width / 3, height / 2, width / 3, height / 4);
        
        // Add face
        context.fillStyle = '#D2B48C'; // Tan
        context.fillRect(width / 3, height * 3/4, width / 3, height / 4);
        
        // Add details to face
        context.fillStyle = '#000000';
        context.fillRect(width * 3/8, height * 7/8, width / 12, height / 16); // Left eye
        context.fillRect(width * 5/8, height * 7/8, width / 12, height / 16); // Right eye
        
        // Create texture from canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a procedural building texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {string} type - Building type ('brick', 'concrete', etc.)
     * @returns {THREE.Texture} Generated texture
     */
    static generateBuildingTexture(width = 256, height = 256, type = 'brick') {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        if (type === 'brick') {
            // Fill background with brick color
            context.fillStyle = '#B22222'; // Firebrick
            context.fillRect(0, 0, width, height);
            
            // Draw brick pattern
            const brickWidth = 20;
            const brickHeight = 10;
            
            context.fillStyle = '#8B0000'; // Dark red
            
            for (let y = 0; y < height; y += brickHeight) {
                const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
                
                for (let x = 0; x < width; x += brickWidth) {
                    // Draw brick outline
                    context.strokeStyle = '#A0A0A0'; // Gray mortar
                    context.lineWidth = 1;
                    context.strokeRect(x + offset, y, brickWidth, brickHeight);
                    
                    // Add some variation to bricks
                    if (Math.random() > 0.7) {
                        context.fillStyle = `rgba(139, 0, 0, ${0.5 + Math.random() * 0.5})`;
                        context.fillRect(x + offset + 1, y + 1, brickWidth - 2, brickHeight - 2);
                    }
                }
            }
        } else if (type === 'concrete') {
            // Fill background with concrete color
            context.fillStyle = '#C0C0C0'; // Silver
            context.fillRect(0, 0, width, height);
            
            // Add concrete texture
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (Math.random() > 0.95) {
                        const gray = 160 + Math.floor(Math.random() * 40);
                        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                        context.fillRect(x, y, 2, 2);
                    }
                }
            }
            
            // Add some cracks
            context.strokeStyle = '#A0A0A0';
            context.lineWidth = 1;
            
            for (let i = 0; i < 5; i++) {
                const startX = Math.random() * width;
                const startY = Math.random() * height;
                
                context.beginPath();
                context.moveTo(startX, startY);
                
                let x = startX;
                let y = startY;
                
                for (let j = 0; j < 5; j++) {
                    x += (Math.random() - 0.5) * 30;
                    y += (Math.random() - 0.5) * 30;
                    context.lineTo(x, y);
                }
                
                context.stroke();
            }
        }
        
        // Create texture from canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        // Set texture properties
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
} 