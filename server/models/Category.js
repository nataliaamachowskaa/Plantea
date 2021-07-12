const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');

const Category = sequelize.define("categories", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.TEXT
})

module.exports = sequelize.model("categories");