const Admin = require("../model/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

exports.registerAdmin = async (req, res) => {
    try{
        const { email, username, password } = req.body;

        if(!email || !username || !password){
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        const existingAdmin = await Admin.findOne({ where: { email } });

        if(existingAdmin){
            return res.status(400).json({ success: false, message: "Admin with this email already exists" });
        }

        const existingUsername = await Admin.findOne({ where: { username } });

        if(existingUsername){
            return res.status(400).json({ success: false, message: "Admin with this username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await Admin.create({ 
            email,
            username,
            password: hashedPassword,
            role: 'admin'
        });

        res.status(201).json({ success: true, message: "Admin registered successfully"});

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
}

exports.loginAdmin = async (req, res) => {
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        const admin = await Admin.findOne({ where: { email } });

        if(!admin){
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if(!isMatch){
            return res.status(400).json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ 
            aid: admin.aid, 
            role: admin.role,
            username: admin.username
        }, process.env.JWT_SECRET || process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1d' });

        res.status(200).json({ success: true, token });

    }catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};