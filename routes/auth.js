const express = require('express');
const router = express.Router();
const authController = require('../src/controllers/authControllers');
const checkLogin = require('../src/middlewares/middleware')


/* REGISTER USER */
router.post('/register', authController.registerUser);

/* LOGIN */
router.post('/login', authController.loginUser);

/* REFRESH */
router.post('/refresh', authController.requestRefreshToken);

/* LOGOUT */
router.post('/logout', checkLogin.verifyToken, authController.logoutUser);

module.exports = router;
