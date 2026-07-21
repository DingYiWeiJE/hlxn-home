module.exports = {
  apps: [
    {
      name: "hanly-web",
      cwd: "/var/www/hanly/current",
      script: "server.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      error_file: "/var/www/hanly/shared/logs/hanly-web-error.log",
      out_file: "/var/www/hanly/shared/logs/hanly-web-out.log",
      merge_logs: true,
      max_memory_restart: "512M",
    },
  ],
};
