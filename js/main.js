// main.js - Entry point for the WW2 FPS game

// Wait for DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the game instance
    const game = new Game();
    
    // Start the asset loading process
    game.init()
        .then(() => {
            console.log('Game initialized successfully');
            
            // Add event listener for the restart button
            document.getElementById('restart-button').addEventListener('click', () => {
                document.getElementById('game-over').classList.add('hidden');
                game.restart();
            });
            
            // Lock pointer for FPS controls when clicking on the game container
            document.getElementById('game-container').addEventListener('click', () => {
                // Only lock if game is running (not in loading or game over state)
                if (!document.getElementById('loading-screen').style.display === 'none' && 
                    document.getElementById('game-over').classList.contains('hidden')) {
                    game.lockControls();
                }
            });
            
            // Handle pointer lock change
            document.addEventListener('pointerlockchange', () => {
                game.handlePointerLockChange();
            });
            
            // Handle escape key to pause the game
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    game.togglePause();
                }
            });
            
            // Start the game loop
            game.start();
        })
        .catch(error => {
            console.error('Failed to initialize game:', error);
            document.getElementById('loading-status').textContent = 'Failed to load game resources. Please refresh the page.';
        });
}); 