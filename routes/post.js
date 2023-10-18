const express = require('express');
const router = express.Router();
const checkLogin = require('../src/middlewares/middleware');
const postController = require('../src/controllers/postControllers');

/* Create a post */
router.post('/', checkLogin.verifyToken, postController.createPost);

/* Get list of posts */
router.get('/', postController.getListPost);

/* Get post details by identifier */
router.get('/:slug', postController.getPostBySlug);

/* Delete post */
router.delete('/:postId', checkLogin.verifyToken, postController.deletePost);

/* Updates a post */
router.patch('/:postId', checkLogin.verifyToken, postController.updatePostById);

module.exports = router;
