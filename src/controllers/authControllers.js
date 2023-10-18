const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authController = {
    // REGISTER
    registerUser: async (req, res) => {
        try {
            const { username, password, fullName, age, address, gender } = req.body;

            // Check if username already exists
            const existingUser = await User.findOne({ where: { username: username } });
            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username already exists',
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);

            // Create new user
            const newUser = await User.create({
                username: username,
                password: hashed,
                fullName: fullName,
                age: age,
                address: address,
                gender: gender,
                status: 'active' // Set default status to 'active'
            });
            return res.status(200).json({
                status: 'success',
                data: newUser,
            });
        } catch (err) {
            res.status(500).json(err);
        }
    },

    // GENERATE ACCESS TOKEN
    generateAccessToken: (user) => {
        return jwt.sign({
            userId: user.userId,
            isAdmin: user.isAdmin,
            status: user.status // Include status in the token payload
        },
            process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2D" });
    },

    // GENERATE REFRESH TOKEN
    generateRefreshToken: async (user) => {
        const refreshToken = jwt.sign({
            userId: user.userId,
            isAdmin: user.isAdmin,
            status: user.status // Include status in the token payload 
        },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '30D' }
        );
        // Save the refresh token in the database
        await User.update({ refreshToken }, { where: { userId: user.userId } });
        return refreshToken;
    },

    // LOGIN
    loginUser: async (req, res) => {
        try {
            const { username } = req.body;
            // Kiểm tra xem người dùng có tồn tại hay không
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).json({ error: 'Invalid credentials' });
            }
            // Kiểm tra trạng thái tài khoản
            if (user.status !== 'active' && user.status !== 'warning') {
                return res.status(401).json({ error: 'Unable to log in' });
            }
            // So sánh mật khẩu được cung cấp với mật khẩu đã hash trong cơ sở dữ liệu
            const isPasswordValid = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // console.log('user', user);
            const accessToken = authController.generateAccessToken(user);
            const refreshToken = await authController.generateRefreshToken(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSite: 'strict',
            });
            return res.status(200).json({
                status: 'success',
                data: { accessToken },
            });
        } catch (err) {
            console.log('err', err.message);
            res.status(500).json(err);
        }
    },

    requestRefreshToken: async (req, res) => {
        // Lấy refresh token từ người dùng
        const refreshToken = req.cookies.refreshToken;
        console.log(refreshToken);
        if (!refreshToken)
            return res.status(401).json('You are not authenticated');

        try {
            const token = await User.findOne({ where: { refreshToken: refreshToken } });
            if (!token) {
                return res.status(403).json('Refresh token is not valid');
            }

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                if (err) {
                    console.error('Failed to verify refresh token:', err);
                    return res.status(500).json(err);
                }
                // Tạo access token và refresh token mới
                const newAccessToken = authController.generateAccessToken(user);
                const newRefreshToken = await authController.generateRefreshToken(user);

                // Cập nhật refresh token mới vào cơ sở dữ liệu
                await User.update(
                    { refreshToken: newRefreshToken },
                    { where: { refreshToken: refreshToken } }
                );
                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: false,
                    path: '/',
                    sameSite: 'strict',
                });

                return res.status(200).json({ accessToken: newAccessToken });
            });
        } catch (err) {
            console.error('Failed to request refresh token:', err);
            res.status(500).json(err);
        }
    },

    /* LOG OUT */
    logoutUser: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json('You are not authenticated');
            }
            // Xóa refresh token khỏi cơ sở dữ liệu
            await User.update(
                { refreshToken: null },
                { where: { refreshToken: refreshToken } }
            );
            // Xóa cookie refreshToken
            res.clearCookie('refreshToken', {
                path: '/',
            });

            return res.status(200).json({ message: 'Logout successful' });
        } catch (err) {
            console.error('Failed to logout:', err);
            res.status(500).json(err);
        }
    },
};

module.exports = authController;