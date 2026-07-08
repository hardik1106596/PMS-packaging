const { validateEnv } = require('./config/env');
validateEnv();

const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 PMS Packaging API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Graceful shutdown — close the HTTP server and the Prisma connection pool
// cleanly so in-flight requests finish and Neon connections aren't leaked.
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('✅ Server closed. Database disconnected.');
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs for more than 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('💥 UNHANDLED REJECTION:', err);
  shutdown('unhandledRejection');
});
