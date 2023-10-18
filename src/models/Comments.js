const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databases');
const User = require('./User');
const Post = require('./Post');

// Model cho bảng Comment
const Comment = sequelize.define('Comment', {
    commentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.STRING(1000),
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId'
        }
    },
    postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Post,
            key: 'postId'
        }
    },
    parentCommentId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'spam', 'disabled'),
        defaultValue: 'active'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW
    }
}, {
    tableName: 'comments', // Tên bảng trong cơ sở dữ liệu
    timestamps: true
});

// Mối quan hệ self-referencing, mỗi bình luận có thể có nhiều phản hồi (các bình luận con)

Comment.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' }); // Thiết lập mối quan hệ khóa ngoại với bảng User
Comment.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' }); // Thiết lập mối quan hệ khóa ngoại với bảng Post

Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies', onDelete: 'CASCADE' });

module.exports = Comment;
