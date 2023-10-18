const { Op } = require('sequelize');
const slugify = require('slugify');
const { validate: uuidValidate } = require('uuid');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comments');
const { Sequelize } = require('sequelize');

const postController = {
    // Create a post
    createPost: async (req, res) => {
        try {
            // Kiểm tra trạng thái người dùng
            if (req.user.status !== 'active') {
                return res.status(403).json({
                    status: 'fail',
                    message: 'User is not allowed to create a post'
                });
            }
            const { title, content, description, tags = [], category = '', status } = req.body;
            // Lấy userId từ thông tin người dùng đã xác thực
            const { userId } = req.user;

            let slug = slugify(title, { lower: true });

            // Kiểm tra tính duy nhất của slug
            let isSlugUnique = false;
            let counter = 1;

            while (!isSlugUnique) {
                const existingPost = await Post.findOne({ where: { slug } });
                if (!existingPost) {
                    isSlugUnique = true;
                } else {
                    // Tạo slug mới nếu đã tồn tại
                    slug = `${slug}-${counter}`;
                    counter++;
                }
            }
            // Giá trị của slug không thay đổi sau vòng lặp
            const uniqueSlug = slug;

            // Tạo một bài đăng mới
            const newPost = await Post.create({
                title: title,
                content: content,
                description: description,
                userId: userId, // Liên kết bài đăng với userId của người dùng
                tags: tags,
                category: category,
                slug: uniqueSlug,
                status: status, // Thêm trường status với giá trị mặc định
                publishTime: status === 'active' ? new Date() : null // Đặt thời gian đăng công khai chỉ khi bài viết được đăng
            });
            return res.status(200).json({
                status: 'success',
                data: newPost,
            });
        } catch (error) {
            return res.status(400).json({
                status: 'fail',
                message: error.message,
            })
        }
    },

    getListPost: async (req, res) => {
        try {
            const { keyword, author, tags, category } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const offset = (page - 1) * limit;

            const whereCondition = {
                status: 'active',
            };

            if (keyword) {
                whereCondition[Op.or] = [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { content: { [Op.like]: `%${keyword}%` } },
                ];
            }

            if (author) {
                whereCondition.userId = author;
            }

            if (tags) {
                whereCondition[Op.and] = Sequelize.literal(`JSON_CONTAINS(tags, '["${tags}"]')`);
            }

            if (category) {
                whereCondition.category = { [Op.like]: `%${category}%` };
            }

            const posts = await Post.findAll({
                where: whereCondition,
                order: [['publishTime', 'DESC']],
                limit,
                offset,
            });

            const totalPosts = await Post.count({ where: whereCondition });

            const totalPages = Math.ceil(totalPosts / limit);

            return res.status(200).json({
                status: 'success',
                data: posts,
                totalPages,
                currentPage: page,
            });
        } catch (error) {
            return res.status(400).json({
                status: 'fail',
                message: error.message,
            })
        }
    },

    //  Get post details by slug
    getPostBySlug: async (req, res) => {
        try {
            const { slug } = req.params;

            const post = await Post.findOne({
                where: {
                    slug: slug,
                    status: 'active',
                },
            });

            if (!post) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }
            // Tăng giá trị viewCount lên 1 sau mỗi lần truy cập chi tiết bài đăng
            post.viewCount += 1;
            await post.save();

            return res.status(200).json({
                status: 'success',
                data: post,
            })
        } catch (error) {
            res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Deletes a post
    deletePost: async (req, res) => {
        try {
            const { postId } = req.params;
            const post = await Post.findOne({ where: { postId: postId } });

            if (!post) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }

            if (req.user.isAdmin || post.userId === req.user.userId) {
                await Post.destroy({ where: { postId: postId } });
                return res.status(200).json({
                    status: 'success',
                    message: 'Post deleted successfully'
                });
            } else {
                res.status(403).json({
                    status: 'fail',
                    message: 'You are not allowed to perform this action'
                });
            }
        } catch (error) {
            res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Updates a post
    updatePostById: async (req, res) => {
        try {
            const { postId } = req.params;
            const post = await Post.findOne({ where: { postId: postId } });

            if (!post) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }
            if (req.user.isAdmin || post.userId === req.user.userId) {
                // Lấy thông tin cập nhật từ người dùng
                const updateData = req.body;
                const allowedFields = ['title', 'content', 'description', 'tags', 'category', 'status'];

                // Duyệt qua tất cả các trường thông tin và kiểm tra nếu tồn tại thì cập nhật
                Object.keys(updateData).forEach((key) => {
                    if (allowedFields.includes(key) && updateData[key]) {
                        post[key] = updateData[key];
                    } else {
                        return res.status(400).json({
                            status: 'fail',
                            message: `Invalid field: ${key}`
                        });
                    }
                });

                // Lưu bài viết đã cập nhật vào cơ sở dữ liệu
                await post.save();
                return res.status(200).json({
                    status: 'success',
                    data: post
                });
            } else {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You are not allowed to perform this action'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },
};

module.exports = postController;