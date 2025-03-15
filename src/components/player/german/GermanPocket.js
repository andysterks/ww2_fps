import * as THREE from 'three';

export default class GermanPocket {
  constructor(player) {
    this.player = player;
  }

  createPocket(x) {    
    const fieldGrayColor = 0x666B6A; // Dark gray for Wehrmacht uniform
    const blackColor = 0x171717; // Deep black for helmet, hands, etc.
    const uniformMaterial = new THREE.MeshPhongMaterial({ 
      color: fieldGrayColor,
      specular: 0x111111,
      shininess: 5
    });    
    const blackMaterial = new THREE.MeshPhongMaterial({ 
      color: blackColor,
      specular: 0x222222,
      shininess: 50
  });

    const pocketGroup = new THREE.Group();

    const pocketGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.101);
    const pocket = new THREE.Mesh(pocketGeometry, uniformMaterial);
    pocket.position.set(x, 1.32, 0.065);
    pocket.name = 'rightPocket';
    pocketGroup.add(pocket);

    const pocketOutlineGeometry1 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
    const pocketOutline1 = new THREE.Mesh(pocketOutlineGeometry1, blackMaterial);
    pocketOutline1.position.set(x, 1.348, 0.11);
    pocketOutline1.name = 'pocketOutline';
    pocketGroup.add(pocketOutline1);

    const pocketOutlineGeometry2 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
    const pocketOutline2 = new THREE.Mesh(pocketOutlineGeometry2, blackMaterial);
    pocketOutline2.position.set(x, 1.332, 0.11);
    pocketOutline2.name = 'pocketOutline';
    pocketGroup.add(pocketOutline2);

    const pocketOutlineGeometry3 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
    const pocketOutline3 = new THREE.Mesh(pocketOutlineGeometry3, blackMaterial);
    pocketOutline3.position.set(x - 0.0271, 1.321, 0.11);
    pocketOutline3.rotation.z = Math.PI / 2;
    pocketOutline3.name = 'pocketOutline3';
    pocketGroup.add(pocketOutline3);

    const pocketOutlineGeometry4 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
    const pocketOutline4 = new THREE.Mesh(pocketOutlineGeometry4, blackMaterial);
    pocketOutline4.position.set(x + .0265, 1.321, 0.11);
    pocketOutline4.rotation.z = Math.PI / 2;
    pocketOutline4.name = 'pocketOutline4';
    pocketGroup.add(pocketOutline4);

    const pocketOutlineGeometry5 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
    const pocketOutline5 = new THREE.Mesh(pocketOutlineGeometry5, blackMaterial);
    pocketOutline5.position.set(x, 1.29, 0.11);
    pocketOutline5.name = 'pocketOutline5';
    
    pocketGroup.add(pocketOutline5);

    return pocketGroup;
  }
}
