const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/usermodel");
//SIGN UP
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // ✅ STEP 1: Check if email exists
    const existingUser = await findUserByEmail(email);

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // ✅ STEP 2: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ STEP 3: Insert user
    await createUser(name, email, hashedPassword, role);

    res.json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ FIX: use await
    const result = await findUserByEmail(email);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    // ✅ FIX: await bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

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

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = { signup, login };