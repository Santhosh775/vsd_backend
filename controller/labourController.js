const Labour = require('../model/labourModel');
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

// Calculate work hours from check-in and check-out times
const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    const inTime = inHours + inMinutes / 60;
    const outTime = outHours + outMinutes / 60;
    
    const hours = outTime - inTime;
    return hours > 0 ? hours.toFixed(2) : 0;
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
        
        // Calculate work hours if check-in and check-out times are provided
        if (req.body.check_in_time && req.body.check_out_time) {
            req.body.today_hours = calculateWorkHours(req.body.check_in_time, req.body.check_out_time);
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
        const { status, work_type, location, department } = req.query;
        
        let whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (work_type) {
            whereClause.work_type = work_type;
        }
        
        if (location) {
            whereClause.location = location;
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
        
        // Calculate work hours if check-in and check-out times are provided
        if (req.body.check_in_time && req.body.check_out_time) {
            req.body.today_hours = calculateWorkHours(req.body.check_in_time, req.body.check_out_time);
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
                    { location: { [Op.like]: `%${query}%` } }
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

// Mark attendance (Present/Absent/Half Day)
exports.markAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, check_in_time, check_out_time } = req.body;
        
        const labour = await Labour.findByPk(id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        const updateData = { status };
        
        if (check_in_time) {
            updateData.check_in_time = check_in_time;
        }
        
        if (check_out_time) {
            updateData.check_out_time = check_out_time;
            
            // Calculate work hours if both times are available
            if (labour.check_in_time || check_in_time) {
                const inTime = check_in_time || labour.check_in_time;
                updateData.today_hours = calculateWorkHours(inTime, check_out_time);
            }
        }
        
        await labour.update(updateData);
        
        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            data: labour
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking attendance',
            error: error.message
        });
    }
};

// Assign work to labour
exports.assignWork = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_id, location, work_type } = req.body;
        
        const labour = await Labour.findByPk(id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        await labour.update({
            order_id,
            location,
            work_type,
            status: 'Assigned'
        });
        
        res.status(200).json({
            success: true,
            message: 'Work assigned successfully',
            data: labour
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error assigning work',
            error: error.message
        });
    }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalRegistered = await Labour.count();
        
        const present = await Labour.count({
            where: { status: 'Present' }
        });
        
        const absent = await Labour.count({
            where: { status: 'Absent' }
        });
        
        const halfDay = await Labour.count({
            where: { status: 'Half Day' }
        });
        
        const notMarked = totalRegistered - (present + absent + halfDay);
        
        res.status(200).json({
            success: true,
            message: 'Attendance statistics retrieved successfully',
            data: {
                totalRegistered,
                present,
                absent,
                halfDay,
                notMarked
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving attendance statistics',
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
        
        const pendingPayouts = await Labour.sum('daily_wage', {
            where: { status: 'Present' }
        });
        
        // This would need a separate payouts tracking system for accurate total paid
        // For now, returning 0 or you can implement a payouts table
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