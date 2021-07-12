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

const Garden = require('../models/Garden');

// VALIDATION SECTION

const validateCreate = [
    check('name').isLength({min: 1, max: 100}).withMessage("The name is empty or too long. Maximum length of name is 100")
]

router.post('/create', verifyToken, validateCreate, async (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const token = req.header('auth-token')
    const id = jwt.decode(token).id

    const gardenCheck = await Garden.findOne({where: {name: req.body.name, user_id: parseInt(id)}});
    if(gardenCheck) return res.status(400).send({success: false, message: "Garden with that name already exists. Please provide different name"})

    const garden = Garden.build({
        name: req.body.name,
        user_id: parseInt(id)
    });

    try{

        const result = await garden.save();
        res.status(200).send({succes: true, data: result})
    } catch(error){
        res.status(400).send({succes: false, message: error})
    }

})

router.put('/edit/:id', verifyToken, validateCreate, async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const token = req.header('auth-token')
    const userId = jwt.decode(token).id
    const id = req.params.id;

    const garden = await Garden.findOne({where: {id, user_id: userId}});

    const gardenPrev = garden.toJSON();

    if(garden){
        await garden.update({
            name: req.body.name
        })
        .then(res.status(200).send({success: true, message: "Updated successfully", data: garden, dataBefore: gardenPrev}))
        .catch((error) => {res.status(400).send({success: false, message: "Error while updating record", data: error})})
    } else{
        res.status(404).send({success: false, message: "Garden not found"})
    }
})

router.delete('/delete/:id', verifyToken, async (req, res) => {

    const token = req.header('auth-token')
    const userId = jwt.decode(token).id
    const id = req.params.id;

    const garden = await Garden.findOne({where: {id, user_id: userId}})

    if(garden){
        garden.destroy()
            .then(res.status(200).send({success: true, message: "Garden has been deleted successfully"}))
            .catch(error => res.status(400).send({success: false, message: "Error while deleting", data: error}));
    } else{
        res.status(404).send({success: false, message: "Garden not found"})
    }
})

router.get('/all', verifyToken, async (req, res) => {

    const token = req.header('auth-token');
    const user = jwt.decode(token);

    if(user.userType === 1)
    {
        let query = `SELECT gardens.id, gardens.name, users.id AS userId, users.name AS userName, users.email AS userEmail, user_types.id AS userTypeId, user_types.name AS userTypeName, user_types.description AS userTypeDesc FROM gardens JOIN users ON gardens.user_id=users.id JOIN user_types ON users.user_type_id=user_types.id;`;

        if(req.query.userName && req.query.name) {
            query = `SELECT gardens.id, gardens.name, users.id AS userId, users.name AS userName, users.email AS userEmail, user_types.id AS userTypeId, user_types.name AS userTypeName, user_types.description AS userTypeDesc FROM gardens JOIN users ON gardens.user_id=users.id JOIN user_types ON users.user_type_id=user_types.id WHERE gardens.name LIKE '%${req.query.name}%' AND users.name LIKE "%${req.query.userName}%"; `;
        }
        else if(req.query.name){
            query = `SELECT gardens.id, gardens.name, users.id AS userId, users.name AS userName, users.email AS userEmail, user_types.id AS userTypeId, user_types.name AS userTypeName, user_types.description AS userTypeDesc FROM gardens JOIN users ON gardens.user_id=users.id JOIN user_types ON users.user_type_id=user_types.id WHERE gardens.name LIKE "%${req.query.name}%"; `;
        }
        else if(req.query.userEmail) {
            query = `SELECT gardens.id, gardens.name, users.id AS userId, users.name AS userName, users.email AS userEmail, user_types.id AS userTypeId, user_types.name AS userTypeName, user_types.description AS userTypeDesc FROM gardens JOIN users ON gardens.user_id=users.id JOIN user_types ON users.user_type_id=user_types.id WHERE users.email LIKE "%${req.query.userEmail}%"; `;
        }
        else if(req.query.userName) {
            query = `SELECT gardens.id, gardens.name, users.id AS userId, users.name AS userName, users.email AS userEmail, user_types.id AS userTypeId, user_types.name AS userTypeName, user_types.description AS userTypeDesc FROM gardens JOIN users ON gardens.user_id=users.id JOIN user_types ON users.user_type_id=user_types.id WHERE users.name LIKE "%${req.query.userName}%"; `;
        }
        
        
        let results = [];

        const execute = db.query(query, (error, rows) => {
            if(error) return res.status(400).send({success: false, message: error})

            for(let i = 0; i < rows.length; i++){
                results.push({
                    id: rows[i].id,
                    name: rows[i].name,
                    user: {
                        userId: rows[i].userId,
                        userName: rows[i].userName,
                        userEmail: rows[i].userEmail,
                        userType: {
                            userTypeId: rows[i].userTypeId,
                            userTypeName: rows[i].userTypeName,
                            userTypeDesc: rows[i].userTypeDesc
                        }
                    }
                })
            }
            
            return res.status(200).send(results);
        });

        
    } else{
        res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
    }
})


module.exports = router;