import { spawn } from 'node:child_process';

const server = spawn('node', ['--watch', 'server.js'], {
  stdio: 'inherit',
  env: process.env,
});

const waitForReady = async (url, retries = 40) => {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (error) {
      // ignore until ready
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
};

const startNext = async () => {
  const ok = await waitForReady('http://localhost:8000/ready');
  if (!ok) {
    console.error('Server did not become ready in time.');
    process.exitCode = 1;
    server.kill('SIGTERM');
    return;
  }

  console.log(
    JSON.stringify({
      level: 'info',
      message: 'backend_ready',
      url: 'http://localhost:8000',
    })
  );

  const next = spawn('npm', ['run', 'dev:web'], {
    stdio: 'inherit',
    env: process.env,
  });

const shutdown = () => {
  next.kill('SIGTERM');
  server.kill('SIGTERM');
};

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startNext();
