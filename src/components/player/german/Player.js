import * as THREE from "three";
import GermanCollar from "./GermanCollar.js";
import GermanButtons from "./GermanButtons.js";
import GermanPocket from "./GermanPocket.js";
import Kar98 from "../Kar98.js";

const defaultArmZRotation = Math.PI / 2;

// Player class to manage individual player instances
class Player {
  constructor(
    id,
    game,
    isLocal = false,
    initialPosition = { x: 0, y: 0, z: 0 }
  ) {
    console.log(
      `DEBUG: Creating player ${id}, isLocal: ${isLocal}, initialPosition:`,
      initialPosition
    );
    this.id = id;
    this.game = game;
    this.isLocal = isLocal;

    // Position and rotation
    this.position = new THREE.Vector3(
      initialPosition.x,
      initialPosition.y,
      initialPosition.z
    );
    this.rotation = new THREE.Euler(0, 0, 0);

    // For interpolation
    this.targetPosition = new THREE.Vector3(
      initialPosition.x,
      initialPosition.y,
      initialPosition.z
    );
    this.targetRotation = new THREE.Euler(0, 0, 0);

    // 3D model
    this.model = null;

    // Animation properties
    this.legSwing = 0;
    this.armSwing = 0;

    // Movement flags for animation
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;

    // Aiming state
    this.isAimingDownSights = false;

    // Track vertical look adjustments to avoid animation conflicts
    this.isAdjustingVerticalLook = false;
    this.lastVerticalLookFactor = 0;
  }

  // Create a 3D model for the player resembling a WW2 German infantryman in LEGO style
  createModel() {
    console.log(
      `DEBUG: Creating high-fidelity LEGO German soldier minifigure for player ${this.id}`
    );

    try {
      // Create a group for the player model
      this.model = new THREE.Group();
      this.model.name = `player-${this.id}`;

      // Define precise colors for accurate LEGO German WW2 uniform
      const fieldGrayColor = 0x666b6a; // Dark gray for Wehrmacht uniform
      const uniformDetailColor = 0xaa3333; // Red for suspenders
      const skinColor = 0xf8d967; // LEGO yellow
      const blackColor = 0x171717; // Deep black for helmet, hands, etc.
      const helmetColor = 0x444444; // Dark gray for the stahlhelm
      const brownColor = 0x8b4513; // Richer brown for rifle
      const beltColor = 0x111111; // Belt black
      const pouchColor = 0x1a3a6e; // Dark blue for equipment pouches
      const lightGrayColor = 0xc0c0c0; // Light gray for buttons and details

      // Create materials
      const uniformMaterial = new THREE.MeshPhongMaterial({
        color: fieldGrayColor,
        specular: 0x111111,
        shininess: 5,
      });
      const detailMaterial = new THREE.MeshPhongMaterial({
        color: uniformDetailColor,
        specular: 0x222222,
        shininess: 10,
      });
      const skinMaterial = new THREE.MeshPhongMaterial({
        color: skinColor,
        specular: 0x222222,
        shininess: 20,
      });
      const blackMaterial = new THREE.MeshPhongMaterial({
        color: blackColor,
        specular: 0x222222,
        shininess: 50,
      });
      const helmetMaterial = new THREE.MeshPhongMaterial({
        color: helmetColor,
        specular: 0x333333,
        shininess: 30,
      });
      const brownMaterial = new THREE.MeshPhongMaterial({
        color: brownColor,
        specular: 0x222222,
        shininess: 20,
      });
      const pouchMaterial = new THREE.MeshPhongMaterial({
        color: pouchColor,
        specular: 0x222222,
        shininess: 10,
      });
      const lightGrayMaterial = new THREE.MeshPhongMaterial({
        color: lightGrayColor,
        specular: 0x444444,
        shininess: 40,
      });

      // Create a proper LEGO minifigure with correct proportions and connections
      // Base height of a LEGO minifigure is approximately 4 bricks or 1.28 LEGO units
      // We'll adapt this to our scale, where a minifigure is about 1.6 units tall

      // ====== HEAD AND FACE ======
      // LEGO head (cylindrical peg top)
      const headGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.13, 16);
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.y = 1.48; // Position at top of torso
      head.name = "head";

      // Add face details
      // Eyes (black dots)
      const leftEyeGeometry = new THREE.BoxGeometry(0.03, 0.02, 0.01);
      const leftEye = new THREE.Mesh(leftEyeGeometry, blackMaterial);
      leftEye.position.set(0.05, 1.49, 0.14);
      leftEye.name = "leftEye";

      const rightEyeGeometry = new THREE.BoxGeometry(0.03, 0.02, 0.01);
      const rightEye = new THREE.Mesh(rightEyeGeometry, blackMaterial);
      rightEye.position.set(-0.05, 1.49, 0.14);
      rightEye.name = "rightEye";

      // Mouth/smile (thin curved box)
      const mouthGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
      const mouth = new THREE.Mesh(mouthGeometry, blackMaterial);
      mouth.position.set(0, 1.45, 0.14);
      mouth.name = "mouth";

      // Stubble/beard pattern (small dots)
      const createStubbleDot = (x, y) => {
        const dotGeometry = new THREE.BoxGeometry(0.015, 0.015, 0.01);
        const dot = new THREE.Mesh(
          dotGeometry,
          new THREE.MeshPhongMaterial({
            color: 0x8b4513,
            specular: 0x222222,
            shininess: 10,
          })
        );
        dot.position.set(x, y, 0.14);
        return dot;
      };

      // Create stubble group
      const stubbleGroup = new THREE.Group();
      stubbleGroup.name = "stubble";

      // Add multiple dots for beard pattern - adjust positions for new head height
      const stubblePositions = [
        { x: 0.06, y: 1.42 },
        { x: 0.03, y: 1.43 },
        { x: 0.09, y: 1.43 },
        { x: -0.06, y: 1.42 },
        { x: -0.03, y: 1.43 },
        { x: -0.09, y: 1.43 },
        { x: 0.05, y: 1.41 },
        { x: -0.05, y: 1.41 },
        { x: 0, y: 1.41 },
        { x: 0.08, y: 1.44 },
        { x: -0.08, y: 1.44 },
        { x: 0.02, y: 1.42 },
        { x: -0.02, y: 1.42 },
      ];

      stubblePositions.forEach((pos) => {
        stubbleGroup.add(createStubbleDot(pos.x, pos.y));
      });

      // ====== HELMET ======
      // Main helmet shape
      const helmetGeometry = new THREE.SphereGeometry(
        0.18,
        16,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.6
      );
      const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.scale.set(1, 0.75, 1.1); // Flatten and extend slightly
      helmet.position.y = 1.56; // Position above head
      helmet.name = "helmet";

      // Helmet side flaps
      const helmetSideLeftGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.1);
      const helmetSideLeft = new THREE.Mesh(
        helmetSideLeftGeometry,
        helmetMaterial
      );
      helmetSideLeft.position.set(0.18, 1.5, 0);
      helmetSideLeft.name = "helmetSideLeft";

      const helmetSideRightGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.1);
      const helmetSideRight = new THREE.Mesh(
        helmetSideRightGeometry,
        helmetMaterial
      );
      helmetSideRight.position.set(-0.18, 1.5, 0);
      helmetSideRight.name = "helmetSideRight";

      // Helmet back flap
      const helmetBackGeometry = new THREE.BoxGeometry(0.2, 0.02, 0.08);
      const helmetBack = new THREE.Mesh(helmetBackGeometry, helmetMaterial);
      helmetBack.position.set(0, 1.52, -0.17);
      helmetBack.name = "helmetBack";

      // Helmet brim at the front
      const helmetBrimGeometry = new THREE.BoxGeometry(0.2, 0.02, 0.06);
      const helmetBrim = new THREE.Mesh(helmetBrimGeometry, helmetMaterial);
      helmetBrim.position.set(0, 1.52, 0.17);
      helmetBrim.name = "helmetBrim";

      // ====== TORSO ======
      // LEGO torso (trapezoidal shape, wider at shoulders)
      const torsoGeometry = new THREE.BoxGeometry(0.3, 0.33, 0.2);
      const torso = new THREE.Mesh(torsoGeometry, uniformMaterial);
      torso.position.y = 1.3; // Central position of torso
      torso.name = "torso";

      // Add uniform details to torso
      // Buttons (small light gray dots down the center)
      const createButton = (y) => {
        const buttonGeometry = new THREE.CylinderGeometry(
          0.007,
          0.007,
          0.01,
          8
        );
        const button = new THREE.Mesh(buttonGeometry, lightGrayMaterial);
        button.rotation.x = Math.PI / 2;
        button.position.set(0, y, 0.101);
        return button;
      };

      const buttonGroup = new THREE.Group();
      buttonGroup.name = "buttons";

      // Add three buttons
      [1.38, 1.3, 1.22].forEach((y) => {
        buttonGroup.add(createButton(y));
      });

      // Red suspenders (front details)
      const suspenderLeftGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.101);
      const suspenderLeft = new THREE.Mesh(
        suspenderLeftGeometry,
        detailMaterial
      );
      suspenderLeft.position.set(0.08, 1.3, 0.05);
      suspenderLeft.name = "suspenderLeft";

      const suspenderRightGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.101);
      const suspenderRight = new THREE.Mesh(
        suspenderRightGeometry,
        detailMaterial
      );
      suspenderRight.position.set(-0.08, 1.3, 0.05);
      suspenderRight.name = "suspenderRight";

      // Add triangle collar (left side)
      const collarGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0,
        -0.04,
        0, // bottom point
        0.04,
        0,
        0, // top right
        -0.04,
        0,
        0, // top left
      ]);
      collarGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(vertices, 3)
      );
      const leftCollar = new THREE.Mesh(collarGeometry, blackMaterial);
      leftCollar.position.set(-0.05, 1.41, 0.101);
      leftCollar.name = "collar";

      const rightCollar = new THREE.Mesh(collarGeometry, blackMaterial);
      rightCollar.position.set(0.05, 1.41, 0.101);
      rightCollar.name = "collar";

      // Add angled white line for soldier's collar

      // Top right collar line
      const topRightCollarLineGeometry = new THREE.BoxGeometry(
        0.03,
        0.003,
        0.005
      );
      const topRightCollarLine = new THREE.Mesh(
        topRightCollarLineGeometry,
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x444444,
          shininess: 30,
        })
      );
      topRightCollarLine.position.set(0.054, 1.396, 0.101);
      topRightCollarLine.rotation.z = Math.PI / 4; // Rotate 45 degrees
      topRightCollarLine.name = "collarLine";

      // Bottom right collar line
      const bottomRightCollarLineGeometry = new THREE.BoxGeometry(
        0.03,
        0.003,
        0.005
      );
      const bottomRightCollarLine = new THREE.Mesh(
        bottomRightCollarLineGeometry,
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x444444,
          shininess: 30,
        })
      );
      bottomRightCollarLine.position.set(0.06, 1.39, 0.101);
      bottomRightCollarLine.rotation.z = Math.PI / 4; // Rotate 45 degrees
      bottomRightCollarLine.name = "collarLine";

      const rightCollarGroup = new THREE.Group();
      rightCollarGroup.position.set(0, 0, 0.2);
      rightCollarGroup.add(rightCollar);
      rightCollarGroup.add(bottomRightCollarLine);
      rightCollarGroup.add(topRightCollarLine);

      const leftPocket = new GermanPocket(this).createPocket(0.08);
      this.model.add(leftPocket);

      const rightPocketAlt = new GermanPocket(this).createPocket(-0.08);
      this.model.add(rightPocketAlt);

      //   const pocketOutlineGeometry1 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
      //   const pocketOutline1 = new THREE.Mesh(pocketOutlineGeometry1, blackMaterial);
      //   pocketOutline1.position.set(0.08, 1.348, 0.11);
      //   pocketOutline1.name = 'pocketOutline';
      //   this.model.add(pocketOutline1);

      //   const pocketOutlineGeometry2 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
      //   const pocketOutline2 = new THREE.Mesh(pocketOutlineGeometry2, blackMaterial);
      //   pocketOutline2.position.set(0.08, 1.332, 0.11);
      //   pocketOutline2.name = 'pocketOutline';
      //   this.model.add(pocketOutline2);

      //   const pocketOutlineGeometry3 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
      //   const pocketOutline3 = new THREE.Mesh(pocketOutlineGeometry3, blackMaterial);
      //   pocketOutline3.position.set(0.0529, 1.321, 0.11);
      //   pocketOutline3.rotation.z = Math.PI / 2;
      //   pocketOutline3.name = 'pocketOutline3';
      //   this.model.add(pocketOutline3);

      //   const pocketOutlineGeometry4 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
      //   const pocketOutline4 = new THREE.Mesh(pocketOutlineGeometry4, blackMaterial);
      //   pocketOutline4.position.set(0.1065, 1.321, 0.11);
      //   pocketOutline4.rotation.z = Math.PI / 2;
      //   pocketOutline4.name = 'pocketOutline4';
      //   this.model.add(pocketOutline4);

      //   const pocketOutlineGeometry5 = new THREE.BoxGeometry(0.06, 0.005, 0.025);
      //   const pocketOutline5 = new THREE.Mesh(pocketOutlineGeometry5, blackMaterial);
      //   pocketOutline5.position.set(0.08, 1.29, 0.11);
      //   pocketOutline5.name = 'pocketOutline5';
      //   this.model.add(pocketOutline5);

      // ====== HIPS CONNECTION ======
      // The hip connection (small rectangle at bottom of torso)
      const hipConnectionGeometry = new THREE.BoxGeometry(0.25, 0.02, 0.2);
      const hipConnection = new THREE.Mesh(
        hipConnectionGeometry,
        uniformMaterial
      );
      hipConnection.position.y = 1.135; // At bottom of torso
      hipConnection.name = "hipConnection";

      // Belt
      const beltGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.201);
      const belt = new THREE.Mesh(beltGeometry, blackMaterial);
      belt.position.y = 1.14; // Just above hip connection
      belt.name = "belt";

      // Belt buckle
      const beltBuckleGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.202);
      const beltBuckle = new THREE.Mesh(beltBuckleGeometry, lightGrayMaterial);
      beltBuckle.position.set(0, 1.14, 0.102);
      beltBuckle.name = "beltBuckle";

      // Blue equipment pouches on belt
      const leftPouchGeometry = new THREE.BoxGeometry(0.07, 0.08, 0.202);
      const leftPouch = new THREE.Mesh(leftPouchGeometry, pouchMaterial);
      leftPouch.position.set(0.12, 1.14, 0.05);
      leftPouch.name = "leftPouch";

      const rightPouchGeometry = new THREE.BoxGeometry(0.07, 0.08, 0.202);
      const rightPouch = new THREE.Mesh(rightPouchGeometry, pouchMaterial);
      rightPouch.position.set(-0.12, 1.14, 0.05);
      rightPouch.name = "rightPouch";

      // ====== ARMS AND HANDS ======
      // Shoulder connectors (small cylinders at top of arms)
      const shoulderConnectorGeometry = new THREE.CylinderGeometry(
        0.035,
        0.035,
        0.05,
        8
      );

      const leftShoulderConnector = new THREE.Mesh(
        shoulderConnectorGeometry,
        uniformMaterial
      );
      leftShoulderConnector.rotation.z = Math.PI / 2; // Horizontal
      leftShoulderConnector.position.set(0.175, 1.4, 0);
      leftShoulderConnector.name = "leftShoulderConnector";

      const rightShoulderConnector = new THREE.Mesh(
        shoulderConnectorGeometry,
        uniformMaterial
      );
      rightShoulderConnector.rotation.z = -Math.PI / 2; // Horizontal
      rightShoulderConnector.position.set(-0.175, 1.4, 0);
      rightShoulderConnector.name = "rightShoulderConnector";

      // LEGO arms (cylindrical, attach at shoulder)
      const armGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8);

      const leftArm = new THREE.Mesh(armGeometry, uniformMaterial);
      leftArm.rotation.z = defaultArmZRotation;
      leftArm.position.set(0.215, 1.3, 0); // Connected to shoulder
      leftArm.name = "leftArm";

      const rightArm = new THREE.Mesh(armGeometry, uniformMaterial);
      rightArm.rotation.z = -Math.PI / 2; // Horizontal
      rightArm.position.set(-0.215, 1.3, 0); // Connected to shoulder
      rightArm.name = "rightArm";

      // LEGO hands (C-shaped clamps)
      const handGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8);

      const leftHand = new THREE.Mesh(handGeometry, blackMaterial);
      leftHand.rotation.z = Math.PI / 2; // Horizontal
      leftHand.position.set(0.215, 1.17, 0); // Connected to end of arm
      leftHand.name = "leftHand";

      const rightHand = new THREE.Mesh(handGeometry, blackMaterial);
      rightHand.rotation.z = -Math.PI / 2; // Horizontal
      rightHand.position.set(-0.215, 1.17, 0); // Connected to end of arm
      rightHand.name = "rightHand";

      // ====== LEGS AND FEET ======
      // Hip joint (where legs connect to body)
      const hipJointGeometry = new THREE.BoxGeometry(0.25, 0.04, 0.2);
      const hipJoint = new THREE.Mesh(hipJointGeometry, uniformMaterial);
      hipJoint.position.y = 1.11; // Just below the hip connection
      hipJoint.name = "hipJoint";

      // LEGO legs (rectangular with slight taper)
      const legGeometry = new THREE.BoxGeometry(0.1, 0.35, 0.2);

      // Left leg - connected to hip
      const leftLeg = new THREE.Mesh(legGeometry, uniformMaterial);
      leftLeg.position.set(0.075, 0.92, 0); // Connected to hip joint
      leftLeg.name = "leftLeg";

      // Right leg - connected to hip
      const rightLeg = new THREE.Mesh(legGeometry, uniformMaterial);
      rightLeg.position.set(-0.075, 0.92, 0); // Connected to hip joint
      rightLeg.name = "rightLeg";

      // LEGO feet (flat rectangles)
      const footGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.25);

      // Left foot - connected to bottom of leg
      const leftFoot = new THREE.Mesh(footGeometry, blackMaterial);
      leftFoot.position.set(0.075, 0.685, 0.025); // Connected to bottom of leg
      leftFoot.name = "leftFoot";

      // Right foot - connected to bottom of leg
      const rightFoot = new THREE.Mesh(footGeometry, blackMaterial);
      rightFoot.position.set(-0.075, 0.685, 0.025); // Connected to bottom of leg
      rightFoot.name = "rightFoot";

      // ====== ASSEMBLE MODEL ======
      // Add head & face
      this.model.add(head);
      this.model.add(leftEye);
      this.model.add(rightEye);
      this.model.add(mouth);
      this.model.add(stubbleGroup);

      // Add helmet
      this.model.add(helmet);
      this.model.add(helmetBrim);
      this.model.add(helmetSideLeft);
      this.model.add(helmetSideRight);
      this.model.add(helmetBack);

      // Add torso & uniform details
      this.model.add(torso);
      this.model.add(buttonGroup);
      const creases = new GermanButtons(this).addCreases();
      this.model.add(creases[0]);
      this.model.add(creases[1]);
      this.model.add(suspenderLeft);
      this.model.add(suspenderRight);
      const collar = new GermanCollar(this).createCollarGroup();
      this.model.add(collar);

      // Add hip connection & belt
      this.model.add(hipConnection);
      this.model.add(hipJoint);
      this.model.add(belt);
      this.model.add(beltBuckle);
      this.model.add(leftPouch);
      this.model.add(rightPouch);

      // Add shoulders, arms & hands
      this.model.add(leftShoulderConnector);
      this.model.add(rightShoulderConnector);
      this.model.add(leftArm);
      this.model.add(rightArm);
      this.model.add(leftHand);
      this.model.add(rightHand);

      // Add legs & feet
      this.model.add(leftLeg);
      this.model.add(rightLeg);
      this.model.add(leftFoot);
      this.model.add(rightFoot);

      // Only add rifle to remote players (local player has first-person weapon)
      if (!this.isLocal) {
        // Add a detailed LEGO-style Kar98k rifle
        console.log(
          "DEBUG: Creating detailed LEGO Kar98k rifle for player model"
        );

        // Create a detailed LEGO-style rifle group
        const rifleGroup = new Kar98().create(-0.215, 1.12, -0.1);
        rifleGroup.name = "legoRifle";

        // Add to model
        this.model.add(rifleGroup);
        this.rifle = rifleGroup;

        console.log(
          "DEBUG: Added detailed LEGO-style Kar98k rifle to player model"
        );
      }

      // Position the model so its feet are at y=0
      this.model.position.set(this.position.x, 0, this.position.z);

      // Add the model to the scene
      if (this.game && this.game.scene) {
        this.game.scene.add(this.model);
        console.log(
          `DEBUG: High-fidelity LEGO minifigure created for player ${this.id} at position:`,
          this.model.position
        );
      } else {
        console.error(`DEBUG: Cannot add model to scene - scene not available`);
      }
    } catch (error) {
      console.error(
        `ERROR: Failed to create LEGO minifigure for player ${this.id}:`,
        error
      );
    }

    return this.model;
  }

  // Create a simple LEGO-style rifle model when the detailed model fails to load
  createSimpleRifle() {
    console.log(
      `DEBUG: Creating simple LEGO-style Kar98k rifle for player ${this.id}`
    );

    try {
      // Create a group for the rifle
      const rifleGroup = new THREE.Group();
      rifleGroup.name = "simpleRifle";

      // Define colors for the rifle
      const woodColor = 0x5c3a21; // Brown wood color
      const metalColor = 0x444444; // Dark gray for metal parts

      // Create materials
      const woodMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
      const metalMaterial = new THREE.MeshLambertMaterial({
        color: metalColor,
      });

      // Main rifle stock (wood part) - more blocky for LEGO style
      const stockGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.3);
      const stock = new THREE.Mesh(stockGeometry, woodMaterial);
      stock.position.set(0, 0, 0);
      stock.name = "stock";
      rifleGroup.add(stock);

      // Rifle barrel (thinner, longer metal part) - blocky for LEGO style
      const barrelGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.4);
      const barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
      barrel.position.set(0, 0.005, -0.18);
      barrel.name = "barrel";
      rifleGroup.add(barrel);

      // Scope or sight
      const sightGeometry = new THREE.BoxGeometry(0.02, 0.04, 0.02);
      const sight = new THREE.Mesh(sightGeometry, metalMaterial);
      sight.position.set(0, 0.03, 0.05);
      sight.name = "sight";
      rifleGroup.add(sight);

      // Bolt handle (small box on the side for LEGO style)
      const boltGeometry = new THREE.BoxGeometry(0.05, 0.02, 0.02);
      const bolt = new THREE.Mesh(boltGeometry, metalMaterial);
      bolt.position.set(0.035, 0.01, 0.05);
      bolt.name = "bolt";
      rifleGroup.add(bolt);

      // Strap mount front
      const mountFrontGeometry = new THREE.BoxGeometry(0.04, 0.02, 0.02);
      const mountFront = new THREE.Mesh(mountFrontGeometry, metalMaterial);
      mountFront.position.set(0, -0.01, -0.05);
      rifleGroup.add(mountFront);

      // Strap mount back
      const mountBackGeometry = new THREE.BoxGeometry(0.04, 0.02, 0.02);
      const mountBack = new THREE.Mesh(mountBackGeometry, metalMaterial);
      mountBack.position.set(0, -0.01, 0.1);
      rifleGroup.add(mountBack);

      // Position the rifle in the right hand for the LEGO soldier
      rifleGroup.position.set(-0.3, 0.95, 0.15);

      // Rotation to be held properly in hand
      rifleGroup.rotation.set(0, Math.PI / 3, 0);

      // Scale appropriately for LEGO figure
      rifleGroup.scale.set(0.8, 0.8, 0.8);

      // Add to model
      if (this.model) {
        this.model.add(rifleGroup);
        this.rifle = rifleGroup;
        console.log(
          `DEBUG: Added simple LEGO-style rifle to player ${this.id}`
        );
      } else {
        console.error(
          `DEBUG: Cannot add rifle - model not available for player ${this.id}`
        );
      }

      return rifleGroup;
    } catch (error) {
      console.error(
        `ERROR: Failed to create simple rifle for player ${this.id}:`,
        error
      );
      return null;
    }
  }

  // Update player position and rotation based on controls (for local player)
  // or based on network data (for remote players)
  update(delta) {
    // Keep track of whether this is the local player or remote player
    const isRemotePlayer = !this.isLocalPlayer;

    // Store previous position for movement detection
    const previousPosition = this.position.clone();

    // For local player, get position and rotation from camera
    if (this.isLocalPlayer) {
      if (this.game && this.game.camera) {
        // Copy position directly from camera
        this.position.copy(this.game.camera.position);

        // Calculate forward direction for model orientation
        const forwardVector = new THREE.Vector3(0, 0, -1);
        forwardVector.applyQuaternion(this.game.camera.quaternion);

        // Store direction vector
        if (!this.directionVector) {
          this.directionVector = new THREE.Vector3();
        }
        this.directionVector.copy(forwardVector);

        // Store vertical look angle
        this.verticalLookAngle = this.game.camera.rotation.x;

        // Debug log camera rotation occasionally
        if (this.game && this.game.frameCounter % 240 === 0) {
          console.log(
            `DEBUG: Local player ${this.id} direction:`,
            this.directionVector
          );
          console.log(
            `DEBUG: Local player ${this.id} vertical look:`,
            this.verticalLookAngle
          );
        }

        // Update aiming state from game
        if (this.game.isAimingDownSights !== undefined) {
          this.isAimingDownSights = this.game.isAimingDownSights;
        }

        // Set movement flags based on actual position change for animation
        if (!this.lastPosition) {
          this.lastPosition = new THREE.Vector3().copy(this.position);
        }

        const positionDelta = this.position.distanceTo(this.lastPosition);
        if (positionDelta > 0.01) {
          // Player is moving - update movement flags based on key inputs from game
          if (this.game.controls) {
            this.moveForward = this.game.controls.moveForward;
            this.moveBackward = this.game.controls.moveBackward;
            this.moveLeft = this.game.controls.moveLeft;
            this.moveRight = this.game.controls.moveRight;
            this.isSprinting = this.game.controls.isSprinting;
          }
        } else {
          // Not moving
          this.moveForward = false;
          this.moveBackward = false;
          this.moveLeft = false;
          this.moveRight = false;
          this.isSprinting = false;
        }

        // Store position for next frame
        this.lastPosition.copy(this.position);
      }
    } else {
      // For remote players, interpolate towards target position
      // Update position interpolation
      if (this.position.distanceTo(this.targetPosition) > 0.01) {
        this.position.lerp(this.targetPosition, Math.min(1.0, 10.0 * delta));

        // If we're moving toward the target, set movement flags for animation
        const movementAmount = this.position.distanceTo(previousPosition);
        if (movementAmount > 0.001) {
          // Determine direction of movement for appropriate movement flags
          const movementDirection = new THREE.Vector3()
            .subVectors(this.targetPosition, previousPosition)
            .normalize();

          // Set generic "moving" flag since remote player's exact inputs aren't known
          this.moveForward = true;
          this.isSprinting = movementAmount > 0.02; // Sprint if moving fast enough
        }
      } else {
        this.position.copy(this.targetPosition);
        // Clear movement flags when reaching destination
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
      }

      // Log every 240 frames
      if (this.game && this.game.frameCounter % 240 === 0) {
        console.log(
          `DEBUG: Player ${this.id} position:`,
          this.position.clone()
        );
        if (this.directionVector) {
          console.log(
            `DEBUG: Player ${this.id} direction:`,
            this.directionVector.clone()
          );
        }
      }
    }

    // Apply direction to the model (both local and remote players)
    if (this.model && this.directionVector) {
      // Make sure model is visible
      this.model.visible = true;

      // Update model position
      // IMPORTANT: For players, we need to adjust the y-position
      // The model's origin is at the bottom of the feet, but the player's position is at eye level
      this.model.position.set(
        this.position.x,
        0, // Set y to 0 to place feet on the ground
        this.position.z
      );

      // SIMPLIFIED APPROACH: Use lookAt with Y=0 to orient the model horizontally
      // while maintaining upright position

      // First, create a target position in the direction the player is facing
      const targetPosition = new THREE.Vector3();
      targetPosition.copy(this.model.position); // Start from model's position

      // FIXED: ADD the direction vector instead of subtracting to make the model
      // face in the opposite direction (face the player/camera)
      targetPosition.x += this.directionVector.x;
      // targetPosition.y = this.model.position.y; // Keep Y the same (already 0)
      targetPosition.z += this.directionVector.z;

      // Reset model rotation first to avoid accumulation
      this.model.rotation.set(0, 0, 0);

      // Have the model look at the target position
      this.model.lookAt(targetPosition);

      // Log model orientation periodically
      if (this.game && this.game.frameCounter % 240 === 0) {
        console.log(`DEBUG: Model position:`, this.model.position.clone());
        console.log(`DEBUG: Model looking at:`, targetPosition);
        console.log(`DEBUG: Model rotation:`, this.model.rotation.clone());
      }
    }

    // Update rifle position based on aiming state and vertical look
    this.updateRiflePosition();

    // Update rifle vertical angle based on vertical look
    if (this.rifle && typeof this.verticalLookAngle === "number") {
      // Apply the vertical look angle to the rifle
      this.updateRifleForVerticalLook(Math.sin(this.verticalLookAngle));
    }

    // Animate the model (legs, arms, etc.)
    this.animateModel(delta);

    // Update the camera if this is the local player
    if (this.isLocalPlayer && this.thirdPersonCamera) {
      this.thirdPersonCamera.update(delta);
    }

    // Increment update counter
    if (!this.updateCount) this.updateCount = 0;
    this.updateCount++;
  }

  // Separate method for model animation
  animateModel(delta) {
    try {
      if (!this.model || !this.model.children) return;

      // Determine if the player is moving
      const isMoving =
        this.moveForward ||
        this.moveBackward ||
        this.moveLeft ||
        this.moveRight ||
        this.position.distanceTo(this.targetPosition) > 0.01 ||
        Math.abs(this.rotation.y - this.targetRotation.y) > 0.01;

      // Get references to all limbs
      const leftArm = this.model.getObjectByName("leftArm");
      const rightArm = this.model.getObjectByName("rightArm");
      const leftLeg = this.model.getObjectByName("leftLeg");
      const rightLeg = this.model.getObjectByName("rightLeg");
      const leftFoot = this.model.getObjectByName("leftFoot");
      const rightFoot = this.model.getObjectByName("rightFoot");
      const leftHand = this.model.getObjectByName("leftHand");
      const rightHand = this.model.getObjectByName("rightHand");

      // Skip arm positioning for aiming, as it's now handled in updateRifleForVerticalLook
      if (this.isAimingDownSights) {
        // Skip regular movement animation when aiming
        // Arm positioning for aiming is now handled in updateRifleForVerticalLook
        return;
      }

      // Animation speed factors
      const walkSpeed = 5.0; // Base animation speed
      const sprintMultiplier = 1.7; // How much faster the animation plays when sprinting
      const animSpeed = this.isSprinting
        ? walkSpeed * sprintMultiplier
        : walkSpeed;

      // Running animation
      if (isMoving) {
        // Update animation counter based on movement speed
        this.legSwing += delta * animSpeed;
        this.armSwing = -this.legSwing; // Arms swing opposite to legs

        // Calculate swing amplitudes
        const legMaxAngle = this.isSprinting ? 0.4 : 0.3; // Wider swings when sprinting
        const armMaxAngle = this.isSprinting ? 0.7 : 0.5; // Arms swing more when running

        // Calculate periodic animation values using sine waves
        const legAngle = Math.sin(this.legSwing) * legMaxAngle;
        const armAngle = Math.sin(this.armSwing) * armMaxAngle;

        // Apply leg animations with slight offset between left and right
        if (leftLeg && rightLeg) {
          // Left leg swings forward when angle is positive
          leftLeg.rotation.x = legAngle;
          // Right leg swings in opposite direction
          rightLeg.rotation.x = -legAngle;

          // Adjust feet to match leg angles for a more natural look
          if (leftFoot) leftFoot.rotation.x = legAngle * 0.7;
          if (rightFoot) rightFoot.rotation.x = -legAngle * 0.7;

          // Slight vertical bob for the legs
          const verticalBob = Math.abs(Math.sin(this.legSwing * 2)) * 0.03;
          leftLeg.position.y = 0.92 + verticalBob;
          rightLeg.position.y = 0.92 + verticalBob;
        }

        // Apply arm animations - opposite to legs for natural running motion
        if (leftArm && rightArm) {
          // Forward/backward swing
          leftArm.rotation.x = armAngle;
          rightArm.rotation.x = -armAngle;

          // Move hands with arms
          if (leftHand) {
            leftHand.rotation.x = armAngle;
            leftHand.position.y = 1.17 + armAngle * 0.05;
          }

          if (rightHand) {
            rightHand.rotation.x = -armAngle;
            rightHand.position.y = 1.17 + -armAngle * 0.05;
          }
        }

        // Add slight torso rotation for more natural movement
        const torso = this.model.getObjectByName("torso");
        if (torso) {
          // Subtle torso twist as character runs
          torso.rotation.y = Math.sin(this.legSwing) * 0.05;
        }
      } else {
        // Reset animation counters when not moving
        this.legSwing = 0;
        this.armSwing = 0;

        // Reset rotations to default poses when not moving and not aiming
        if (!this.isAdjustingVerticalLook) {
          // Reset arm positions
          if (leftArm) {
            leftArm.rotation.x = 0;
            leftArm.rotation.y = 0;
            leftArm.rotation.z = 0; // Default horizontal position
          }

          if (rightArm) {
            rightArm.rotation.x = 0;
            rightArm.rotation.y = 0;
            rightArm.rotation.z = 0; // Default horizontal position
          }

          // Reset legs
          if (leftLeg) {
            leftLeg.rotation.x = 0;
            leftLeg.position.y = 0.92; // Default position
          }

          if (rightLeg) {
            rightLeg.rotation.x = 0;
            rightLeg.position.y = 0.92; // Default position
          }

          // Reset feet
          if (leftFoot) leftFoot.rotation.x = 0;
          if (rightFoot) rightFoot.rotation.x = 0;

          // Reset hands
          if (leftHand) {
            leftHand.rotation.x = 0;
            leftHand.position.y = 1.17; // Default position
          }

          if (rightHand) {
            rightHand.rotation.x = 0;
            rightHand.position.y = 1.17; // Default position
          }

          // Reset torso
          const torso = this.model.getObjectByName("torso");
          if (torso) {
            torso.rotation.y = 0;
          }
        }
      }
    } catch (error) {
      console.error("Error in animateModel:", error);
    }
  }

  // Set movement flags based on input (for local player)
  setMovementFlags(forward, backward, left, right, sprinting) {
    this.moveForward = forward;
    this.moveBackward = backward;
    this.moveLeft = left;
    this.moveRight = right;
    this.isSprinting = sprinting;
  }

  // Update player position based on network data (for remote players)
  updateFromNetwork(
    position,
    direction,
    verticalLook,
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    isSprinting,
    isAimingDownSights
  ) {
    // Log received network data for debugging
    console.log(`DEBUG: Network update received for player ${this.id}:`, {
      position,
      direction,
      verticalLook,
      movement: { moveForward, moveBackward, moveLeft, moveRight, isSprinting },
      aiming: isAimingDownSights,
    });

    // Perform stricter validation
    const isValidPosition =
      position &&
      typeof position.x === "number" &&
      !isNaN(position.x) &&
      typeof position.y === "number" &&
      !isNaN(position.y) &&
      typeof position.z === "number" &&
      !isNaN(position.z);

    const isValidDirection =
      direction &&
      typeof direction.x === "number" &&
      !isNaN(direction.x) &&
      typeof direction.y === "number" &&
      !isNaN(direction.y) &&
      typeof direction.z === "number" &&
      !isNaN(direction.z);

    // Set target position from network
    if (isValidPosition) {
      this.targetPosition.set(position.x, position.y, position.z);
    } else {
      console.error(
        `ERROR: Invalid position received for player ${this.id}:`,
        position
      );
      // Don't update position if invalid data is received
    }

    // Store direction vector for model orientation
    if (isValidDirection) {
      console.log(
        `DEBUG: Network direction received for player ${this.id}:`,
        direction
      );

      // Store the direction vector for use in the update method
      if (!this.directionVector) {
        this.directionVector = new THREE.Vector3();
      }
      this.directionVector.set(direction.x, direction.y, direction.z);

      // Store last valid direction for fallback
      this.lastValidNetworkDirection = {
        x: direction.x,
        y: direction.y,
        z: direction.z,
      };
    } else {
      console.error(
        `ERROR: Invalid direction received for player ${this.id}:`,
        direction
      );

      // If we have a last valid direction, use it instead
      if (this.lastValidNetworkDirection && this.directionVector) {
        console.log(
          `DEBUG: Using last valid direction for player ${this.id}:`,
          this.lastValidNetworkDirection
        );
        this.directionVector.set(
          this.lastValidNetworkDirection.x,
          this.lastValidNetworkDirection.y,
          this.lastValidNetworkDirection.z
        );
      }
    }

    // Store vertical look angle for rifle aiming
    if (typeof verticalLook === "number" && !isNaN(verticalLook)) {
      this.verticalLookAngle = verticalLook;
    }

    // Set movement flags (for animation)
    this.moveForward = moveForward || false;
    this.moveBackward = moveBackward || false;
    this.moveLeft = moveLeft || false;
    this.moveRight = moveRight || false;
    this.isSprinting = isSprinting || false;

    // Set aiming state
    this.isAimingDownSights = isAimingDownSights || false;
  }

  // Update rifle position based on aiming state
  updateRiflePosition() {
    // Find the rifle in the player model
    const rifle = this.model.getObjectByName("playerModelRifle");
    if (!rifle) return;

    if (this.isAimingDownSights) {
      // Position for aiming down sights
      // Move the rifle up to shoulder level and forward
      rifle.position.set(0, 1.4, -0.3);
      // Rotate to point forward
      rifle.rotation.set(0, 0, 0);

      // Add debug logging occasionally
      if (this.game && this.game.frameCounter % 120 === 0) {
        console.log(
          `DEBUG: Player ${this.id} rifle positioned for aiming:`,
          rifle.position.clone()
        );
      }
    } else {
      // Position for normal stance
      // Rifle held at side/hip
      rifle.position.set(0.3, 1.1, -0.15);
      // Angled slightly
      rifle.rotation.set(0, Math.PI / 4, 0);

      // Add debug logging occasionally
      if (this.game && this.game.frameCounter % 120 === 0) {
        console.log(
          `DEBUG: Player ${this.id} rifle positioned for normal stance:`,
          rifle.position.clone()
        );
      }
    }
  }

  // New method to handle vertical look angle for the rifle
  updateRifleForVerticalLook(verticalLookFactor) {
    // Find the rifle in the player model
    const rifle = this.model.getObjectByName("playerModelRifle");
    if (!rifle) return;

    // Calculate pitch angle for the rifle based on vertical look factor
    // verticalLookFactor is the y component of the forward vector, ranging from -1 to 1
    // We'll convert this to an angle between -45 and 45 degrees (or whatever range looks good)
    const pitchAngle = Math.asin(
      Math.max(-0.7, Math.min(0.7, verticalLookFactor))
    );

    // Apply the pitch rotation to the rifle
    // We keep the existing Y rotation (for aiming vs normal stance) but modify X to point up/down
    const currentYRotation = rifle.rotation.y;
    const currentZRotation = rifle.rotation.z;

    // Differentiate between aiming down sights and normal stance
    if (this.isAimingDownSights) {
      // When aiming, the rifle should follow the look direction more precisely
      rifle.rotation.set(
        pitchAngle, // X rotation (pitch) - up/down
        currentYRotation, // Y rotation (maintained from current)
        currentZRotation // Z rotation (maintained from current)
      );
    } else {
      // In normal stance, the rifle follows with reduced movement
      rifle.rotation.set(
        pitchAngle * 0.5, // Reduced pitch effect when not aiming
        currentYRotation,
        currentZRotation
      );
    }

    // Also adjust arms to match the rifle's orientation
    const leftArm = this.model.getObjectByName("leftArm");
    const rightArm = this.model.getObjectByName("rightArm");
    // commented out to test the new arm position
    //   if (leftArm && rightArm) {
    //       // Base arm positioning from the existing animate method
    //       if (this.isAimingDownSights) {
    //           // Adjust arm rotations to follow the rifle pitch
    //           leftArm.rotation.x = -Math.PI / 4 + pitchAngle;
    //           rightArm.rotation.x = -Math.PI / 3 + pitchAngle;
    //       } else {
    //           // Normal stance - slight adjustment for pitch
    //           leftArm.rotation.x = pitchAngle * 0.5;
    //           rightArm.rotation.x = pitchAngle * 0.5;
    //       }
    //   }

    // Debug logging occasionally
    if (this.game && this.game.frameCounter % 240 === 0) {
      console.log(`DEBUG: Rifle pitch adjusted for vertical look:`, pitchAngle);
    }
  }

  // Serialize player data for network transmission
  serialize() {
    try {
      // Log raw rotation before serialization
      console.log(
        `DEBUG: Player ${this.id} raw rotation before serialization:`,
        this.rotation
          ? { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z }
          : "undefined"
      );

      // Create a safe copy of position and rotation
      const safePosition = {
        x: this.position ? this.position.x || 0 : 0,
        y: this.position ? this.position.y || 0 : 0,
        z: this.position ? this.position.z || 0 : 0,
      };

      const safeRotation = {
        x: this.rotation ? this.rotation.x || 0 : 0,
        y: this.rotation ? this.rotation.y || 0 : 0,
        z: this.rotation ? this.rotation.z || 0 : 0,
      };

      // Log serialized rotation
      console.log(
        `DEBUG: Player ${this.id} serialized rotation:`,
        safeRotation
      );

      const data = {
        id: this.id,
        position: safePosition,
        rotation: safeRotation,
      };

      // Only log occasionally to reduce console spam
      if (this.game && this.game.frameCounter % 300 === 0) {
        console.log(`DEBUG: Serialized player ${this.id} data:`, data);
      }

      return data;
    } catch (error) {
      console.error(`ERROR: Failed to serialize player ${this.id}:`, error);

      // Return a safe fallback
      return {
        id: this.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      };
    }
  }

  getPosition() {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };
  }

  getRotation() {
    return {
      x: this.rotation.x,
      y: this.rotation.y,
      z: this.rotation.z,
    };
  }
}

// Export the Player class for use in other files
export default Player;
