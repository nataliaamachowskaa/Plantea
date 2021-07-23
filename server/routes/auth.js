const {Sequelize, Model, DataTypes} = require('sequelize');
const express = require('express');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');
const nodemailer = require("nodemailer");
const transporter = require('../utilities/transporter');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY
const router = express.Router();

const UserType = require('../models/UserType');
const User = require('../models/User');
const { route } = require('./garden');

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

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

validateEmail = [
    check('email').isEmail().withMessage("Please provide a valid email")
]

validateCode = [
    check('code').isLength({min: 6, max: 6}).withMessage("Provide correct 6-digit code"),
    check('email').isEmail().withMessage("Provide valid email address")
]

validatePassword = [
    check('password').isStrongPassword().withMessage("Your password should be at least 8 characters length and contains 1 Upper Case letter, one number and one special sign"),
    check('confirmPassword').isStrongPassword().withMessage("Your password should be at least 8 characters length and contains 1 Upper Case letter, one number and one special sign"),
    check('email').isEmail().withMessage("Provide valid email address")
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
    const date = new Date();
    const expDate = new Date().addDays(7);
    

    const user = User.build({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
        user_type_id: 2,
        register_date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        expire_date: `${expDate.getFullYear()}-${expDate.getMonth() + 1}-${expDate.getDate()}`,
        is_blocked: 0
    }) 
    try{
        const result = await user.save();
        
        const options = {
            from: process.env.EMAIL_USER,
            to: result.email,
            subject: "Welcome to Plantae!",
            text: "Welcome to Plantae! Enjoy your plants :)"
        };
        transporter.sendMail(options, (err, info) => {
            if(err){
                console.log(`Sending email error: ${err}`);
                return;
            }
            console.log(`Sent: ${info.response}`)
        })

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
    const token = jwt.sign({id: user.id, email: user.email, userType: user.user_type_id, registerDate: user.register_date, expireDate: user.expire_date, isBlocked: user.is_blocked}, secretKey)

    // If logged successfully
    res.header('auth-token', token).send({success: true, message: 'Logged in successfully', data: {token}});

})

router.post('/sendcode', validateEmail, async (req, res) => {
    
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const email = req.body.email;
    
    const code = Math.floor(Math.random() * (999999 - 100000)) + 100000;

    const options = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset your password in Plantae",
        text: `Hello,\n\n We noticed that someone wants to restart your password and we really hope it's you. Copy the code below and paste it into the correct field in Plantae App!\n\nCODE: ${code}\n\nBest regards\n Plantae Support Team.`
    }

    const user = await User.findOne({where: {email}});

    if(user){
        try{
            user.update({
                reset_code: code
            })


            transporter.sendMail(options, (err, info) => {
                if(err){
                    return res.status(400).send({success: false, message: `Failed to send email with generated code`, err})
                }
    
                return res.status(200).send({success: true, message: `Sent: ${info.response}`, to: user.email});
            })
    
        }catch(error){
            return res.status(400).send({success: false, error});
        }
    }else{
        return res.status(404).send({success: false, message: `User with email: ${email} not found!`})
    }

})

router.post('/entercode', validateCode, async (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const code = req.body.code;
    const email = req.body.email;

    const user = await User.findOne({where: {email}});

    if(user){

        if(code === user.reset_code){
            try{
                await user.update({reset_code: "ACTIVE"})
                return res.status(200).send({success: true, message:"The code is correct"});
            }catch(error){
                return res.status(400).send({succes: false, message:"Error occured while updating user's reset code", error})
            }
            
        }else{
            return res.status(400).send({success: false, message: "Wrong code"})
        }
    }else{
        return res.status(404).send({success: false, message: `No user with email: ${email} found!`})
    }
})

router.post('/resetpass', validatePassword, async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array() });
    }

    const email = req.body.email;
    const pass = req.body.password;
    const checkPass = req.body.confirmPassword;

    const user = await User.findOne({where: {email, reset_code: "ACTIVE"}});

    if(user){

        if(pass != checkPass){
            return res.status(400).send({success: false, message: `Passwords are different!`})
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(pass, salt);

        try{
            await user.update({password: hashPassword, reset_code: null});
            return res.status(200).send({success: true, message: `Password has been changed`})
        }catch(error){
            return res.status(400).send({success: false, message: `Error has been occured while trying to update the password`, error})
        }

    }else{
        return res.status(404).send({success: false, message: `User with provided email: ${email} not found or it haven't requested for resetting the password`})
    }
})

module.exports = router;