const Labour = require('../model/labourModel');
const LabourExcessPay = require('../model/labourExcessPayModel');
const LabourRate = require('../model/labourRateModel');
const { Op } = require('sequelize');

// Function to generate labour ID with sequential numbering
const generateLabourId = async () => {
    const date = new Date();
    const year = date.getFullYear();
    
    // Get the count of labours created this year to determine the next sequence number
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    
    const yearLabours = await Labour.count({
        where: {
            createdAt: {
                [Op.between]: [yearStart, yearEnd]
            }
        }
    });
    
    // Next sequence number (yearLabours count is 0-based, so we add 1)
    const sequence = (yearLabours + 1).toString().padStart(3, '0');
    return `LAB-${year}-${sequence}`;
};

// Create a new labour
exports.createLabour = async (req, res) => {
    try {
        // Generate labour ID if not provided
        if (!req.body.labour_id) {
            req.body.labour_id = await generateLabourId();
        }
        
        // Check if labour_id already exists
        const existingLabourById = await Labour.findOne({
            where: { labour_id: req.body.labour_id }
        });
        
        if (existingLabourById) {
            return res.status(400).json({
                success: false,
                message: 'Labour ID already exists'
            });
        }
        
        // Check if mobile number already exists
        if (req.body.mobile_number) {
            const existingLabourByPhone = await Labour.findOne({
                where: { mobile_number: req.body.mobile_number }
            });
            
            if (existingLabourByPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number already exists'
                });
            }
        }
        
        // Check if aadhaar number already exists (if provided)
        if (req.body.aadhaar_number) {
            const existingLabourByAadhaar = await Labour.findOne({
                where: { aadhaar_number: req.body.aadhaar_number }
            });
            
            if (existingLabourByAadhaar) {
                return res.status(400).json({
                    success: false,
                    message: 'Aadhaar number already exists'
                });
            }
        }
        
        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/labours/${req.file.filename}`;
        }
        
        const labour = await Labour.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Labour created successfully',
            data: labour
        });
    } catch (error) {
        // Handle Sequelize unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.errors && error.errors[0]) {
                const field = error.errors[0].path;
                return res.status(400).json({
                    success: false,
                    message: `${field} already exists`
                });
            }
        }
        
        res.status(400).json({
            success: false,
            message: 'Error creating labour',
            error: error.message
        });
    }
};

// Get all labours
exports.getAllLabours = async (req, res) => {
    try {
        const { status, department } = req.query;
        
        let whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (department) {
            whereClause.department = department;
        }
        
        const labours = await Labour.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Labours retrieved successfully',
            data: labours
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving labours',
            error: error.message
        });
    }
};

// Get labour by ID
exports.getLabourById = async (req, res) => {
    try {
        const labour = await Labour.findByPk(req.params.id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Labour retrieved successfully',
            data: labour
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving labour',
            error: error.message
        });
    }
};

// Update labour by ID
exports.updateLabour = async (req, res) => {
    try {
        const labour = await Labour.findByPk(req.params.id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        // Prevent updating labour_id
        if (req.body.labour_id && req.body.labour_id !== labour.labour_id) {
            return res.status(400).json({
                success: false,
                message: 'Labour ID cannot be changed'
            });
        }
        
        // Check if mobile number already exists (if provided and different from current)
        if (req.body.mobile_number && req.body.mobile_number !== labour.mobile_number) {
            const existingLabourByPhone = await Labour.findOne({
                where: { mobile_number: req.body.mobile_number }
            });
            
            if (existingLabourByPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number already exists'
                });
            }
        }
        
        // Check if aadhaar number already exists (if provided and different from current)
        if (req.body.aadhaar_number && req.body.aadhaar_number !== labour.aadhaar_number) {
            const existingLabourByAadhaar = await Labour.findOne({
                where: { aadhaar_number: req.body.aadhaar_number }
            });
            
            if (existingLabourByAadhaar) {
                return res.status(400).json({
                    success: false,
                    message: 'Aadhaar number already exists'
                });
            }
        }
        
        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/labours/${req.file.filename}`;
        }
        
        await labour.update(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Labour updated successfully',
            data: labour
        });
    } catch (error) {
        // Handle Sequelize unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.errors && error.errors[0]) {
                const field = error.errors[0].path;
                return res.status(400).json({
                    success: false,
                    message: `${field} already exists`
                });
            }
        }
        
        res.status(400).json({
            success: false,
            message: 'Error updating labour',
            error: error.message
        });
    }
};

// Delete labour by ID
exports.deleteLabour = async (req, res) => {
    try {
        const labour = await Labour.findByPk(req.params.id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        await labour.destroy();
        res.status(200).json({
            success: true,
            message: 'Labour deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting labour',
            error: error.message
        });
    }
};

// Search labours
exports.searchLabours = async (req, res) => {
    try {
        const { query } = req.query;
        const labours = await Labour.findAll({
            where: {
                [Op.or]: [
                    { full_name: { [Op.like]: `%${query}%` } },
                    { labour_id: { [Op.like]: `%${query}%` } },
                    { mobile_number: { [Op.like]: `%${query}%` } },
                    { department: { [Op.like]: `%${query}%` } },
                    { work_type: { [Op.like]: `%${query}%` } }
                ]
            }
        });
        
        res.status(200).json({
            success: true,
            message: 'Labours searched successfully',
            data: labours
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching labours',
            error: error.message
        });
    }
};

// Get labour summary statistics
exports.getLabourStats = async (req, res) => {
    try {
        const totalLabours = await Labour.count();
        
        const activeLabours = await Labour.count({
            where: { status: 'Active' }
        });
        
        const pendingPayouts = 0;
        const totalPaid = 0;
        
        res.status(200).json({
            success: true,
            message: 'Labour statistics retrieved successfully',
            data: {
                totalLabours,
                activeLabours,
                pendingPayouts: pendingPayouts || 0,
                totalPaid
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving labour statistics',
            error: error.message
        });
    }
};

// Labour Excess Pay CRUD Operations

// Create excess pay record
exports.createExcessPay = async (req, res) => {
    try {
        const excessPay = await LabourExcessPay.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Excess pay record created successfully',
            data: excessPay
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating excess pay record',
            error: error.message
        });
    }
};

// Get all excess pay records
exports.getAllExcessPay = async (req, res) => {
    try {
        const excessPayRecords = await LabourExcessPay.findAll({
            include: [{
                model: Labour,
                as: 'labour',
                attributes: ['lid', 'labour_id', 'full_name']
            }],
            order: [['date', 'DESC']]
        });
        res.status(200).json({
            success: true,
            message: 'Excess pay records retrieved successfully',
            data: excessPayRecords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess pay records',
            error: error.message
        });
    }
};

// Get excess pay record by ID
exports.getExcessPayById = async (req, res) => {
    try {
        const excessPay = await LabourExcessPay.findByPk(req.params.id, {
            include: [{
                model: Labour,
                as: 'labour',
                attributes: ['lid', 'labour_id', 'full_name']
            }]
        });
        if (!excessPay) {
            return res.status(404).json({
                success: false,
                message: 'Excess pay record not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Excess pay record retrieved successfully',
            data: excessPay
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess pay record',
            error: error.message
        });
    }
};

// Update excess pay record
exports.updateExcessPay = async (req, res) => {
    try {
        const excessPay = await LabourExcessPay.findByPk(req.params.id);
        if (!excessPay) {
            return res.status(404).json({
                success: false,
                message: 'Excess pay record not found'
            });
        }
        await excessPay.update(req.body);
        res.status(200).json({
            success: true,
            message: 'Excess pay record updated successfully',
            data: excessPay
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating excess pay record',
            error: error.message
        });
    }
};

// Delete excess pay record
exports.deleteExcessPay = async (req, res) => {
    try {
        const excessPay = await LabourExcessPay.findByPk(req.params.id);
        if (!excessPay) {
            return res.status(404).json({
                success: false,
                message: 'Excess pay record not found'
            });
        }
        await excessPay.destroy();
        res.status(200).json({
            success: true,
            message: 'Excess pay record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting excess pay record',
            error: error.message
        });
    }
};

// Get labour amount by work type
exports.getAmountByWorkType = async (req, res) => {
    try {
        const { work_type } = req.params;
        
        const labourRate = await LabourRate.findOne({
            where: { 
                labourType: work_type,
                status: 'Active'
            }
        });
        
        if (!labourRate) {
            return res.status(404).json({
                success: false,
                message: `No active rate found for work type: ${work_type}`
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Labour amount retrieved successfully',
            data: {
                work_type: labourRate.labourType,
                amount: labourRate.amount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving labour amount',
            error: error.message
        });
    }
};