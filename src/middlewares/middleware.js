const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comments');

const checkLogin = {
    // verifyToken
    verifyToken: (req, res, next) => {
        try {
            // console.log('headers', req.headers);
            const token = req.headers?.authorization.split(' ')[1];
            // console.log('token', token);
            if (!req.headers.authorization) {
                return res.status(401).json({
                    error: 'You must be logged in'
                });
            }
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = decodedToken
            next();
        } catch {
            res.status(401).json({
                error: 'Invalid request!'
            });
        }
    },

    // verifyUserAuth
    verifyUserAuth: async (req, res, next) => {
        try {
            const { userId } = req.params;

            // Kiểm tra xem người dùng có tồn tại không
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (req.user.userId === userId || req.user.isAdmin) {
                return next();
            } else {
                return res.status(403).json('You are not allowed to perform this action');
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // verifyAdminAuth
    verifyAdminAuth: async (req, res, next) => {
        try {
            // Kiểm tra quyền truy cập của người dùng
            if (!req.user.isAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }
            next();
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },
};

module.exports = checkLogin;