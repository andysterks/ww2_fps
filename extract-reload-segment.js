// This script extracts a segment from the M1 Garand reload WAV file
// Run with: node extract-reload-segment.js

const fs = require('fs');
const path = require('path');

// Configuration
const inputFile = path.join(__dirname, 'public', 'sounds', '460857__mpierluissi__gunmech_m1-garand-slide-pull-back_mp.wav');
const outputFile = path.join(__dirname, 'public', 'sounds', 'm1_garand_reload.wav');

// Check if input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
}

// Read the WAV file
const wavFile = fs.readFileSync(inputFile);

// WAV file structure:
// Offset  Size  Description
// 0       4     "RIFF" chunk descriptor
// 4       4     Chunk size
// 8       4     "WAVE" format
// 12      4     "fmt " sub-chunk
// 16      4     Sub-chunk size
// 20      2     Audio format (1 = PCM)
// 22      2     Number of channels
// 24      4     Sample rate
// 28      4     Byte rate
// 32      2     Block align
// 34      2     Bits per sample
// 36      4     "data" sub-chunk
// 40      4     Sub-chunk size
// 44      *     Actual sound data

// Extract header information
const numChannels = wavFile.readUInt16LE(22);
const sampleRate = wavFile.readUInt32LE(24);
const bitsPerSample = wavFile.readUInt16LE(34);
const dataOffset = 44; // Standard WAV header size

console.log(`WAV file info:
- Channels: ${numChannels}
- Sample rate: ${sampleRate} Hz
- Bits per sample: ${bitsPerSample}`);

// Calculate bytes per sample and frame
const bytesPerSample = bitsPerSample / 8;
const bytesPerFrame = bytesPerSample * numChannels;

// Define the segment to extract (in seconds)
const segmentStart = 0; // Start at 0 seconds for first reload
const segmentDuration = 1.5; // Extract 1.5 seconds

// Convert time to bytes
const startByte = dataOffset + Math.floor(segmentStart * sampleRate * bytesPerFrame);
const numBytes = Math.floor(segmentDuration * sampleRate * bytesPerFrame);

console.log(`Extracting segment:
- Start: ${segmentStart}s (byte offset: ${startByte})
- Duration: ${segmentDuration}s (${numBytes} bytes)`);

// Create a new WAV file with the extracted segment
const newWavFile = Buffer.alloc(dataOffset + numBytes);

// Copy the header
wavFile.copy(newWavFile, 0, 0, dataOffset);

// Copy the segment data
wavFile.copy(newWavFile, dataOffset, startByte, startByte + numBytes);

// Update the chunk sizes in the header
newWavFile.writeUInt32LE(dataOffset + numBytes - 8, 4); // RIFF chunk size
newWavFile.writeUInt32LE(numBytes, 40); // data chunk size

// Write the new WAV file
fs.writeFileSync(outputFile, newWavFile);

console.log(`Segment extracted and saved to: ${outputFile}`);
console.log('Now manually rename this file to m1_garand_reload.mp3 or use a converter to create an MP3 version.');
