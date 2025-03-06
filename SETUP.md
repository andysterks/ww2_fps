# Setup Guide

## Required Libraries

This project requires the following JavaScript libraries:

1. **Three.js** - A 3D rendering library
2. **GLTFLoader** - A Three.js extension for loading GLTF models
3. **Cannon.js** - A physics engine

## Adding the Libraries

### Option 1: Using CDN (Recommended for Development)

The project is already set up to use CDN links in the `index.html` file:

```html
<!-- Three.js library -->
<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"></script>
<!-- Cannon.js for physics -->
<script src="https://cdn.jsdelivr.net/npm/cannon@0.6.2/build/cannon.min.js"></script>
```

However, you'll need to add the GLTFLoader. Add this line after the Three.js script:

```html
<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js"></script>
```

### Option 2: Local Installation (Recommended for Production)

For better performance and reliability in production, you should download the libraries and include them locally:

1. Download Three.js from: https://github.com/mrdoob/three.js/releases
2. Download Cannon.js from: https://github.com/schteppe/cannon.js/releases

Extract the files and place them in a `libs` directory in your project:

```
ww2_fps/
├── libs/
│   ├── three.min.js
│   ├── GLTFLoader.js
│   └── cannon.min.js
├── js/
├── styles/
└── index.html
```

Then update the script tags in `index.html`:

```html
<!-- Three.js library -->
<script src="libs/three.min.js"></script>
<!-- GLTFLoader -->
<script src="libs/GLTFLoader.js"></script>
<!-- Cannon.js for physics -->
<script src="libs/cannon.min.js"></script>
```

## Additional Libraries (Optional)

For enhanced functionality, you might want to add these libraries:

- **OrbitControls.js** - For camera controls during development
- **Stats.js** - For performance monitoring
- **dat.GUI** - For creating debug controls

## Troubleshooting

If you encounter errors related to missing libraries:

1. Check the browser console for specific error messages
2. Verify that all script tags have the correct paths
3. Ensure the libraries are loaded before your game code
4. Check for version compatibility issues between libraries

## Development Tools

For the best development experience, consider using:

- Visual Studio Code with the Live Server extension
- Chrome DevTools for debugging
- Three.js Inspector browser extension 