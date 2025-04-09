const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// Verify that controller functions are defined
const controllerFunctions = {
  getDashboardData: dashboardController.getDashboardData,
  findClientByIdNumber: dashboardController.findClientByIdNumber,
  exportDashboardReport: dashboardController.exportDashboardReport
};

// Get dashboard data
router.get('/', authenticate, controllerFunctions.getDashboardData);

// Find client by ID number
router.get('/client/:idNumber', authenticate, controllerFunctions.findClientByIdNumber);

// Export dashboard data as Excel report
router.get('/export', authenticate, controllerFunctions.exportDashboardReport);

module.exports = router;