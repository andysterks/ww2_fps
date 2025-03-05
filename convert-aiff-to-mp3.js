// Script to convert the AIFF file to MP3 and replace the current gunshot sound
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const sourceFile = path.join(__dirname, 'public', 'sounds', '386842__nioczkus__m1-garand-rifle.aiff');
const tempWavFile = path.join(__dirname, 'public', 'sounds', 'temp_gunshot.wav');
const targetFile = path.join(__dirname, 'public', 'sounds', 'm1_garand_shot.mp3');
const backupFile = path.join(__dirname, 'public', 'sounds', 'm1_garand_shot.mp3.bak');

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file not found: ${sourceFile}`);
  process.exit(1);
}

// Create backup of existing MP3 file
if (fs.existsSync(targetFile)) {
  console.log(`Creating backup of existing gunshot sound: ${backupFile}`);
  fs.copyFileSync(targetFile, backupFile);
}

// Check if ffmpeg is available
exec('which ffmpeg', (error, stdout, stderr) => {
  if (error) {
    console.log('FFmpeg not found. Using alternative method...');
    convertUsingAfconvert();
  } else {
    console.log('FFmpeg found. Converting using FFmpeg...');
    convertUsingFfmpeg();
  }
});

// Convert using ffmpeg if available
function convertUsingFfmpeg() {
  console.log(`Converting ${sourceFile} to ${targetFile} using FFmpeg...`);
  
  const command = `ffmpeg -i "${sourceFile}" -vn -ar 44100 -ac 2 -b:a 192k "${targetFile}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error converting file: ${error.message}`);
      console.log('Trying alternative method...');
      convertUsingAfconvert();
      return;
    }
    
    console.log(`Successfully converted to ${targetFile}`);
    console.log('You can now use the new gunshot sound in the game.');
  });
}

// Convert using afconvert (macOS built-in tool)
function convertUsingAfconvert() {
  console.log(`Converting ${sourceFile} to ${targetFile} using afconvert...`);
  
  // First convert to WAV as an intermediate step
  const wavCommand = `afconvert -f WAVE -d LEI16@44100 "${sourceFile}" "${tempWavFile}"`;
  
  exec(wavCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error converting to WAV: ${error.message}`);
      console.log('Please use the web-based converter in convert-aiff-to-mp3.html instead.');
      return;
    }
    
    console.log(`Successfully converted to WAV: ${tempWavFile}`);
    
    // Then convert WAV to MP3
    const mp3Command = `afconvert -f mp4f -d aac -b 192000 "${tempWavFile}" "${targetFile}"`;
    
    exec(mp3Command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting to MP3: ${error.message}`);
        console.log('Please use the web-based converter in convert-aiff-to-mp3.html instead.');
        return;
      }
      
      console.log(`Successfully converted to MP3: ${targetFile}`);
      
      // Clean up temporary WAV file
      fs.unlinkSync(tempWavFile);
      
      console.log('You can now use the new gunshot sound in the game.');
      console.log('If you want to revert to the original sound, rename the .bak file.');
    });
  });
}
