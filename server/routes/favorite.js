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

const Favorite = require('../models/Favorite');
const User = require('../models/User');
const Plant = require('../models/Plant');

router.post('/add/:id', verifyToken, async(req, res) => {

    const token = req.header('auth-token');
    const user = jwt.decode(token);
    const id = req.params.id;

    const favoriteCheck = await Favorite.findOne({where: {plant_id: id}})

    if(favoriteCheck) return res.status(400).send({succss: false, message: "That plant is already in your favorites!"})

    const favorite = Favorite.build({
        plant_id: id,
        user_id: user.id
    })

    try{
        const result = await favorite.save();
        const plant = await Plant.findOne({where: {id}})
        res.status(200).send({success: true, data: {id: result.id, user, plant}});
    } catch(error){
        res.status(400).send({success: false, message: "Error while adding plant to favorites", error})
    }

})

router.delete('/delete/:id', verifyToken, async(req, res) => {

    const token = req.header('auth-token');
    const user = jwt.decode(token);
    const id = req.params.id;

    const favorite = await Favorite.findOne({where: {plant_id: id}})

    try{
        await favorite.destroy();
        res.status(200).send({success: true, message: "Plant has been successfully removed from favorites"});
    } catch(error){
        res.status(400).send({success: false, message: "Error while removing plant from favorites", error})
    }

})

router.get('/all', verifyToken, async (req, res) => {
    
    const token = req.header('auth-token');
    const user = jwt.decode(token);

    const result = await Favorite.findAll({where: {user_id: user.id}})

    let data = []

    for(let i = 0; i < result.length; i++){
        data.push({
            id: result[i].id,
            user,
            plant: await Plant.findOne({where: {id: result[i].plant_id}})
        })
    }


    if(result){
        res.status(200).send({
            success: true,
            data
        })
    }else{
        res.status(404).send({success: false, message: "Favorites not found"})
    }
})

module.exports = router;