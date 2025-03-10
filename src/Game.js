setupEventListeners() {
    // Lock/unlock pointer
    document.addEventListener('click', (event) => {
        // Only handle left-click (button 0)
        if (event.button !== 0) {
            console.log("DEBUG: Ignoring non-left-click in Game");
            return;
        }
        
        if (!this.player.getControls().isLocked) {
            this.player.getControls().lock();
            this.isRunning = true;
        } else if (this.weaponSystem.canShoot) {
            // Shoot when left-clicking
            this.shoot();
            
            // Log aiming state for debugging
            console.log('Shooting with aiming state:', {
                isAiming: this.weaponSystem.getAimingState(),
                isAimingDownSights: this.weaponSystem.isAimingDownSights()
            });
        }
    });
} 