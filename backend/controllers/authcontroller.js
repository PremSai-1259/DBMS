const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/usermodel");
//SIGN UP
const signup = async (req, res) => {
    const { name, email, password, role } = req.body;   //Creating body (input space)
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);  //hashing
    createUser(name, email, hashedPassword, role, (err, resylt) => {      //inserts data into db
        if (err) {
            return res.status(500).json(err);
        }
        res.json({
            message: "User created successfully"
        });
    });
};

//LOGIN
const login = (req, res) => {
    const { email, password } = req.body;     //input space
    findUserByEmail(email, (err, result) => {              //checks user presence in db using email
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {  //compares hashed password
            if (!isMatch) {
                return res.status(401).json({ message: "Wrong password" });
            }
            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                "secretkey",
                { expiresIn: "1h" }
            );
            res.json({
                message: "Login successful",
                token,
                role: user.role
            });
        });
    });
};

module.exports = { signup, login };