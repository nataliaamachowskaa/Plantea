const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = require('../utilities/sequalize');


const Plan = sequelize.define("plans", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_plant_id: DataTypes.INTEGER,
    action: DataTypes.TEXT,
    date: DataTypes.DATEONLY,
    user_id: DataTypes.INTEGER
})


module.exports = sequelize.model("plans");