const express = require('express');
const router = express.Router();
const userController = require('../src/controllers/userControllers')
const checkLogin = require('../src/middlewares/middleware')

/* GET ALL USER */
router.get('/', checkLogin.verifyToken, userController.getAllUsers);

/* DELETE USER VIOLATION */
router.delete('/delete', checkLogin.verifyToken, checkLogin.verifyAdminAuth, userController.deleteViolatingUser);

/* DELETE USER */
router.delete('/:userId', checkLogin.verifyToken, checkLogin.verifyUserAuth, userController.deleteUser);

/* CHANGE INFORMATION */
router.patch('/:userId', checkLogin.verifyToken, userController.updateUser)

/* CHANGE PASSWORD */
router.patch('/:userId/password', checkLogin.verifyToken, userController.changePassword)

module.exports = router;
