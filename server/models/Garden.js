const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize')

const User = require('./User');

const Garden = sequelize.define("garden",{
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.TEXT,
    user_id: {
        type: DataTypes.INTEGER,
        foreignKey: true
    }
});

Garden.belongsTo(User, {
    foreignKey: 'id',
});

module.exports = sequelize.model("garden");