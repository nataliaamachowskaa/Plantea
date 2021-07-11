const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');

const UserTypes = sequelize.define("user_types", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.TEXT,
    description: DataTypes.TEXT,
})

module.exports = sequelize.model("user_types");