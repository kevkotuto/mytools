module.exports = {
  apps: [
    {
      name: 'mytools',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/root/productions/mytools',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 30042,
      },
    },
  ],
}
