const Admin = require("../model/adminModel");
const RolesPermission = require("../model/rolesPermissionModel");
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

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.findAll({
            attributes: { exclude: ['password'] },
            include: [{
                model: RolesPermission,
                as: 'permissions'
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [{
                model: RolesPermission,
                as: 'permissions'
            }]
        });
        
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        res.status(200).json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, username, role, password } = req.body;
        
        const admin = await Admin.findByPk(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        if (email && email !== admin.email) {
            const existingEmail = await Admin.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }
        }
        
        if (username && username !== admin.username) {
            const existingUsername = await Admin.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ success: false, message: "Username already exists" });
            }
        }
        
        const updateData = {};
        if (email) updateData.email = email;
        if (username) updateData.username = username;
        if (role) updateData.role = role;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        
        await admin.update(updateData);
        
        res.status(200).json({ success: true, message: "Admin updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByPk(id);
        
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        await RolesPermission.destroy({ where: { aid: id } });
        await admin.destroy();
        
        res.status(200).json({ success: true, message: "Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateRolesPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const permissions = req.body;
        
        const admin = await Admin.findByPk(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const [rolesPermission, created] = await RolesPermission.findOrCreate({
            where: { aid: id },
            defaults: { aid: id, ...permissions }
        });
        
        if (!created) {
            await rolesPermission.update(permissions);
        }
        
        res.status(200).json({ success: true, message: "Permissions updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getRolesPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const permissions = await RolesPermission.findOne({ where: { aid: id } });
        
        if (!permissions) {
            return res.status(404).json({ success: false, message: "Permissions not found" });
        }
        
        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};