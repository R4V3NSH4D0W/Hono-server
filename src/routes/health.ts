import { Hono } from 'hono';
import { dbHealthCheck } from '../services/database.js';

const health = new Hono();

health.get('/', async c => {
  try {
    const dbHealth = await dbHealthCheck();

    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        server: {
          status: 'healthy',
          memory: {
            used:
              Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
              100,
            total:
              Math.round(
                (process.memoryUsage().heapTotal / 1024 / 1024) * 100
              ) / 100,
          },
        },
      },
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    return c.json(healthStatus, statusCode);
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      503
    );
  }
});

export default health;
