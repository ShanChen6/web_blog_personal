const express = require('express');
const commentController = require('../src/controllers/commentControllers');
const checkLogin = require('../src/middlewares/middleware');
const router = express.Router();

/* Thêm một bình luận */
router.post('/', checkLogin.verifyToken, commentController.createComment);

/* Lấy danh sách comment của bài viết */
router.get('/:postId', checkLogin.verifyToken, commentController.getCommentsByPostId);

/* Lấy danh sách replies của comment */
router.get('/reply/:commentId', checkLogin.verifyToken, commentController.getRepliesByCommentId);

/* Xóa comment theo commentId */
router.delete('/:commentId/', checkLogin.verifyToken, commentController.deleteCommentByCommentId);

/* Đánh dấu 1 bình luận là spam */
router.post('/spam/:commentId', checkLogin.verifyToken, commentController.markCommentAsSpam);

module.exports = router;
