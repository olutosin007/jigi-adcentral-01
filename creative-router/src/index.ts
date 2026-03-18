import fastify from 'fastify';
import { registerRoutes } from './routes.js';

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = fastify({
    logger: true,
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  registerRoutes(app);

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`creative-router listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();

