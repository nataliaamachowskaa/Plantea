const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');

const Category = require('./Category');

const Plant = sequelize.define("plants", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.TEXT,
    latin_name: DataTypes.TEXT,
    description: DataTypes.TEXT,
    requirements: DataTypes.TEXT,
    animal_safety_profile: DataTypes.TEXT,
    care: DataTypes.TEXT,
    watering: DataTypes.TEXT,
    placement: DataTypes.TEXT,
    category_id: {
        type: DataTypes.INTEGER,
    }
})


module.exports = sequelize.model("plants");