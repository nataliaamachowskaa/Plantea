const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize')

const UserType = require('./UserType');

const User = sequelize.define("user",{
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.TEXT,
    email: DataTypes.TEXT,
    password: DataTypes.TEXT,
    user_type_id: {
        type: DataTypes.INTEGER,
        foreignKey: true
    }
});

User.belongsTo(UserType, {
    foreignKey: 'id'
});

module.exports = sequelize.model("user");