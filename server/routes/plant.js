const {Sequelize, Model, DataTypes, Op} = require('sequelize');
const express = require('express');
const {check, validationResult, body} = require('express-validator');
const bcrypt = require('bcryptjs');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');
require('dotenv').config();
const plantImgPath = `${appDir}\\src\\plantImg`;
const fs = require('fs');
const {promisify} = require('util');

const deleteAsync = promisify(fs.unlink);

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, plantImgPath)
    },
    filename: function(req, file, cb){
        let ext = "";
        switch(file.mimetype){
            case "image/jpeg":
                ext = 'jpg';
                break;
            case "image/png":
                ext = 'png';
                break;
            case "image/bmp":
                ext = 'bmp';
                break;
        }
        cb(null, `${file.fieldname}-${Date.now()}.${ext}`)
    },
});


const upload = multer({storage}).array('pictures', 5)

const undoUpload = async (files) => {
    for(let i = 0; i < files.length; i++){
        await deleteAsync(`${plantImgPath}\\${files[i].filename}`)
    }
}
const deleteImages = (images) => {
    for(let i = 0; i < images.length; i++){
        console.log(images[i].dataValues.url)
        deleteAsync(images[i].dataValues.url).then(console.log("Deleted successfully")).catch(errors => console.log({message: `file with url: ${images[i].dataValues.url} does not exist`, errors}))
    }
}


const secretKey = process.env.JWT_SECRET_KEY;
const router = express.Router();
const db = require('../utilities/dbConnection');

const Plant = require('../models/Plant');
const PlantImage = require('../models/PlantImage')

const validate = [
    check("name").isLength({min: 1, max: 100}).withMessage("The name is empty or too long. Maximum length of name is 100"),
    check("latinName").isLength({max: 100}).withMessage("The latin name is too long. Maximum length of latin name is 100"),
    check("description").isLength({max: 255}).withMessage("The description is too long. Maximum length of description is 255"),
    check("requirements").isLength({max: 255}).withMessage("The requirements is too long. Maximum length of requirements is 255"),
    check("animalSafetyProfile").isLength({max: 255}).withMessage("The animal safety profile is too long. Maximum length of animal safety profile is 255"),
    check("care").isLength({max: 255}).withMessage("The care is too long. Maximum length of care name is 255"),
    check("watering").isLength({max: 255}).withMessage("The watering is too long. Maximum length of watering is 255"),
    check("placement").isLength({max: 255}).withMessage("The placement is too long. Maximum length of placement is 255"),
    check("categoryId").isNumeric().withMessage("Plant has to have valid category! For devs: This value should be numeric and it has to be the actual category id")
]

const checkValidation = (fields) => {
    let errors = []
    if(fields.name.length < 1 || fields.name > 100) errors.push({msg: "The name is empty or too long. Maximum length of name is 100", param: "name", location: "body"});
    if(fields.latinName.length < 1 || fields.latinName.length > 100) errors.push({msg: "The latin name is empty or too long. Maximum length of name is 100", param: "latinName", location: "body"});
    if(fields.description.length > 1500) errors.push({msg: "The description is too long. Maximum length of name is 1000", param: "description", location: "body"});
    if(fields.requirements.length > 1500) errors.push({msg: "The requirements is too long. Maximum length of name is 1500", param: "requirements", location: "body"});
    if(fields.animalSafetyProfile.length > 1500) errors.push({msg: "The animal safety profile is too long. Maximum length of name is 1500", param: "animalSafetyProfile", location: "body"});
    if(fields.care.length > 1500) errors.push({msg: "The care is too long. Maximum length of name is 1500", param: "care", location: "body"});
    if(fields.watering.length > 1500) errors.push({msg: "The watering is too long. Maximum length of name is 1500", param: "watering", location: "body"});
    if(fields.placement.length > 1500) errors.push({msg: "The placement is too long. Maximum length of name is 1500", param: "placement", location: "body"});
    if(isNaN(fields.categoryId) || fields.categoryId === undefined || fields.categoryId == null || fields.categoryId.length <= 0) errors.push({msg: "Plant has to have valid category! For devs: This value should be numeric and it has to be the actual category id", param: "categoryId", location: "body"});

    return errors;
}

// FOR ADMINS ONLY

router.post('/create', verifyToken, validate, async (req, res) => {

    upload(req, res, async (error) => {
        if(error instanceof multer.MulterError) {
            res.status(400).send({success: false, message: "An MULTER error occured while uploading images!", error})
        } else if(error) {
            res.status(400).send({success: false, message: "An uknown error occured wile uploading images", error})
        }

        if(checkValidation(req.body).length > 0){
            await undoUpload(req.files);
            return res.status(422).send(checkValidation(req.body))
        };

        const token = req.header('auth-token');
        const user = jwt.decode(token);

        //If user is admin
        if(user.userType === 1)
        {
            // Check if the name or latin name already exists in database
            const plantCheck = await Plant.findOne({
                where: {
                    [Op.or]: [
                        {name: req.body.name},
                        {latin_name: req.body.latinName}
                    ]
                }});
            
            //if exists return error
            if(plantCheck){ 
                await undoUpload(req.files);
                return res.status(400).send({success: false, message: "Plant with provided name or latin name already exists. Please provide different name"});
            }

            const plant = await Plant.build({
                name: req.body.name,
                latin_name: req.body.latinName,
                description: req.body.description,
                requirements: req.body.requirements,
                animal_safety_profile: req.body.animalSafetyProfile,
                care: req.body.care,
                watering: req.body.watering,
                placement: req.body.placement,
                category_id: req.body.categoryId,
            })


            try{
                await plant.save();

                // If there are images upload them and assing url to the object
                if(req.files.length > 0){
                        // Check if plant objects exists to assign image to it
                        if(plant){
                            for(let i = 0; i < req.files.length; i++){
                                const plantImage = PlantImage.build({
                                    url: `${plantImgPath}\\${req.files[i].filename}`,
                                    plant_id: plant.id
                                })
            
                                try{
                                    const result = await plantImage.save();
                                    console.log("Creating plant image is a success!")
                                }catch(error){
                                    await undoUpload(req.files);
                                    res.send({
                                        success: false,
                                        message: error,
                                        imgIndex: i
                                    });
                                    console.log("ERROR: " + error)
                                }
                            }
                        } else{
                            await undoUpload(req.files);
                            res.status(400).send({success: false, message: "There is no plant for images"})
                        }
                    
                } else{
                    // If user doesn't upload any image - assign default one
                    const plantImage = PlantImage.build({
                        url: `${plantImgPath}\\noimg.jpg`,
                        plant_id: plant.id
                    })

                    try{
                        const result = await plantImage.save();
                        console.log("Creating plant image is a success!")
                    }catch(error){
                        await undoUpload(req.files);
                        res.send({
                            success: false,
                            message: error,
                            imgIndex: "noimg"
                        });
                        console.log("ERROR: " + error)
                    }
                }
                
            }
            catch(error){
                await undoUpload(req.files);
                res.send({success: false, message: error})
            }
            
            res.send({success: true, data: plant});

        } else{
            await undoUpload(req.files);
            res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
        }
    })
})

router.put('/edit/:id', verifyToken, async (req, res) => {


    upload(req, res, async(error) => {
        if(error instanceof multer.MulterError) {
            res.status(400).send({success: false, message: "An MULTER error occured while uploading images!", error})
        } else if(error) {
            res.status(400).send({success: false, message: "An uknown error occured wile uploading images", error})
        }
        if(checkValidation(req.body).length > 0){
            await undoUpload(req.files);
            return res.status(422).send(checkValidation(req.body))
        };

        const token = req.header('auth-token');
        const user = jwt.decode(token);
        const id = req.params.id;

        if(user.userType === 1){

            const plant = await Plant.findOne({where: {id}})

            if(plant){
                const plantImgs = await PlantImage.findAll({where: {
                    plant_id: id
                }})
                const imgsBefore = plantImgs;
                
                if(plantImgs){
                    deleteImages(plantImgs);
                    await PlantImage.destroy({where: {plant_id: id}})

                    if(req.files.length > 0){
                        for(let i = 0; i < req.files.length; i++){
                            const plantImage = PlantImage.build({
                                url: `${plantImgPath}\\${req.files[i].filename}`,
                                plant_id: plant.id
                            })

                            try{
                                const result = await plantImage.save();
                                console.log("Creating plant image is a success!")
                            }catch(error){
                                await undoUpload(req.files);
                                res.send({
                                    success: false,
                                    message: error,
                                    imgIndex: i
                                });
                                console.log("ERROR: " + error)
                            }
                        }
                    }

                }

                const plantImages = await PlantImage.findAll({where:{plant_id: id}})

                const plantBefore = {
                    id: plant.id,
                    name: plant.name,
                    latinName: plant.latin_name,
                    description: plant.description,
                    requirements: plant.requirements,
                    animalSafetyProfile: plant.animal_safety_profile,
                    care: plant.care,
                    watering: plant.watering,
                    placement: plant.placement,
                    categoryId: plant.category_id,
                }
                if(plantImages){
                    await plant.update({
                        name: req.body.name,
                        latin_name: req.body.latinName,
                        description: req.body.description,
                        requirements: req.body.requirements,
                        animal_safety_profile: req.body.animalSafetyProfile,
                        care: req.body.care,
                        watering: req.body.watering,
                        placement: req.body.placement,
                        category_id: req.body.categoryId,
                    });
                    res.status(200).send({success: true, data: plant, dataBefore: plantBefore, imgs: plantImages, imgsBefore})
                }else{
                    res.send("No plant images");
                }
                
                
            }else{
                await undoUpload(req.files);
                res.status(404).send({success: false, message: `Plant with id: ${id} not found`})
            }

        } else{
            await undoUpload(req.files);
            res.status(403).send({success: false, message: "Access denied - You don't have permission to do that"})
        }
    })
})

module.exports = router