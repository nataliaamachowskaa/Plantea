const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');

const Favorite = sequelize.define("favorites", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    plant_id: {
        type: DataTypes.INTEGER,
    },
    user_id: {
        type: DataTypes.INTEGER,
    }
})


module.exports = sequelize.model("favorites");