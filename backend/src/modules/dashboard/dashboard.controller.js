const dashboardService = require('./dashboard.service');

class DashboardController {
  async resumo(req, res, next) {
    try {
      const data = await dashboardService.resumo();
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new DashboardController();
