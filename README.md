# WW2 FPS Multiplayer Game

A World War 2 First Person Shooter using Three.js with multiplayer support.

## Features

- First-person shooter gameplay
- LEGO-style German soldier models
- Multiplayer support with WebSocket
- Realistic weapon handling
- Sprint functionality
- Debug information display

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the WebSocket server:
   ```
   npm run server
   ```

3. In a separate terminal, start the game client:
   ```
   npm run start
   ```

4. Open multiple browser windows to http://localhost:5173 to see multiple players in the game.

## How to Play

- Click on the game to lock your mouse pointer
- Use WASD keys to move
- Hold Shift to sprint
- Press Escape to unlock the mouse pointer

## Multiplayer

The game uses WebSockets to communicate between players. When a new player connects:

1. They are assigned a unique ID
2. They receive information about all existing players
3. All existing players are notified about the new player
4. Player movements are synchronized in real-time

## Development

- The client code is in `src/index.js`
- The WebSocket server is in `websocket-server.js`
- Player models are created using Three.js geometries

## Requirements

- Node.js 14+
- Modern browser with WebGL support
