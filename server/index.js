// Initiating express framework for backend service to handle routes.
const express = require('express');

const jwt = require('jsonwebtoken');

// Initialising dotenv module to manage server's configuration data, which can be found in the root directory in ".env" file
require('dotenv').config();

const app = express();

// Initialised routes
const authRoutes = require('./routes/auth');
const gardenRoutes = require('./routes/garden')

// Middlewares
const verifyToken = require('./routes/verifyToken');
app.use(express.json());
app.use('/api/user', authRoutes);
app.use('/api/garden', gardenRoutes);



// Initiating variables
const PORT = process.env.PORT;



app.get('/', (req, res) => {
    res.send('Welcome to Plantea');
})

app.get('/api/user/profile', verifyToken, (req, res) => {
    res.send(jwt.decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDMsImVtYWlsIjoibHVrYXN6LmxvcGF0YTk2QGdtYWlsLmNvbSIsInVzZXJUeXBlIjoxLCJpYXQiOjE2MjYwMTIxMzF9.EBqAfoPk4u7-s-aZXaSoPGzlCPsiqgzrRx4VxSkGh28"));
})


// Initiating mysql for handling mysql database.
const mysql = require('mysql');

// Creates connection
const db = require('./utilities/dbConnection');

// Connects to database and runs the server

db.connect((err) => {
    if(err) {
        return console.log("ERROR: " + err.sqlMessage);
    } else {
        console.log("Connected to database");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    }
})


