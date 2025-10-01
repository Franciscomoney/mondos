module.exports = {
  apps: [{
    name: 'jose-otalora',
    script: 'npm',
    args: 'start',
    cwd: '/root/coding/claudecode/projects/jose-otalora/app',
    env: {
      NODE_ENV: 'production',
      PORT: 10001
    },
    max_memory_restart: '500M',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};