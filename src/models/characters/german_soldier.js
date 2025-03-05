import * as THREE from 'three';

export function createGermanSoldier() {
    const soldier = new THREE.Group();

    // Materials
    const uniformMaterial = new THREE.MeshStandardMaterial({
        color: 0x4B5320, // Field gray (Feldgrau)
        roughness: 0.8,
        metalness: 0.1
    });

    const skinMaterial = new THREE.MeshStandardMaterial({
        color: 0xE0B0A0, // Skin tone
        roughness: 0.7,
        metalness: 0.1
    });

    const leatherMaterial = new THREE.MeshStandardMaterial({
        color: 0x3B2F2F, // Dark brown
        roughness: 0.9,
        metalness: 0.2
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        roughness: 0.4,
        metalness: 0.8
    });

    // Body
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.6, 0.2),
        uniformMaterial
    );
    soldier.add(torso);

    // Head
    const head = new THREE.Group();
    
    // Helmet (Stahlhelm)
    const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        metalMaterial
    );
    helmet.position.y = 0.12;
    head.add(helmet);

    // Helmet brim
    const helmBrim = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.15, 16),
        metalMaterial
    );
    helmBrim.rotation.x = -Math.PI / 2;
    head.add(helmBrim);

    // Face
    const face = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.2, 0.15),
        skinMaterial
    );
    face.position.y = -0.02;
    head.add(face);

    head.position.y = 0.4;
    soldier.add(head);

    // Arms
    const createArm = (isLeft) => {
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.4, 0.1),
            uniformMaterial
        );
        arm.position.x = isLeft ? -0.25 : 0.25;
        arm.position.y = 0.1;
        return arm;
    };

    soldier.add(createArm(true));
    soldier.add(createArm(false));

    // Legs
    const createLeg = (isLeft) => {
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.5, 0.15),
            uniformMaterial
        );
        leg.position.x = isLeft ? -0.1 : 0.1;
        leg.position.y = -0.55;
        return leg;
    };

    soldier.add(createLeg(true));
    soldier.add(createLeg(false));

    // Equipment
    // Belt
    const belt = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.1, 0.25),
        leatherMaterial
    );
    belt.position.y = -0.2;
    soldier.add(belt);

    // Create Kar98k rifle
    const rifle = createKar98k();
    rifle.position.set(0.2, 0, 0.1);
    rifle.rotation.y = Math.PI / 2;
    soldier.add(rifle);

    return soldier;
}

function createKar98k() {
    const rifle = new THREE.Group();

    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3520,
        roughness: 0.8,
        metalness: 0.1
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        roughness: 0.4,
        metalness: 0.8
    });

    // Stock
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.7, 0.06),
        woodMaterial
    );
    rifle.add(stock);

    // Barrel
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8),
        metalMaterial
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.4;
    rifle.add(barrel);

    // Bolt
    const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8),
        metalMaterial
    );
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(0.1, 0.05, 0.04);
    rifle.add(bolt);

    // Scope mount (for some variants)
    const scopeMount = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.03, 0.03),
        metalMaterial
    );
    scopeMount.position.set(0.2, 0.06, 0);
    rifle.add(scopeMount);

    return rifle;
} 