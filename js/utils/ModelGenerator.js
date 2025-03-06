// ModelGenerator.js - Utility class for generating procedural 3D models

class ModelGenerator {
    /**
     * Generate a procedural LEGO-style character model
     * @param {Object} options - Configuration options
     * @returns {THREE.Group} Character model
     */
    static generateCharacter(options = {}) {
        // Default options
        const config = {
            isEnemy: options.isEnemy || false,
            color: options.color || (options.isEnemy ? 0x4F5F43 : 0x1E3F8A), // Green for enemies, blue for player
            height: options.height || 1.8,
            width: options.width || 0.6,
            depth: options.depth || 0.4,
            hasHelmet: options.hasHelmet !== undefined ? options.hasHelmet : true,
            hasWeapon: options.hasWeapon !== undefined ? options.hasWeapon : true
        };
        
        // Create group to hold all parts
        const character = new THREE.Group();
        
        // Create head
        const headSize = config.width * 0.5;
        const headGeometry = new THREE.BoxGeometry(headSize, headSize, headSize);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, // Skin color (yellow for LEGO style)
            flatShading: true
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = config.height - headSize / 2;
        character.add(head);
        
        // Create helmet if needed
        if (config.hasHelmet) {
            const helmetGeometry = new THREE.BoxGeometry(headSize * 1.1, headSize * 0.6, headSize * 1.1);
            const helmetMaterial = new THREE.MeshStandardMaterial({ 
                color: config.isEnemy ? 0x3A3A3A : 0x1A1A1A, // Dark gray/black
                flatShading: true
            });
            const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmet.position.y = config.height - headSize / 2 + headSize * 0.1;
            character.add(helmet);
        }
        
        // Create body
        const bodyHeight = config.height * 0.4;
        const bodyGeometry = new THREE.BoxGeometry(config.width, bodyHeight, config.depth);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = config.height - headSize - bodyHeight / 2;
        character.add(body);
        
        // Create arms
        const armWidth = config.width * 0.2;
        const armHeight = config.height * 0.4;
        const armDepth = config.depth;
        const armGeometry = new THREE.BoxGeometry(armWidth, armHeight, armDepth);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            flatShading: true
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.x = -(config.width / 2 + armWidth / 2);
        leftArm.position.y = config.height - headSize - armHeight / 2;
        character.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.x = config.width / 2 + armWidth / 2;
        rightArm.position.y = config.height - headSize - armHeight / 2;
        character.add(rightArm);
        
        // Create legs
        const legWidth = config.width * 0.3;
        const legHeight = config.height * 0.4;
        const legDepth = config.depth;
        const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1A1A1A, // Dark gray/black
            flatShading: true
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.x = -legWidth / 2;
        leftLeg.position.y = legHeight / 2;
        character.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.x = legWidth / 2;
        rightLeg.position.y = legHeight / 2;
        character.add(rightLeg);
        
        // Add weapon if needed
        if (config.hasWeapon) {
            const weapon = this.generateWeapon({
                isEnemy: config.isEnemy
            });
            
            // Position weapon in right hand
            weapon.position.x = config.width / 2 + armWidth / 2 + 0.1;
            weapon.position.y = config.height - headSize - armHeight / 3;
            weapon.position.z = config.depth / 2 + 0.1;
            
            // Rotate weapon to point forward
            weapon.rotation.y = -Math.PI / 2;
            
            character.add(weapon);
        }
        
        // Center the model at origin
        character.position.y = 0;
        
        return character;
    }
    
    /**
     * Generate a procedural weapon model
     * @param {Object} options - Configuration options
     * @returns {THREE.Group} Weapon model
     */
    static generateWeapon(options = {}) {
        // Default options
        const config = {
            isEnemy: options.isEnemy || false,
            type: options.type || 'rifle',
            color: options.color || 0x8B4513 // Brown
        };
        
        // Create group to hold all parts
        const weapon = new THREE.Group();
        
        // Create barrel
        const barrelLength = 0.8;
        const barrelRadius = 0.03;
        const barrelGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, // Dark gray
            flatShading: true
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2; // Rotate to point forward
        barrel.position.z = barrelLength / 2;
        weapon.add(barrel);
        
        // Create stock
        const stockWidth = 0.06;
        const stockHeight = 0.15;
        const stockLength = 0.4;
        const stockGeometry = new THREE.BoxGeometry(stockWidth, stockHeight, stockLength);
        const stockMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            flatShading: true
        });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.z = -stockLength / 2;
        weapon.add(stock);
        
        // Create handle
        const handleWidth = 0.04;
        const handleHeight = 0.12;
        const handleDepth = 0.06;
        const handleGeometry = new THREE.BoxGeometry(handleWidth, handleHeight, handleDepth);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            flatShading: true
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -stockHeight / 2 - handleHeight / 2;
        handle.position.z = -stockLength / 4;
        weapon.add(handle);
        
        // Create sight
        const sightWidth = 0.02;
        const sightHeight = 0.04;
        const sightDepth = 0.02;
        const sightGeometry = new THREE.BoxGeometry(sightWidth, sightHeight, sightDepth);
        const sightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, // Dark gray
            flatShading: true
        });
        const sight = new THREE.Mesh(sightGeometry, sightMaterial);
        sight.position.y = stockHeight / 2 + sightHeight / 2;
        sight.position.z = 0.1;
        weapon.add(sight);
        
        return weapon;
    }
    
    /**
     * Generate a procedural building model
     * @param {Object} options - Configuration options
     * @returns {THREE.Group} Building model
     */
    static generateBuilding(options = {}) {
        // Default options
        const config = {
            type: options.type || 'house',
            width: options.width || 10,
            height: options.height || 8,
            depth: options.depth || 10,
            color: options.color || 0xA52A2A, // Brown
            roofColor: options.roofColor || 0x8B4513, // Dark brown
            floors: options.floors || 2,
            damaged: options.damaged || false
        };
        
        // Create group to hold all parts
        const building = new THREE.Group();
        
        // Create main structure
        const structureGeometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
        const structureMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            flatShading: true
        });
        const structure = new THREE.Mesh(structureGeometry, structureMaterial);
        structure.position.y = config.height / 2;
        building.add(structure);
        
        // Create roof if it's a house
        if (config.type === 'house') {
            const roofHeight = config.height * 0.3;
            const roofGeometry = new THREE.ConeGeometry(config.width * 0.7, roofHeight, 4);
            const roofMaterial = new THREE.MeshStandardMaterial({ 
                color: config.roofColor,
                flatShading: true
            });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = config.height + roofHeight / 2;
            roof.rotation.y = Math.PI / 4; // Rotate to align with building
            building.add(roof);
        }
        
        // Add windows
        const windowSize = 1;
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB, // Sky blue
            flatShading: true,
            side: THREE.DoubleSide
        });
        
        // Add windows to each floor
        for (let floor = 0; floor < config.floors; floor++) {
            const floorHeight = (floor + 0.5) * (config.height / config.floors);
            
            // Front windows
            for (let i = 0; i < 3; i++) {
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.z = config.depth / 2 + 0.01; // Slightly in front of wall
                window.position.y = floorHeight;
                window.position.x = (i - 1) * (config.width / 4);
                building.add(window);
            }
            
            // Back windows
            for (let i = 0; i < 3; i++) {
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.z = -config.depth / 2 - 0.01; // Slightly behind wall
                window.position.y = floorHeight;
                window.position.x = (i - 1) * (config.width / 4);
                window.rotation.y = Math.PI; // Rotate to face outward
                building.add(window);
            }
            
            // Side windows
            for (let i = 0; i < 2; i++) {
                const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
                window1.position.x = config.width / 2 + 0.01; // Slightly to the right of wall
                window1.position.y = floorHeight;
                window1.position.z = (i - 0.5) * (config.depth / 2);
                window1.rotation.y = Math.PI / 2; // Rotate to face outward
                building.add(window1);
                
                const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
                window2.position.x = -config.width / 2 - 0.01; // Slightly to the left of wall
                window2.position.y = floorHeight;
                window2.position.z = (i - 0.5) * (config.depth / 2);
                window2.rotation.y = -Math.PI / 2; // Rotate to face outward
                building.add(window2);
            }
        }
        
        // Add door
        const doorWidth = 2;
        const doorHeight = 3;
        const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Dark brown
            flatShading: true,
            side: THREE.DoubleSide
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.z = config.depth / 2 + 0.02; // Slightly in front of wall
        door.position.y = doorHeight / 2;
        building.add(door);
        
        // Add damage if needed
        if (config.damaged) {
            // Create some holes in the walls
            const holeCount = 3;
            for (let i = 0; i < holeCount; i++) {
                const holeSize = 1 + Math.random() * 2;
                const holeGeometry = new THREE.BoxGeometry(holeSize, holeSize, config.depth * 0.3);
                const holeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x000000,
                    transparent: true,
                    opacity: 0
                });
                const hole = new THREE.Mesh(holeGeometry, holeMaterial);
                
                // Random position on the wall
                const side = Math.floor(Math.random() * 4);
                const y = Math.random() * config.height * 0.8;
                
                if (side === 0) {
                    // Front wall
                    hole.position.z = config.depth / 2;
                    hole.position.x = (Math.random() - 0.5) * config.width * 0.8;
                } else if (side === 1) {
                    // Back wall
                    hole.position.z = -config.depth / 2;
                    hole.position.x = (Math.random() - 0.5) * config.width * 0.8;
                } else if (side === 2) {
                    // Right wall
                    hole.position.x = config.width / 2;
                    hole.position.z = (Math.random() - 0.5) * config.depth * 0.8;
                    hole.rotation.y = Math.PI / 2;
                } else {
                    // Left wall
                    hole.position.x = -config.width / 2;
                    hole.position.z = (Math.random() - 0.5) * config.depth * 0.8;
                    hole.rotation.y = Math.PI / 2;
                }
                
                hole.position.y = y;
                
                // Use CSG to create a hole in the building
                // Note: In a real implementation, you would use a library like ThreeCSG
                // For this example, we'll just add the hole mesh to simulate damage
                building.add(hole);
            }
            
            // Add some debris around the building
            const debrisCount = 10;
            for (let i = 0; i < debrisCount; i++) {
                const debrisSize = 0.5 + Math.random() * 1;
                const debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize, debrisSize);
                const debrisMaterial = new THREE.MeshStandardMaterial({ 
                    color: config.color,
                    flatShading: true
                });
                const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
                
                // Random position around the building
                const angle = Math.random() * Math.PI * 2;
                const distance = config.width / 2 + Math.random() * 5;
                debris.position.x = Math.cos(angle) * distance;
                debris.position.z = Math.sin(angle) * distance;
                debris.position.y = debrisSize / 2;
                
                // Random rotation
                debris.rotation.x = Math.random() * Math.PI;
                debris.rotation.y = Math.random() * Math.PI;
                debris.rotation.z = Math.random() * Math.PI;
                
                building.add(debris);
            }
        }
        
        return building;
    }
    
    /**
     * Generate a procedural prop model (barrel, crate, etc.)
     * @param {Object} options - Configuration options
     * @returns {THREE.Mesh} Prop model
     */
    static generateProp(options = {}) {
        // Default options
        const config = {
            type: options.type || 'barrel',
            color: options.color || 0x8B4513 // Brown
        };
        
        let geometry, material;
        
        if (config.type === 'barrel') {
            // Create barrel
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
            material = new THREE.MeshStandardMaterial({ 
                color: config.color,
                flatShading: true
            });
            
            // Add barrel rings
            const ringGeometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333, // Dark gray
                flatShading: true
            });
            
            const topRing = new THREE.Mesh(ringGeometry, ringMaterial);
            topRing.position.y = 0.4;
            topRing.rotation.x = Math.PI / 2;
            
            const middleRing = new THREE.Mesh(ringGeometry, ringMaterial);
            middleRing.rotation.x = Math.PI / 2;
            
            const bottomRing = new THREE.Mesh(ringGeometry, ringMaterial);
            bottomRing.position.y = -0.4;
            bottomRing.rotation.x = Math.PI / 2;
            
            const barrel = new THREE.Mesh(geometry, material);
            barrel.add(topRing);
            barrel.add(middleRing);
            barrel.add(bottomRing);
            
            return barrel;
        } else if (config.type === 'crate') {
            // Create crate
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshStandardMaterial({ 
                color: config.color,
                flatShading: true
            });
            
            // Add crate details (edges)
            const edgeGeometry = new THREE.BoxGeometry(1.02, 0.1, 0.1);
            const edgeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333, // Dark gray
                flatShading: true
            });
            
            const crate = new THREE.Mesh(geometry, material);
            
            // Add edges
            for (let i = 0; i < 4; i++) {
                const edge1 = new THREE.Mesh(edgeGeometry, edgeMaterial);
                edge1.position.y = 0.45;
                edge1.position.z = 0.45;
                edge1.rotation.z = Math.PI / 2 * i;
                crate.add(edge1);
                
                const edge2 = new THREE.Mesh(edgeGeometry, edgeMaterial);
                edge2.position.y = -0.45;
                edge2.position.z = 0.45;
                edge2.rotation.z = Math.PI / 2 * i;
                crate.add(edge2);
                
                const edge3 = new THREE.Mesh(edgeGeometry, edgeMaterial);
                edge3.position.y = 0.45;
                edge3.position.z = -0.45;
                edge3.rotation.z = Math.PI / 2 * i;
                crate.add(edge3);
                
                const edge4 = new THREE.Mesh(edgeGeometry, edgeMaterial);
                edge4.position.y = -0.45;
                edge4.position.z = -0.45;
                edge4.rotation.z = Math.PI / 2 * i;
                crate.add(edge4);
            }
            
            return crate;
        } else if (config.type === 'sandbag') {
            // Create sandbag
            geometry = new THREE.BoxGeometry(1, 0.5, 0.5);
            material = new THREE.MeshStandardMaterial({ 
                color: 0xC2B280, // Sand color
                flatShading: true
            });
            
            const sandbag = new THREE.Mesh(geometry, material);
            
            // Add some deformation to make it look more like a bag
            sandbag.geometry.vertices.forEach(vertex => {
                vertex.x += (Math.random() - 0.5) * 0.1;
                vertex.y += (Math.random() - 0.5) * 0.1;
                vertex.z += (Math.random() - 0.5) * 0.1;
            });
            
            sandbag.geometry.verticesNeedUpdate = true;
            sandbag.geometry.normalsNeedUpdate = true;
            
            return sandbag;
        } else {
            // Default: create a simple sphere
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
            material = new THREE.MeshStandardMaterial({ 
                color: config.color,
                flatShading: true
            });
            
            return new THREE.Mesh(geometry, material);
        }
    }
} 