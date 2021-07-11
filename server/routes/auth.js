const {Sequelize, Model, DataTypes} = require('sequelize');
const express = require('express');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY
const router = express.Router();

const UserType = require('../models/UserType');
const User = require('../models/User')

// VALIDATION SECTION

validateRegister = [
    check('name').isLength({min: 2, max: 100}).withMessage("The name lenght is out of settled scope"),
    check('email').isEmail().withMessage("Please provide a valid email"),
    check('password').isStrongPassword().withMessage("Your password should be at least 8 characters length and contains 1 Upper Case letter, one number and one special sign"),
]

validateLogin = [
    check('email').isEmail().withMessage("Please provide a valid email"),
    check('password').isStrongPassword().withMessage("Your password should be at least 8 characters length and contains 1 Upper Case letter, one number and one special sign"),
]

// ADDS NEW USER TYPE TO DATABASE
router.post('/usertype', verifyToken, async (req, res) => {

    const token = req.header('auth-token');
    const user = jwt.decode(token);

    // If user is admin, he can add new record
    if(user.userType === 1) {
        const userType = UserType.build({
            name: req.body.name,
            description: req.body.description
        })
    
        try{
            const result = await userType.save()
            res.send({
                success: true,
                data: result
            })
        } catch(error){
            res.send({
                success: false,
                message: error
            });
            console.log("ERROR:" + error);
        }
    } else (
        res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
    )

    
    
})

// ADDS NEW USER TO DATABASE
router.post('/register', validateRegister, async (req, res) => {

    // Register user validation

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    // Checking if email already exists in database
    const userExist = await User.findOne({where: {email: req.body.email}});
    if(userExist) return res.status(400).send({success: false, user: userExist.email, request: req.body.email, message: 'Provided Email address is alerady in use'});

    //Checking if passwords are the same

    if(req.body.passwordConfirm){
        if(req.body.password != req.body.passwordConfirm)
        return res.status(400).send({success: false, message: "Passwords have different values"})
    }

    // Hashing user's password

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(req.body.password, salt)

    const user = User.build({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
        user_type_id: 2
    }) 

    try{
        
        const result = await user.save();
        res.status(200).send({success: true, data: {id: result.id, name: result.name, email: result.email, userTypeId: result.user_type_id}});
    } catch(error) {
        console.log(error)
        res.status(400).send({success: false, message: error});
    }
});

// LOG IN TO THE SYSTEM
router.post('/login', validateLogin, async (req, res) => {
    
    // Login user validation
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }
    
    // checks if email exists
    const user = await User.findOne({where: {email: req.body.email}});
    if (!user) return res.status(404).send({success: false, message: "There is no user with provided email address"})

    //checks if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if(!validPassword) return res.status(404).send({success: false, message: 'Invalid email or password'});

    // Creates and assign a token
    const token = jwt.sign({id: user.id, email: user.email, userType: user.user_type_id}, secretKey)

    // If logged successfully
    res.header('auth-token', token).send({success: true, message: 'Logged in successfully', data: {token}});

})

module.exports = router;