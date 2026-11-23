// Cross-platform production launcher for hosts that do not set NODE_ENV.
process.env.NODE_ENV = 'production';
await import('tsx/esm');
await import('../server.ts');
