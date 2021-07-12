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

const Category = require('../models/Category');

const validate = [
    check('name').isLength({min: 1, max: 100}).withMessage("The name is empty or too long. Maximum length of name is 100")
];

router.post('/create', verifyToken, validate, async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const token = req.header('auth-token');
    const user = jwt.decode(token);

    if(user.userType === 1)
    {
        const categoryCheck = await Category.findOne({where: {name: req.body.name}});
        
        if(categoryCheck) return res.status(400).send({success: false, message: "Category with that name already exists. Please provide different name"});

        const category = Category.build({
            name: req.body.name
        })

        try{
            const result = await category.save();
            res.status(200).send({success: true, message: "Category created successfully", data: result})

        } catch(err){
            res.send({success: false, message: "Error while trying to create Category", data: err})
        }

    }
    else {
        res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
    }
})

router.put('/edit/:id', verifyToken, validate, async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const token = req.header('auth-token');
    const user = jwt.decode(token);
    const id = req.params.id;

    if(user.userType === 1)
    {

        const categoryCheck = await Category.findOne({where: {name: req.body.name}});
        
        if(categoryCheck) return res.status(400).send({success: false, message: "Category with that name already exists. Please provide different name"});

        const category = await Category.findOne({where: {id}})
        const categoryPrev = category.toJSON();

        if(category){
            category.update({
                name: req.body.name
            })
            .then(res.status(200).send({success: true, message: "Updated successfully", data: category, dataBefore: categoryPrev}))
            .catch((error) => {res.status(400).send({success: false, message: "Error while updating record", data: error})})
        } else{
            res.status(404).send({success: false, message: "Category not found"})
        }

    } else {
        res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
    }

})

router.delete('/delete/:id', verifyToken, async(req, res) => {

    const token = req.header('auth-token');
    const user = jwt.decode(token);
    const id = req.params.id;

    if(user.userType === 1)
    {
        
        const category = await Category.findOne({where: {id}});
        if(category){
            category.destroy().then(res.status(200).send({success: true, message: "Category has been deleted successfully"})).catch((error) => res.status(400).send({success: false, message: "Error while deleting", data: error}))
        } else{
            res.status(404).send({success: false, message: "Category not found"})
        }
    } else{
        res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
    }
})

router.get('/all', verifyToken, async (req, res) => {
    categories = await Category.findAll();
    if(req.query.name){
        categories = await Category.findAll({where: {name: {[Op.like]: `%${req.query.name}%`}}});
        console.log(categories)
    }

    if(categories)
    {
        res.status(200).send({success: true, message: `${categories.length} records found!`, data: categories})
    } else {
        res.status(404).send({success: false, message: `No records found!`, data: categories})
    }
})


module.exports = router;