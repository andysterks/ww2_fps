#!/bin/bash

# This script extracts a portion of the M1 Garand reload WAV file and converts it to MP3
# It requires ffmpeg to be installed

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it first."
    echo "You can install it with: brew install ffmpeg"
    exit 1
fi

# Define file paths
INPUT_FILE="./public/sounds/460857__mpierluissi__gunmech_m1-garand-slide-pull-back_mp.wav"
OUTPUT_FILE="./public/sounds/m1_garand_reload.mp3"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Ask which segment to extract
echo "Which segment of the reload sound do you want to extract?"
echo "1) First reload (0-1.5 seconds)"
echo "2) Second reload (2-3.5 seconds)"
echo "3) Third reload (4-5.5 seconds)"
read -p "Enter your choice (1-3): " choice

# Set start and end times based on choice
case $choice in
    1)
        START_TIME="0"
        DURATION="1.5"
        ;;
    2)
        START_TIME="2"
        DURATION="1.5"
        ;;
    3)
        START_TIME="4"
        DURATION="1.5"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Extract the segment and convert to MP3
echo "Extracting segment from $START_TIME seconds for $DURATION seconds..."
ffmpeg -i "$INPUT_FILE" -ss "$START_TIME" -t "$DURATION" -q:a 0 "$OUTPUT_FILE"

# Check if conversion was successful
if [ $? -eq 0 ]; then
    echo "Success! The reload sound has been extracted and saved to: $OUTPUT_FILE"
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo "Error: Failed to extract and convert the audio segment."
    exit 1
fi

echo "Done!"
