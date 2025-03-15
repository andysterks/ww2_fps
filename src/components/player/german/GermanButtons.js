import * as THREE from 'three';

class GermanButtons {
    addCreases() {
      const creaseGeometry = new THREE.BoxGeometry(0.24, 0.006, 0.012);
      const creaseHeight = 1.288;
      const creaseDepth = 0.101;

      const creaseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x171717,
        specular: 0x222222,
        shininess: 50
      });

      const creaseLeft = new THREE.Mesh(creaseGeometry, creaseMaterial);

      creaseLeft.position.set(-0.025, creaseHeight, creaseDepth);
      creaseLeft.rotation.z = Math.PI / 2; // Rotate 90 degrees
      creaseLeft.name = 'creaseLeft';

      const creaseRight = new THREE.Mesh(creaseGeometry, creaseMaterial);

      creaseRight.position.set(0.025, creaseHeight, creaseDepth);
      creaseRight.rotation.z = Math.PI / 2; // Rotate 90 degrees
      creaseRight.name = 'creaseRight';

      return [creaseLeft, creaseRight];
    }
}

export default GermanButtons;
