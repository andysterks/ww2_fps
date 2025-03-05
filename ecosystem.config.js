module.exports = {
  apps: [{
    name: 'ww2-fps-game',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'ww2-fps-server',
    script: 'websocket-server.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    exp_backoff_restart_delay: 100,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production'
    }
  }]
}; 