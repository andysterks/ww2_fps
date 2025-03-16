import * as THREE from "three";

export default class Kar98 {
  create(x, y, z) {
    console.log("DEBUG: Creating detailed Kar98 rifle model");
    const weaponGroup = new THREE.Group();
    weaponGroup.name = "playerWeapon"; // Give it a unique name

    try {
      // Load textures for wood and metal
      const textureLoader = new THREE.TextureLoader();
      const woodTexture = textureLoader.load(
        "assets/textures/wood2.jpg",
        () => console.log("DEBUG: Wood texture loaded successfully"),
        undefined,
        (err) => console.error("ERROR: Failed to load wood texture", err)
      );
      const metalTexture = textureLoader.load(
        "textures/metal.jpg",
        () => console.log("DEBUG: Metal texture loaded successfully"),
        undefined,
        (err) => console.error("ERROR: Failed to load metal texture", err)
      );

      // Main wooden stock with texture
      const stockGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.6);
      const stockMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.2,
      });
      console.log("DEBUG: Stock material properties:", stockMaterial);
      const stock = new THREE.Mesh(stockGeometry, stockMaterial);
      stock.position.set(0, 0.02, -0.3);
      console.log("DEBUG: Stock position:", stock.position);
      stock.name = "weaponStock";
      weaponGroup.add(stock);

      // Stock grip with texture
      const gripGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.08);
      const gripMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.2,
      });
      const grip = new THREE.Mesh(gripGeometry, gripMaterial);
      grip.position.set(0, -0.003, 0.02);
      grip.rotation.x = Math.PI / 7;
      grip.name = "weaponGrip";
      weaponGroup.add(grip);

      // Butt with texture
      const buttGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.08);
      const buttMaterial = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.2,
      });
      const butt = new THREE.Mesh(buttGeometry, buttMaterial);
      butt.position.set(0, -0.03, 0.09);
      butt.rotation.x = Math.PI / 12;
      butt.name = "weaponButt";
      weaponGroup.add(butt);

      // Barrel with texture
      const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.8, 16);
      const barrelMaterial = new THREE.MeshStandardMaterial({
        map: metalTexture,
        roughness: 0.5,
        metalness: 0.8,
      });
      console.log("DEBUG: Barrel material properties:", barrelMaterial);
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.35);
      console.log("DEBUG: Barrel position:", barrel.position);
      barrel.name = "weaponBarrel";
      weaponGroup.add(barrel);

      // Bolt sleeve group
      const boltSleeveGroup = new THREE.Group();
      boltSleeveGroup.name = "weaponBoltSleeveGroup";
      weaponGroup.add(boltSleeveGroup);
      boltSleeveGroup.position.set(-0.04, 0.025, -0.09);

      // Bolt sleeve
      const boltSleeveGeometry = new THREE.CylinderGeometry(
        0.01,
        0.01,
        0.08,
        8
      );
      const boltMaterial = new THREE.MeshStandardMaterial({
        map: metalTexture,
        roughness: 0.3,
        metalness: 0.9,
      });
      const boltSleeve = new THREE.Mesh(boltSleeveGeometry, boltMaterial);
      boltSleeve.rotation.x = Math.PI / 2;
      boltSleeve.position.set(0.04, 0.019, 0.05);
      boltSleeve.name = "weaponBoltSleeve";
      boltSleeveGroup.add(boltSleeve);

      // Bolt group
      const boltGroup = new THREE.Group();
      boltGroup.name = "weaponBoltGroup";
      weaponGroup.add(boltGroup);
      boltGroup.position.set(-0.02, 0.023, -0.09);

      // Bolt mechanism with texture
      const boltGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
      console.log("DEBUG: Bolt material properties:", boltMaterial);
      const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(0.04, 0.019, 0.05);
      console.log("DEBUG: Bolt position:", bolt.position);
      bolt.name = "weaponBolt";
      boltGroup.add(bolt);

      // Bolt handle with texture
      const boltHandleGeometry = new THREE.CylinderGeometry(
        0.007,
        0.007,
        0.05,
        8
      );
      const boltHandle = new THREE.Mesh(boltHandleGeometry, boltMaterial);

      // Position it at the end of the bolt
      boltHandle.position.set(0.065, 0.002, 0.05);

      // Rotate it to a 45-degree angle (default cylinder is vertical)
      boltHandle.rotation.z = Math.PI / 4; // 45 degrees in radians

      boltHandle.name = "weaponBoltHandle";
      boltGroup.add(boltHandle);

      // add ball at end of bolt handle
      const boltHandleBallGeometry = new THREE.SphereGeometry(0.01, 8, 8);
      const boltHandleBall = new THREE.Mesh(
        boltHandleBallGeometry,
        boltMaterial
      );
      boltHandleBall.position.set(0.083, -0.015, 0.05);
      boltHandleBall.name = "weaponBoltHandleBall";
      boltGroup.add(boltHandleBall);

      // Create detailed iron sights
      this.createDetailedKar98IronSights(weaponGroup);

      // Create a simple trigger group
      const triggerGroup = new THREE.Group();
      triggerGroup.name = "weaponTriggerGroup";
      weaponGroup.add(triggerGroup);

      // Create a simple trigger
      const triggerGeometry = new THREE.BoxGeometry(0.005, 0.01, 0.005);
      const trigger = new THREE.Mesh(triggerGeometry, boltMaterial);
      trigger.position.set(-0.02, -0.006, -0.034);
      trigger.name = "weaponTrigger";
      triggerGroup.add(trigger);

      // Position the weapon in front of the camera
      weaponGroup.position.set(x, y, z);
      weaponGroup.rotation.y = Math.PI / 8;
      console.log("DEBUG: Weapon group position:", weaponGroup.position);
      console.log("DEBUG: Weapon group rotation:", weaponGroup.rotation);

      console.log(
        "DEBUG: Detailed Kar98 model created successfully:",
        weaponGroup
      );
      console.log("DEBUG: Weapon position:", weaponGroup.position);
      console.log("DEBUG: Weapon rotation:", weaponGroup.rotation);

      // Add ambient light to ensure the model is visible
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      weaponGroup.add(ambientLight);

      // Add directional light to create shadows and highlights
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 1, 0);
      weaponGroup.add(directionalLight);
      // rotate 180 degrees
      weaponGroup.rotation.y = Math.PI;
      weaponGroup.position.set(x, y, z);

      // IMPORTANT: Do not add to scene here, it will be added to the camera later
      return weaponGroup;
    } catch (error) {
      console.error("DEBUG: Failed to create detailed Kar98 model:", error);

      // Fallback to a simple model if the detailed one fails
      console.log("DEBUG: Creating fallback simple weapon model");
      const fallbackGroup = new THREE.Group();
      fallbackGroup.name = "fallbackWeapon";

      // Main rifle body
      const rifleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.05, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x5c3a21 }) // Brown wood color
      );
      rifleBody.name = "fallbackBody";
      fallbackGroup.add(rifleBody);

      // Barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8),
        new THREE.MeshBasicMaterial({ color: 0x444444 }) // Dark metal color
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = -0.35;
      barrel.position.y = 0.01;
      barrel.name = "fallbackBarrel";
      fallbackGroup.add(barrel);

      // Position the weapon in front of the camera
      fallbackGroup.position.set(0.25, -0.25, -0.5);
      fallbackGroup.rotation.y = Math.PI / 8;

      console.log("DEBUG: Fallback model created:", fallbackGroup);

      // IMPORTANT: Do not add to scene here, it will be added to the camera later

      return fallbackGroup;
    }
  }

  // Create detailed iron sights for the Kar98
  createDetailedKar98IronSights(weaponGroup) {
    // curved housing for the front sight
    const vectA = new THREE.Vector3(0.1, 0.05, -0.09); //origin
    const vectB = new THREE.Vector3(0.1, 0.05, -0.09); //tangent
    const vectC = new THREE.Vector3(0.1, 0.05, -0.09); //destination

    const curve = new THREE.QuadraticBezierCurve3(vectA, vectB, vectC);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 1, 2, false));
    mesh.position.set(0, 0.09, -0.19);
    mesh.name = "frontSightHousing";
    weaponGroup.add(mesh);

    // Front sight housing (the metal base that holds the front sight)
    const frontSightHousingGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.02);
    const sightMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Dark metal color
    const frontSightHousing = new THREE.Mesh(
      frontSightHousingGeometry,
      sightMaterial
    );
    frontSightHousing.position.set(0, 0.06, -0.7);
    weaponGroup.add(frontSightHousing);

    // Front sight post (the thin vertical blade you align with the target)
    const frontSightPostGeometry = new THREE.BoxGeometry(0.002, 0.02, 0.002); // Thinner and shorter
    const frontSightPost = new THREE.Mesh(
      frontSightPostGeometry,
      sightMaterial
    );
    frontSightPost.position.set(0, 0.07, -0.7); // Lowered further
    frontSightPost.name = "frontSightPost"; // Name it for easy reference
    weaponGroup.add(frontSightPost);

    // Front sight protective wings (the metal pieces that protect the front sight)
    const frontSightWingGeometry = new THREE.BoxGeometry(0.01, 0.02, 0.002); // Shorter height

    // Left wing
    const leftWing = new THREE.Mesh(frontSightWingGeometry, sightMaterial);
    leftWing.position.set(-0.015, 0.07, -0.7); // Match front sight position
    weaponGroup.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(frontSightWingGeometry, sightMaterial);
    rightWing.position.set(0.015, 0.07, -0.7); // Match front sight position
    weaponGroup.add(rightWing);

    // Rear sight base (the metal piece that holds the rear sight)
    const rearSightBaseGeometry = new THREE.BoxGeometry(0.05, 0.01, 0.03);
    const rearSightBase = new THREE.Mesh(rearSightBaseGeometry, sightMaterial);
    rearSightBase.position.set(0, 0.05, -0.13);
    weaponGroup.add(rearSightBase);

    // Rear sight aperture (the V-notch or hole you look through)
    // For Kar98, we'll create a V-notch style rear sight
    const rearSightNotchGeometry = new THREE.CylinderGeometry(
      0.015,
      0.015,
      0.02,
      3
    ); // Wider triangular prism
    const rearSightNotch = new THREE.Mesh(
      rearSightNotchGeometry,
      sightMaterial
    );
    rearSightNotch.rotation.x = Math.PI / 2;
    rearSightNotch.rotation.z = Math.PI; // Rotate to get the V shape pointing up
    rearSightNotch.position.set(0, 0.065, -0.1); // Slightly higher than front sight
    rearSightNotch.name = "rearSightAperture"; // Name it for easy reference
    weaponGroup.add(rearSightNotch);

    //console.log('DEBUG: Iron sights created with front sight at', frontSightPost.position, 'and rear sight at', rearSightNotch.position);

    return weaponGroup;
  }
}
