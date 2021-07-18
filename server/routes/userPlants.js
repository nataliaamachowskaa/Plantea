const {Sequelize, Model, DataTypes, Op} = require('sequelize');
const express = require('express');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY;
const router = express.Router();
const db = require('../utilities/dbConnection');

const User = require('../models/User');
const Plant = require('../models/Plant');
const Garden = require('../models/Garden');
const UserPlant = require('../models/UserPlants');

const validate = [
    check("name").isLength({min: 1, max: 100}).withMessage("Name must be between 1 and 100 length"),
    check("plantId").isNumeric().withMessage("plantId has to be numeric and reffer to existing plant's id"),
    check("gardenId").isNumeric().withMessage("gardenId has to be numeric and reffer to existing garden's id")
]

router.post('/create', verifyToken, validate, async(req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const token = req.header('auth-token');
    const user = jwt.decode(token);

    const userPlant = UserPlant.build({
        user_id: user.id,
        plant_id: req.body.plantId,
        garden_id: req.body.gardenId,
        custom_name: req.body.name
    })

    const plantCheck = await UserPlant.findOne({where: {custom_name: req.body.name, garden_id: req.body.gardenId}})

    if(plantCheck) return res.status(400).send({success: false, message: "Plant with that name already exists in your garden"})

    try{
        const result = await userPlant.save();
        res.status(200).send({success: true, data: {
            id: result.id,
            name: result.custom_name,
            user,
            plant: await Plant.findOne({where: {id: result.plant_id}}),
            garden: await Garden.findOne({where: {id: result.garden_id}})
        }})
    }catch(error){
        res.status(400).send({success: false, message: "Error while adding plant to the garden", error})
    }
})

router.delete('/remove/:id', verifyToken, async (req, res) => {
    
    const id = req.params.id

    const plant = await UserPlant.findOne({where: {id}});

    if(plant){
        try{
            plant.destroy();
            res.status(200).send({success: true, message: "Plant has been successfully removed", data: plant})
        }catch(error){
            res.status(400).send({success: false, message: "Error while removing plant", error})
        }
    }else{
        res.status(404).send({success: false, message: `Plant with id: ${id} not found`})
    }
})

module.exports = router;