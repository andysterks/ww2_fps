import * as THREE from 'three';

export function createKar98k() {
    const rifle = new THREE.Group();
    
    // Materials
    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3520,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.4,
        metalness: 0.8
    });
    
    // Stock
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.8, 0.08),
        woodMaterial
    );
    rifle.add(stock);
    
    // Barrel
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.9, 16),
        metalMaterial
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.45;
    rifle.add(barrel);
    
    // Receiver
    const receiver = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.08),
        metalMaterial
    );
    receiver.position.x = 0.1;
    rifle.add(receiver);
    
    // Bolt
    const boltGroup = new THREE.Group();
    const boltHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8),
        metalMaterial
    );
    const boltKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        metalMaterial
    );
    boltKnob.position.y = 0.04;
    boltGroup.add(boltHandle);
    boltGroup.add(boltKnob);
    boltGroup.rotation.x = Math.PI / 2;
    boltGroup.position.set(0.1, 0.05, 0.04);
    rifle.add(boltGroup);
    
    // Front sight
    const frontSightGroup = new THREE.Group();
    
    // Front sight post
    const frontPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.001, 0.001, 0.02, 4),
        metalMaterial
    );
    frontPost.position.y = 0.03;
    frontSightGroup.add(frontPost);
    
    // Front sight hood
    const frontHood = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.02, 16, 1, true),
        metalMaterial
    );
    frontHood.position.y = 0.03;
    frontSightGroup.add(frontHood);
    
    // Front sight base
    const frontBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.02, 0.02),
        metalMaterial
    );
    frontSightGroup.add(frontBase);
    
    frontSightGroup.position.set(0.85, 0.04, 0);
    rifle.add(frontSightGroup);
    
    // Rear sight
    const rearSightGroup = new THREE.Group();
    
    // Rear sight base
    const rearBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.01, 0.02),
        metalMaterial
    );
    rearSightGroup.add(rearBase);
    
    // Rear sight aperture
    const rearAperture = new THREE.Mesh(
        new THREE.TorusGeometry(0.004, 0.001, 8, 16),
        metalMaterial
    );
    rearAperture.rotation.x = Math.PI / 2;
    rearAperture.position.y = 0.02;
    rearSightGroup.add(rearAperture);
    
    // Rear sight wings
    const leftWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.001, 0.02, 0.01),
        metalMaterial
    );
    leftWing.position.set(-0.004, 0.02, 0);
    rearSightGroup.add(leftWing);
    
    const rightWing = leftWing.clone();
    rightWing.position.x = 0.004;
    rearSightGroup.add(rightWing);
    
    rearSightGroup.position.set(0.1, 0.04, 0);
    rifle.add(rearSightGroup);
    
    // Magazine
    const magazine = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.12, 0.04),
        metalMaterial
    );
    magazine.position.set(0.1, -0.1, 0);
    rifle.add(magazine);
    
    // Position the rifle for first-person view
    rifle.position.copy(new THREE.Vector3(0.3, -0.3, -0.5));
    rifle.rotation.set(0, Math.PI, 0);
    
    return rifle;
} 