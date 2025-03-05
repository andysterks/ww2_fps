import * as THREE from 'three';

export function createGermanSoldier() {
    const soldier = new THREE.Group();

    // Materials with more accurate colors
    const uniformMaterial = new THREE.MeshStandardMaterial({
        color: 0x485838, // More accurate Feldgrau
        roughness: 0.8,
        metalness: 0.1
    });

    const skinMaterial = new THREE.MeshStandardMaterial({
        color: 0xE0B0A0,
        roughness: 0.7,
        metalness: 0.1
    });

    const leatherMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A1F1F, // Darker leather
        roughness: 0.9,
        metalness: 0.2
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        roughness: 0.4,
        metalness: 0.8
    });

    const webbingMaterial = new THREE.MeshStandardMaterial({
        color: 0x3A3A2A, // Canvas webbing
        roughness: 1.0,
        metalness: 0.0
    });

    // Torso with better proportions
    const torso = new THREE.Group();
    
    // Main torso
    const torsoMain = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.6, 0.25),
        uniformMaterial
    );
    
    // Collar
    const collar = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.1, 0.27),
        uniformMaterial
    );
    collar.position.y = 0.25;
    torso.add(collar);
    torso.add(torsoMain);
    soldier.add(torso);

    // Head with better Stahlhelm
    const head = new THREE.Group();
    
    // Improved Stahlhelm
    const helmetTop = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6),
        metalMaterial
    );
    helmetTop.position.y = 0.12;
    
    // Helmet side extensions
    const helmetSide = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.13, 0.08, 32, 1, true),
        metalMaterial
    );
    helmetSide.position.y = 0.08;
    
    // Ventilation holes (simplified)
    const ventHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    ventHole.rotation.x = Math.PI / 2;
    ventHole.position.set(0.08, 0.15, 0);
    
    const ventHole2 = ventHole.clone();
    ventHole2.position.set(-0.08, 0.15, 0);
    
    head.add(helmetTop);
    head.add(helmetSide);
    head.add(ventHole);
    head.add(ventHole2);

    // Face
    const face = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.2, 0.15),
        skinMaterial
    );
    face.position.y = -0.02;
    head.add(face);

    head.position.y = 0.4;
    soldier.add(head);

    // Equipment
    // Y-straps
    const createYStrap = () => {
        const strap = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.6, 0.02),
            webbingMaterial
        );
        return strap;
    };

    const leftStrap = createYStrap();
    leftStrap.position.set(-0.1, 0, 0.12);
    const rightStrap = createYStrap();
    rightStrap.position.set(0.1, 0, 0.12);
    soldier.add(leftStrap);
    soldier.add(rightStrap);

    // Ammunition pouches
    const createAmmoPouch = () => {
        const pouch = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.15, 0.08),
            webbingMaterial
        );
        return pouch;
    };

    const leftPouch = createAmmoPouch();
    leftPouch.position.set(-0.2, -0.1, 0.15);
    const rightPouch = createAmmoPouch();
    rightPouch.position.set(0.2, -0.1, 0.15);
    soldier.add(leftPouch);
    soldier.add(rightPouch);

    // Gas mask canister
    const canister = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16),
        metalMaterial
    );
    canister.position.set(-0.2, -0.2, 0);
    canister.rotation.x = Math.PI / 2;
    soldier.add(canister);

    // Bread bag
    const breadBag = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.2, 0.1),
        webbingMaterial
    );
    breadBag.position.set(0.2, -0.2, 0);
    soldier.add(breadBag);

    // Enhanced arms with better proportions
    const createArm = (isLeft) => {
        const armGroup = new THREE.Group();
        
        const upperArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.25, 0.12),
            uniformMaterial
        );
        
        const lowerArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.25, 0.1),
            uniformMaterial
        );
        lowerArm.position.y = -0.25;
        
        armGroup.add(upperArm);
        armGroup.add(lowerArm);
        armGroup.position.x = isLeft ? -0.25 : 0.25;
        armGroup.position.y = 0.1;
        return armGroup;
    };

    soldier.add(createArm(true));
    soldier.add(createArm(false));

    // Enhanced legs with boots and wrappings
    const createLeg = (isLeft) => {
        const legGroup = new THREE.Group();
        
        // Upper leg
        const upperLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.15),
            uniformMaterial
        );
        
        // Lower leg with wrappings
        const lowerLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.13, 0.3, 0.13),
            uniformMaterial
        );
        lowerLeg.position.y = -0.3;
        
        // Boot
        const boot = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.1, 0.2),
            leatherMaterial
        );
        boot.position.y = -0.5;
        boot.position.z = 0.02;
        
        legGroup.add(upperLeg);
        legGroup.add(lowerLeg);
        legGroup.add(boot);
        legGroup.position.x = isLeft ? -0.1 : 0.1;
        legGroup.position.y = -0.35;
        return legGroup;
    };

    soldier.add(createLeg(true));
    soldier.add(createLeg(false));

    // Belt with improved detail
    const belt = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.08, 0.28),
        leatherMaterial
    );
    belt.position.y = -0.2;
    
    // Belt buckle
    const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.01),
        metalMaterial
    );
    buckle.position.set(0, -0.2, 0.14);
    soldier.add(belt);
    soldier.add(buckle);

    // Create enhanced Kar98k rifle
    const rifle = createKar98k();
    rifle.position.set(0.2, 0, 0.1);
    rifle.rotation.y = Math.PI / 2;
    soldier.add(rifle);

    return soldier;
}

function createKar98k() {
    const rifle = new THREE.Group();

    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x3A2A18, // Darker wood color
        roughness: 0.8,
        metalness: 0.1
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        roughness: 0.4,
        metalness: 0.8
    });

    // Enhanced stock
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.8, 0.06),
        woodMaterial
    );
    
    // Butt plate
    const buttPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.02, 0.12),
        metalMaterial
    );
    buttPlate.position.y = -0.4;
    
    // Enhanced barrel
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.9, 16),
        metalMaterial
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.45;

    // Front sight
    const frontSight = new THREE.Mesh(
        new THREE.ConeGeometry(0.01, 0.03, 4),
        metalMaterial
    );
    frontSight.position.set(0.85, 0.03, 0);
    frontSight.rotation.z = -Math.PI / 2;

    // Rear sight
    const rearSight = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.01),
        metalMaterial
    );
    rearSight.position.set(0.1, 0.03, 0);

    // Enhanced bolt
    const bolt = new THREE.Group();
    const boltHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8),
        metalMaterial
    );
    const boltKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        metalMaterial
    );
    boltKnob.position.y = 0.04;
    bolt.add(boltHandle);
    bolt.add(boltKnob);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(0.1, 0.05, 0.04);

    rifle.add(stock);
    rifle.add(buttPlate);
    rifle.add(barrel);
    rifle.add(frontSight);
    rifle.add(rearSight);
    rifle.add(bolt);

    return rifle;
} 