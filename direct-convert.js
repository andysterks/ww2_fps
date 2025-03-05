// Direct conversion script with simpler approach
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const sourceFile = path.join(__dirname, 'public', 'sounds', '386842__nioczkus__m1-garand-rifle.aiff');
const targetFile = path.join(__dirname, 'public', 'sounds', 'm1_garand_shot.mp3');
const backupFile = path.join(__dirname, 'public', 'sounds', 'm1_garand_shot.mp3.bak');

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file not found: ${sourceFile}`);
  process.exit(1);
}

// Create backup of existing MP3 file if it doesn't already exist
if (fs.existsSync(targetFile) && !fs.existsSync(backupFile)) {
  console.log(`Creating backup of existing gunshot sound: ${backupFile}`);
  fs.copyFileSync(targetFile, backupFile);
}

// Convert using afconvert (macOS built-in tool)
console.log(`Converting ${sourceFile} to ${targetFile} using afconvert...`);

// Direct conversion to MP3 format
const command = `afconvert -f 'mp4f' -d 'aac ' -b 192000 "${sourceFile}" "${targetFile}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error converting file: ${error.message}`);
    return;
  }
  
  console.log(`Successfully converted to ${targetFile}`);
  console.log('You can now use the new gunshot sound in the game.');
});
