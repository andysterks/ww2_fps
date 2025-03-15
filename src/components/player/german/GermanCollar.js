import * as THREE from 'three';

class GermanCollar {
  constructor(player) {
    this.player = player;
  }

  createLeftCollar() {
    const leftCollarGroup = new THREE.Group();
    leftCollarGroup.add(this.createCollar(-0.05, 1.41, 0.101));
    leftCollarGroup.add(this.createWhiteLines(-Math.PI / 4, false)[0]);
    leftCollarGroup.add(this.createWhiteLines(-Math.PI / 4, false)[1]);
    
    return leftCollarGroup;
  }

  createRightCollar() {
    const rightCollarGroup = new THREE.Group();
    rightCollarGroup.add(this.createCollar(0.05, 1.41, 0.101));
    rightCollarGroup.add(this.createWhiteLines(Math.PI / 4, true)[0]);
    rightCollarGroup.add(this.createWhiteLines(Math.PI / 4, true)[1]);

    return rightCollarGroup;
  }

  createWhiteLines(angle, isRight) {
    // Add angled white line for soldier's collar
    // Top  collar line
    const topLineGeometry = new THREE.BoxGeometry(0.03, 0.003, 0.005);
    const topCollarLine = new THREE.Mesh(topLineGeometry, new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF,
        specular: 0x444444,
        shininess: 30
    }));
    if (isRight) {
      topCollarLine.position.set(0.054, 1.396, 0.101);
    } else {
      topCollarLine.position.set(-0.054, 1.396, 0.101);
    }
    topCollarLine.rotation.z = angle; // Rotate 45 degrees
    topCollarLine.name = 'collarLine';

    // Bottom collar line
    const bottomLineGeometry = new THREE.BoxGeometry(0.03, 0.003, 0.005);
    const bottomLine = new THREE.Mesh(bottomLineGeometry, new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF,
        specular: 0x444444,
        shininess: 30
    }));
    if (isRight) {
      bottomLine.position.set(0.06, 1.39, 0.101);
    } else {
      bottomLine.position.set(-0.06, 1.39, 0.101);
    }
    bottomLine.rotation.z = angle; // Rotate 45 degrees
    bottomLine.name = 'collarLine';

    return [topCollarLine, bottomLine];
  }

  createCollar(x, y, z) {
    const blackColor = 0x171717; // Deep black for helmet, hands, etc.
    const blackMaterial = new THREE.MeshPhongMaterial({ 
      color: blackColor,
      specular: 0x222222,
      shininess: 50
    });

    const fieldGrayColor = 0x666B6A; // Dark gray for Wehrmacht uniform
    const uniformMaterial = new THREE.MeshPhongMaterial({ 
      color: fieldGrayColor,
      specular: 0x111111,
      shininess: 5
    });
    
    // Add triangle collar (left side)
    const collarGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        0, -0.04, 0,     // bottom point
        0.04, 0, 0,      // top right
        -0.04, 0, 0      // top left
    ]);
    collarGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const rightCollar = new THREE.Mesh(collarGeometry, blackMaterial);
    rightCollar.position.set(x, y, z);
    rightCollar.name = 'collar';

    return rightCollar;
  }

  createCollarGroup() {
    const collarGroup = new THREE.Group();
    collarGroup.add(this.createLeftCollar());
    collarGroup.add(this.createRightCollar());
    return collarGroup;
  }
}

export default GermanCollar;
