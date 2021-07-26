const {Sequelize, Model, DataTypes} = require('sequelize');
const express = require('express');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY
const router = express.Router();
const db = require('../utilities/dbConnection')
const checkDateIfExpired = require('../utilities/checkIfExpired');

const Plan = require('../models/Plan');
const UserPlant = require('../models/UserPlants');
const Plant = require('../models/Plant');
const Category = require('../models/Category');
const PlantImage = require('../models/PlantImage');
const Garden = require('../models/Garden');

router.post('/create/:id', verifyToken, async (req, res) => {

    const token = req.header('auth-token')
    const user = jwt.decode(token);
    const userPlantId = req.params.id;
    console.log(user);

    if(checkDateIfExpired(user.expireDate)) return res.status(400).send({success: false, message: "Your account is expired. Buy subscription to continue"});

    const plan = Plan.build({
        user_plant_id: userPlantId,
        action: req.body.action || "WATERING",
        date: req.body.date,
        user_id: user.id
    });

    const userPlant = await UserPlant.findOne({where: {id: userPlantId}});
    const plant = await Plant.findOne({where:{id: userPlant.plant_id}});
    const plantImages = await PlantImage.findAll({where: {plant_id: plant.id}});
    const category = await Category.findOne({where: {id: plant.category_id}});
    const garden = await Garden.findOne({where:{id: userPlant.garden_id}});

    let data = {
        userPlant: {
            name: userPlant.custom_name,
            user,
            plant: {
                id: plant.id,
                name: plant.name,
                latinName: plant.latin_name,
                description: plant.description,
                requirements: plant.requirements,
                animalSafetyProfile: plant.animal_safety_profile,
                care: plant.care,
                watering: plant.watering,
                placement: plant.placement,
                category,
                plantImages
            },
            garden
        }
    }

    try{
        const result = await plan.save();
        return res.status(200).send({success: true, message: `Plan has been added successfully`, plan: {
            id: result.id, action: result.action, date: result.date, data
        }})
    }catch(err){
        return res.status(400).send({success: false, message:"Error has been occured", err})
    }
})

router.get('/show', verifyToken, async (req, res) => {

    const token = req.header('auth-token')
    const user = jwt.decode(token);

    const plans = await Plan.findAll({where: {user_id: user.id}})
    let data = [];

    if(plans){
        for(let i = 0; i < plans.length; i++){
            userPlant = await UserPlant.findOne({where: {id: plans[i].user_plant_id}})
            
            data.push({
                id: plans[i].id,
                userPlant: await UserPlant.findOne({where: {id: plans[i].user_plant_id}}),
                garden: await Garden.findOne({where:{id: userPlant.garden_id}})
            })
        }
        
        return res.status(200).send({success: true, data})
    }else{
        return res.status(404).send({success: false, message:` No data found`})
    }
})

module.exports = router