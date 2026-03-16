const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        "secretkey",
        {
            expiresIn: "1h"
        }
    );
    return token;
};

module.exports = generateToken;