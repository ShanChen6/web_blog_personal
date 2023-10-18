const Comment = require('../models/Comments');
const User = require('../models/User');
const Post = require('../models/Post');

const commentController = {
    // Add a comment
    createComment: async (req, res) => {
        try {
            // Kiểm tra trạng thái người dùng
            if (req.user.status !== 'active') {
                return res.status(403).json({
                    status: 'fail',
                    message: 'User is not allowed to create a comment'
                });
            }
            const { postId, content, parentCommentId } = req.body;
            const { userId } = req.user;

            // Kiểm tra xem bài viết có tồn tại không
            const post = await Post.findOne({ where: { postId } });
            if (!post) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }

            if (parentCommentId) {
                const parentComment = await Comment.findByPk(parentCommentId);
                if (!parentComment) {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'comment not found'
                    });
                }
            }

            // Tạo bình luận mới
            const newComment = await Comment.create({
                content: content,
                userId: userId,
                postId: postId,
                parentCommentId: parentCommentId,
            });

            return res.status(201).json({
                message: 'success',
                data: newComment,
            });
        } catch (error) {
            return res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Retrieves the list of comments for a post
    getCommentsByPostId: async (req, res) => {
        try {
            const { postId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Kiểm tra xem bài viết có tồn tại không
            const post = await Post.findByPk(postId);
            if (!post) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }

            const { rows: comments, count: totalComments } = await Comment.findAndCountAll({
                where: {
                    postId,
                    parentCommentId: null, // Chỉ lấy các comment không có phản hồi (parentCommentId là null)
                },
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset,
            });

            // Tổng số trang được tính dựa trên số lượng bình luận và số lượng bình luận trên mỗi trang
            const totalPages = Math.ceil(totalComments / limit);

            return res.status(200).json({
                status: 'success',
                data: comments,
                totalComments: totalComments,
                totalPages: totalPages,
                currentPage: page,
            });
        } catch (error) {
            return res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },
    // 
    getRepliesByCommentId: async (req, res) => {
        try {
            const { commentId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Kiểm tra xem comment có tồn tại không
            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Comment not found'
                });
            }

            const { rows: comments, count: totalComments } = await Comment.findAndCountAll({
                where: {
                    parentCommentId: commentId,
                },
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset,
            });
            // Tổng số trang được tính dựa trên số lượng bình luận và số lượng bình luận trên mỗi trang
            const totalPages = Math.ceil(totalComments / limit);

            return res.status(200).json({
                status: 'success',
                data: comments,
                totalComments: totalComments,
                totalPages: totalPages,
                currentPage: page,
            });
        } catch (error) {
            return res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },
    // deleteCommentByCommentId
    deleteCommentByCommentId: async (req, res) => {
        try {
            const { commentId } = req.params;

            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Comment not found'
                });
            }
            if (req.user.isAdmin || comment.userId === req.user.userId) {
                await Comment.destroy({ where: { commentId: commentId } });
                return res.status(200).json({
                    status: 'success',
                    message: 'comment deleted successfully'
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

    // markCommentAsSpam
    markCommentAsSpam: async (req, res) => {
        try {
            const { commentId } = req.params;

            // Kiểm tra xem bình luận có tồn tại và thuộc về bài viết nào
            const comment = await Comment.findOne({ where: { commentId: commentId } });

            if (!comment) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Comment not found'
                });
            }

            // Cập nhật trạng thái của bình luận thành spam
            comment.status = 'spam';
            await comment.save();

            return res.status(200).json({
                status: 'success',
                message: 'Comment marked as spam'
            });
        } catch (error) {
            return res.status(500).json({
                status: 'fail',
                message: error.message
            });
        }
    },
};

module.exports = commentController;
