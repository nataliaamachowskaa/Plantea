const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');

const UserPlant = sequelize.define("user_plants", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: DataTypes.INTEGER,
    plant_id: DataTypes.INTEGER,
    garden_id: DataTypes.INTEGER,
    custom_name: DataTypes.TEXT
})


module.exports = sequelize.model("user_plants");