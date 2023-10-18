const { DataTypes } = require('sequelize');
const sequelize = require('../../config/databases');
const User = require('./User'); // Import model User

const Post = sequelize.define('Post', {
    postId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'userId'
        }
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('draft', 'active', 'warning', 'locked', 'disabled'),
        defaultValue: 'draft'
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    publishTime: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'posts', // Tên bảng trong cơ sở dữ liệu
    timestamps: true
});

Post.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' }); // Thiết lập mối quan hệ khóa ngoại

module.exports = Post;
