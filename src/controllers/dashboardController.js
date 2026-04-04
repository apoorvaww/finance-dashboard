const dashboardService = require('../services/dashboardService');

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getCategoryTotals = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryTotals(req.user, req.query.type);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;
    const data   = await dashboardService.getMonthlyTrends(req.user, months);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getWeeklyTrends = async (req, res, next) => {
  try {
    const weeks = parseInt(req.query.weeks, 10) || 8;
    const data  = await dashboardService.getWeeklyTrends(req.user, weeks);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const data  = await dashboardService.getRecentActivity(req.user, limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getTopCategories = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const data  = await dashboardService.getTopCategories(req.user, limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getTopCategories,
};
