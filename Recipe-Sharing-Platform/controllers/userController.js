const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;
  try {
    const usereist = await User.findOne({ userName });
    if (usereist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      userName: userName,
      email: email,
      password: password,
    });
    // await user.save();//NO NEED TO CALL SAVE() AS CREATE() ALREADY SAVES THE DOCUMENT TO THE DATABASE
    res
      .status(201)
      .json({
        message: "User registered successfully",
        user,
        userId: user._id,
        token: generateToken(user._id),
      });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }); //just find returns array of objects so you cant use ftns like matchPassword and etc
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res
      .status(200)
      .json({
        message: "Login successful",
        user,
        token: generateToken(user._id),
      });
  } catch (error) {
    console.error("LOGIN BUG:", error); // This prints the exact line number in your Server terminal!
    res.status(500).json({ message: error.message }); // This sends the exact bug to the Test Script
  }
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
};
