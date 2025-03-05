# WW2 FPS Game

A World War 2 themed first-person shooter game built with Three.js.

## Project Structure

The codebase has been refactored into a modular architecture for better maintainability and organization:

```
ww2-fps/
├── index.html              # Main HTML entry point
├── styles/                 # CSS styles
│   └── main.css            # Main stylesheet
├── src/                    # Source code
│   ├── index.js            # Entry point
│   ├── Game.js             # Main game orchestrator
│   ├── audio.js            # Audio management system
│   └── components/         # Game components
│       ├── player/         # Player-related components
│       │   └── PlayerController.js  # Player movement and controls
│       ├── weapons/        # Weapon-related components
│       │   └── WeaponSystem.js      # Weapon mechanics and rendering
│       ├── environment/    # Environment-related components
│       │   └── Environment.js       # Game world and objects
│       └── ui/             # User interface components
│           └── GameUI.js            # HUD and game UI
├── models/                 # 3D models
└── sounds/                 # Audio files
```

## Features

- First-person shooter mechanics with realistic movement
- M1 Garand rifle with accurate shooting mechanics
- View bobbing with stable camera orientation (no unwanted rotation)
- Sound effects for shooting, reloading, and bullet impacts
- Simple urban environment with buildings and obstacles
- Collision detection system

## Controls

- **WASD**: Move
- **Shift**: Sprint
- **F**: Aim down sights
- **R**: Reload weapon
- **Click**: Shoot
- **ESC**: Exit pointer lock

## Technical Details

### Camera System

The camera system has been designed to maintain a level horizon at all times, preventing any unwanted rotation when moving or aiming. This is achieved by:

1. Using Three.js PointerLockControls for camera rotation
2. Implementing a view bobbing system that only affects vertical movement
3. Separating weapon movement from camera orientation

### Weapon System

The weapon system features:

- Realistic weapon bobbing during movement
- Aiming down sights with FOV adjustment
- Bullet impact effects with particle systems
- Ammo management with reload mechanics
- M1 Garand ping sound when firing the last round

### Audio System

The game uses a robust audio system with:

- Web Audio API for primary sound processing
- HTML5 Audio fallback for compatibility
- Sound effects for all game actions
- Mute toggle functionality

## Development

To run the game locally:

1. Clone the repository
2. Open the project in a local web server
3. Navigate to the index.html file in your browser

## Future Improvements

- Add more weapons and environments
- Implement enemy AI
- Add game objectives and scoring
- Enhance visual effects and lighting
- Add multiplayer capabilities
