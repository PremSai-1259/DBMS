const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    // We must use user_id because that is what your SQL schema named the column
    const token = jwt.sign(
        {
            id: user.user_id, 
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