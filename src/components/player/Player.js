// Update method for vertical look angle for the rifle
updateRifleForVerticalLook(verticalLookFactor) {
  // Find the rifle in the player model
  const rightArmGroup = this.model?.getObjectByName("rightArmGroup");
  const leftArmGroup = this.model?.getObjectByName("leftArmGroup");
  const rifle = rightArmGroup?.getObjectByName("legoRifle") || this.model?.getObjectByName("playerModelRifle");
  if (!rifle || !rightArmGroup || !leftArmGroup) return;

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
      pitchAngle, // X rotation (pitch) - up/down (NORMAL, NOT INVERTED)
      currentYRotation, // Keep the y rotation consistent with aiming position
      currentZRotation // Z rotation (maintained from current)
    );
    
    // Also adjust the arms to follow the rifle's vertical movement
    rightArmGroup.rotation.set(
      -0.4 + pitchAngle * 0.7, // Base aiming position + adjustment for look (NORMAL)
      0.1,
      0
    );
    
    leftArmGroup.rotation.set(
      -0.45 + pitchAngle * 0.7, // Base aiming position + adjustment for look (NORMAL)
      -0.1,
      0
    );
  } else {
    // In normal stance, the rifle follows with reduced movement
    rifle.rotation.set(
      pitchAngle * 0.5, // Reduced pitch effect when not aiming (NORMAL)
      currentYRotation,
      currentZRotation
    );
    
    // For normal stance, arm movement is handled in animateModel
  }

  // Debug logging occasionally
  if (this.game && this.game.frameCounter % 240 === 0) {
    console.log(`DEBUG: Rifle and arms adjusted for vertical look:`, pitchAngle);
  }
} 