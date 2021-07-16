const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');

const Plant = require('./Plant');

const PlantImage = sequelize.define("plant_images", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    url: DataTypes.TEXT,
    plant_id: {
        type: DataTypes.INTEGER,
        foreignKey: true
    }
})

PlantImage.belongsTo(Plant, {
    foreignKey: 'id'
})

module.exports = sequelize.model("plant_images");