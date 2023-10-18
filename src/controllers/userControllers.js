const User = require('../models/User');
const bcrypt = require('bcrypt');

const userController = {
    // GET ALL USERS
    getAllUsers: async (req, res) => {
        try {
            const users = await User.findAll({
                attributes: ['userId', 'fullName', 'age', 'address', 'gender', 'status'] // Chỉ lấy các trường cần thiết
            });
            if (users.length === 0) {
                return res.status(404).json({ message: 'No users found' });
            }
            return res.status(200).json({
                status: 'success',
                data: users
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // DELETE USER
    deleteUser: async (req, res) => {
        const { userId } = req.params;
        try {
            await User.destroy({ where: { userId: userId } });

            res.status(200).json('Delete successful');
        } catch (err) {
            res.status(500).json(err);
        }
    },

    // DELETE VIOLATION USER 
    deleteViolatingUser: async (req, res) => {
        try {
            // Xóa danh sách các user có trạng thái "disabled"
            const deleteUser = await User.destroy({ where: { status: 'disabled' } });

            if (deleteUser > 0) {
                // Nếu có user bị xóa, trả về thông báo thành công với số lượng user bị xóa
                return res.status(200).json({ message: `${deleteUser} disabled users were deleted successfully` });
            } else {
                // Nếu không có user nào bị xóa, trả về thông báo tương ứng
                return res.status(404).json({ message: 'No users were found to be deleted' });
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    // UPDATE INFORMATION
    updateUser: async (req, res) => {
        const { fullName, age, address, gender } = req.body;
        const { userId } = req.user;

        try {
            const user = await User.findOne({ where: { userId: userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Kiểm tra xem người dùng có phải là chính chủ hay không
            if (user.userId !== req.user.userId) {
                return res.status(403).json({ error: 'You are not allowed to perform this action' });
            }

            // Kiểm tra từng trường thông tin và cập nhật nếu người dùng đã cung cấp giá trị
            if (fullName !== undefined) {
                user.fullName = fullName;
            }
            if (age !== undefined) {
                user.age = age;
            }
            if (address !== undefined) {
                user.address = address;
            }
            if (gender !== undefined) {
                user.gender = gender;
            }

            await user.save();

            // Giấu thông tin quan trọng khi trả về
            const { password, refreshToken, ...updatedUser } = user.toJSON();

            res.status(200).json({
                message: 'User information updated successfully',
                user: updatedUser
            });
        } catch (err) {
            res.status(500).json(err);
        }
    },

    // CHANGE PASSWORD
    changePassword: async (req, res) => {
        try {
            // Lấy userId từ thông tin người dùng đã xác thực
            const { userId } = req.user;

            // Lấy thông tin mật khẩu hiện tại và mật khẩu mới từ yêu cầu
            const { currentPassword, newPassword } = req.body;

            // Tìm người dùng trong cơ sở dữ liệu
            const user = await User.findOne({ where: { userId: userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Kiểm tra xem người dùng có phải là chính chủ hay không
            if (user.userId !== req.user.userId) {
                return res.status(403).json({ error: 'You are not allowed to perform this action' });
            }

            // Kiểm tra tính hợp lệ của mật khẩu hiện tại
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            // Mã hóa mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Cập nhật mật khẩu mới cho người dùng
            user.password = hashedPassword;
            await user.save();

            res.status(200).json({ message: 'Password has been updated successfully.' });
        } catch (err) {
            res.status(500).json(err);
        }
    },
}

module.exports = userController