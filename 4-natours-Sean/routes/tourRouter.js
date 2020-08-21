const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();
/*
router.param('id', (req, res, next, val) => {
    console.log(val); 
    next();
});
*/

// router.param('id', tourController.checkID);
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTour, tourController.getAllTour);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
    .route('/')
    .get(authController.protect, tourController.getAllTour)
    .post(authController.protect, tourController.createTour); // 按順序執行MiddleWare
router
    .route('/:id')
    .get(authController.protect, tourController.getTour)
    .patch(authController.protect, tourController.patchTour)
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'guide-leader'),
        tourController.deleteTour
    );

module.exports = router;
