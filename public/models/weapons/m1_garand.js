import * as THREE from 'three';

export function createM1Garand() {
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
        new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8),
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
    const bolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.04),
        metalMaterial
    );
    bolt.position.set(0.1, 0.05, 0.04);
    rifle.add(bolt);
    
    // Front sight
    const frontSight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.04, 4),
        metalMaterial
    );
    frontSight.position.set(0.85, 0.04, 0);
    rifle.add(frontSight);
    
    // Rear sight
    const rearSight = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.01),
        metalMaterial
    );
    rearSight.position.set(0, 0.04, 0);
    rifle.add(rearSight);
    
    // Magazine
    const magazine = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.15, 0.04),
        metalMaterial
    );
    magazine.position.set(0.1, -0.1, 0);
    rifle.add(magazine);
    
    // Position the rifle for first-person view
    rifle.position.set(0.3, -0.3, -0.5);
    rifle.rotation.set(0, Math.PI, 0);
    
    return rifle;
} 