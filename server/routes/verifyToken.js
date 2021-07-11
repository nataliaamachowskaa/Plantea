const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {

    const secretKey = process.env.JWT_SECRET_KEY;
    const token = req.header('auth-token');
    if(!token) return res.status(401).send('Access denied');

    // verify the token
    try {
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch(err) {
        res.status(400).send("Invalid token");
    }
}