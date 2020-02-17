const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');

/* Login route */
router.route('/')
  .get(controller.loginIndex)
  .post(controller.loginIndex);

/* Handle user request */
router.route('/request')
  .post(controller.userRequests);

/* Verify access for a user */
router.route('/verify')
  .post(controller.verifyUser);

/* Client index page */
router.route('/client')
  .post(controller.clientIndex);

/* QR Code */
router.route('/qr')
  .get(controller.qrCode);

module.exports = router;
