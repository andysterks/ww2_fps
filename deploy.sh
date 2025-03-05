#!/bin/bash

# Stop any running processes
pm2 stop ww2-fps-game || true
pm2 stop ww2-fps-server || true

# Navigate to the project directory
cd /var/www/ww2-fps

# Pull the latest changes
git pull origin main

# Install dependencies
npm install

# Build the project
npm run build

# Start the servers using PM2
pm2 start npm --name "ww2-fps-game" -- start
pm2 start npm --name "ww2-fps-server" -- run server

# Save PM2 process list
pm2 save 