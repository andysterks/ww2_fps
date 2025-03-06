# WW2 FPS Game

A World War 2 themed first-person shooter game built with JavaScript, Three.js, and Cannon.js. The game features simplified LEGO-like character models while maintaining an aesthetically pleasing environment, with a focus on performance.

## Features

- First-person shooter gameplay in a World War 2 setting
- Physics-based movement and interactions using Cannon.js
- Simplified LEGO-style character models for better performance
- Weapon system with realistic mechanics (shooting, reloading, etc.)
- Enemy AI with different behavior states (idle, patrol, chase, attack)
- Dynamic world generation with buildings and props
- Performance optimizations for smooth gameplay

## Getting Started

### Prerequisites

- A modern web browser with WebGL support
- Basic web server (for local development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ww2_fps.git
   ```

2. Navigate to the project directory:
   ```
   cd ww2_fps
   ```

3. Start a local web server. You can use Python's built-in server:
   ```
   # For Python 3
   python -m http.server
   
   # For Python 2
   python -m SimpleHTTPServer
   ```

4. Open your browser and navigate to `http://localhost:8000`

## Game Controls

- **W, A, S, D**: Movement
- **Mouse**: Look around
- **Left Mouse Button**: Shoot
- **Right Mouse Button**: Aim
- **R**: Reload
- **Shift**: Sprint
- **Space**: Jump
- **C**: Crouch
- **E**: Interact
- **Escape**: Pause game

## Project Structure

- `index.html`: Main HTML file
- `styles/`: CSS stylesheets
  - `main.css`: Main stylesheet
- `js/`: JavaScript files
  - `main.js`: Entry point
  - `Game.js`: Main game controller
  - `entities/`: Entity classes
    - `Player.js`: Player class
    - `Enemy.js`: Enemy class
  - `weapons/`: Weapon classes
    - `Weapon.js`: Base weapon class
  - `world/`: World-related classes
    - `World.js`: World generation and management
  - `utils/`: Utility classes
    - `AssetLoader.js`: Asset loading utility
    - `InputHandler.js`: Input handling utility
- `assets/`: Game assets
  - `models/`: 3D models
  - `textures/`: Textures
  - `sounds/`: Sound effects

## Asset Requirements

The game requires the following assets to run properly:

- 3D Models:
  - Player model (`assets/models/player.glb`)
  - Enemy model (`assets/models/enemy.glb`)
  - Weapon models (`assets/models/m1_garand.glb`)
  - Building models (`assets/models/building1.glb`, `assets/models/building2.glb`)
  
- Textures:
  - Ground texture (`assets/textures/ground.jpg`)
  - Sky texture (`assets/textures/sky.jpg`)
  
- Sounds:
  - Gunshot sound (`assets/sounds/gunshot.mp3`)
  - Reload sound (`assets/sounds/reload.mp3`)
  - Hit sound (`assets/sounds/hit.mp3`)

## Performance Optimizations

The game includes several performance optimizations:

- Simplified low-poly models
- Optimized textures with nearest-neighbor filtering
- Limited draw distance with fog
- Disabled shadows by default
- Efficient physics calculations
- Object pooling for bullets and effects
- Simplified materials with flat shading

## Future Improvements

- Add more weapon types (pistols, shotguns, etc.)
- Implement a mission/level system
- Add more enemy types with different behaviors
- Improve AI pathfinding
- Add multiplayer support
- Implement a scoring system
- Add more detailed environments and props

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering
- Cannon.js for physics
- Inspiration from classic WW2 FPS games 