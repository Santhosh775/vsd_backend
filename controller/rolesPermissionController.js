const RolesPermission = require("../model/rolesPermissionModel");
const Admin = require("../model/adminModel");

exports.createOrUpdatePermissions = async (req, res) => {
    try {
        const { aid } = req.params;
        const permissions = req.body;
        
        const admin = await Admin.findByPk(aid);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        
        const [rolesPermission, created] = await RolesPermission.findOrCreate({
            where: { aid },
            defaults: { aid, ...permissions }
        });
        
        if (!created) {
            await rolesPermission.update(permissions);
        }
        
        res.status(200).json({ 
            success: true, 
            message: created ? "Permissions created successfully" : "Permissions updated successfully",
            data: rolesPermission
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getPermissionsByAdminId = async (req, res) => {
    try {
        const { aid } = req.params;
        
        const permissions = await RolesPermission.findOne({ 
            where: { aid },
            include: [{
                model: Admin,
                as: 'admin',
                attributes: ['aid', 'username', 'email', 'role']
            }]
        });
        
        if (!permissions) {
            return res.status(404).json({ success: false, message: "Permissions not found" });
        }
        
        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await RolesPermission.findAll({
            include: [{
                model: Admin,
                as: 'admin',
                attributes: ['aid', 'username', 'email', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deletePermissions = async (req, res) => {
    try {
        const { aid } = req.params;
        
        const permissions = await RolesPermission.findOne({ where: { aid } });
        if (!permissions) {
            return res.status(404).json({ success: false, message: "Permissions not found" });
        }
        
        await permissions.destroy();
        res.status(200).json({ success: true, message: "Permissions deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
