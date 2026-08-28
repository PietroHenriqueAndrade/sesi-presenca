const axios = require('axios');
const prisma = require('../../database/client');
const { getPythonBaseUrl } = require('../../config/serviceUrls');

class HealthController {
  liveness(req, res) {
    return res.status(200).json({
      status: 'success',
      data: { service: 'attendance-api', state: 'up', timestamp: new Date().toISOString() },
    });
  }

  async readiness(req, res) {
    const checks = { database: false, python: false };
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (_) {}

    try {
      const base = getPythonBaseUrl();
      const response = await axios.get(`${base}/health`, { timeout: 3000 });
      checks.python = response.status >= 200 && response.status < 300;
    } catch (_) {}

    const ready = checks.database && checks.python;
    return res.status(ready ? 200 : 503).json({
      status: ready ? 'success' : 'fail',
      data: { service: 'attendance-api', state: ready ? 'ready' : 'degraded', checks },
    });
  }
}

module.exports = new HealthController();
