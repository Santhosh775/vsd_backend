const Driver = require('../model/driverModel');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Function to generate driver ID with sequential numbering
const generateDriverId = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get the count of drivers created today to determine the next sequence number
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const todayDrivers = await Driver.count({
        where: {
            created_at: {
                [Op.between]: [todayStart, todayEnd]
            }
        }
    });
    
    // Next sequence number (todayDrivers count is 0-based, so we add 1)
    const sequence = (todayDrivers + 1).toString().padStart(4, '0');
    return `DRV-${year}${month}${day}-${sequence}`;
};

// Create a new driver
exports.createDriver = async (req, res) => {
    try {
        // Generate driver ID if not provided
        if (!req.body.driver_id) {
            req.body.driver_id = await generateDriverId();
        }
        
        // Check if driver ID already exists
        const existingDriverById = await Driver.findOne({
            where: { driver_id: req.body.driver_id }
        });
        
        if (existingDriverById) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID already exists'
            });
        }
        
        // Check if email already exists (if provided)
        if (req.body.email) {
            const existingDriverByEmail = await Driver.findOne({
                where: { email: req.body.email }
            });
            
            if (existingDriverByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Check if license number already exists
        const existingDriverByLicense = await Driver.findOne({
            where: { license_number: req.body.license_number }
        });
        
        if (existingDriverByLicense) {
            return res.status(400).json({
                success: false,
                message: 'License number already exists'
            });
        }
        
        // Check if vehicle number already exists
        const existingDriverByVehicle = await Driver.findOne({
            where: { vehicle_number: req.body.vehicle_number }
        });
        
        if (existingDriverByVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number already exists'
            });
        }
        
        // Hash password
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        
        // Handle file uploads
        if (req.files) {
            if (req.files.driver_image) {
                req.body.driver_image = `/uploads/drivers/${req.files.driver_image[0].filename}`;
            }
            if (req.files.license_image) {
                req.body.license_image = `/uploads/drivers/${req.files.license_image[0].filename}`;
            }
            if (req.files.driver_id_proof) {
                req.body.driver_id_proof = `/uploads/drivers/${req.files.driver_id_proof[0].filename}`;
            }
        }

        // Set is_active based on status if not provided
        if (req.body.is_active === undefined) {
            req.body.is_active = req.body.status !== 'Inactive';
        }
        
        const driver = await Driver.create(req.body);
        
        // Remove password from response
        const driverData = driver.toJSON();
        delete driverData.password;
        
        res.status(201).json({
            success: true,
            message: 'Driver created successfully',
            data: driverData
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
            message: 'Error creating driver',
            error: error.message
        });
    }
};

// Get all drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.findAll({
            attributes: { exclude: ['password'] }
        });
        
        res.status(200).json({
            success: true,
            message: 'Drivers retrieved successfully',
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving drivers',
            error: error.message
        });
    }
};

// Get driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Driver retrieved successfully',
            data: driver
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving driver',
            error: error.message
        });
    }
};

// Update driver by ID
exports.updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findByPk(req.params.id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Prevent updating driver_id
        if (req.body.driver_id && req.body.driver_id !== driver.driver_id) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID cannot be changed'
            });
        }
        
        // Check if email already exists (if provided and different from current)
        if (req.body.email && req.body.email !== driver.email) {
            const existingDriverByEmail = await Driver.findOne({
                where: { email: req.body.email }
            });
            
            if (existingDriverByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Check if license number already exists (if provided and different from current)
        if (req.body.license_number && req.body.license_number !== driver.license_number) {
            const existingDriverByLicense = await Driver.findOne({
                where: { license_number: req.body.license_number }
            });
            
            if (existingDriverByLicense) {
                return res.status(400).json({
                    success: false,
                    message: 'License number already exists'
                });
            }
        }
        
        // Check if vehicle number already exists (if provided and different from current)
        if (req.body.vehicle_number && req.body.vehicle_number !== driver.vehicle_number) {
            const existingDriverByVehicle = await Driver.findOne({
                where: { vehicle_number: req.body.vehicle_number }
            });
            
            if (existingDriverByVehicle) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle number already exists'
                });
            }
        }
        
        // Hash password if provided
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        
        // Handle file uploads
        if (req.files) {
            if (req.files.driver_image) {
                req.body.driver_image = `/uploads/drivers/${req.files.driver_image[0].filename}`;
            }
            if (req.files.license_image) {
                req.body.license_image = `/uploads/drivers/${req.files.license_image[0].filename}`;
            }
            if (req.files.driver_id_proof) {
                req.body.driver_id_proof = `/uploads/drivers/${req.files.driver_id_proof[0].filename}`;
            }
        }

        // Update is_active based on status if status is being changed
        if (req.body.status) {
            req.body.is_active = req.body.status !== 'Inactive';
        }
        
        await driver.update(req.body);
        
        // Remove password from response
        const driverData = driver.toJSON();
        delete driverData.password;
        
        res.status(200).json({
            success: true,
            message: 'Driver updated successfully',
            data: driverData
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
            message: 'Error updating driver',
            error: error.message
        });
    }
};

// Delete driver by ID
exports.deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findByPk(req.params.id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        await driver.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Driver deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting driver',
            error: error.message
        });
    }
};

// Search drivers
exports.searchDrivers = async (req, res) => {
    try {
        const { query } = req.query;
        
        const drivers = await Driver.findAll({
            where: {
                [Op.or]: [
                    { driver_name: { [Op.like]: `%${query}%` } },
                    { driver_id: { [Op.like]: `%${query}%` } },
                    { phone_number: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { city: { [Op.like]: `%${query}%` } },
                    { state: { [Op.like]: `%${query}%` } },
                    { vehicle_number: { [Op.like]: `%${query}%` } },
                    { license_number: { [Op.like]: `%${query}%` } },
                    { available_vehicle: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: { exclude: ['password'] }
        });
        
        res.status(200).json({
            success: true,
            message: 'Drivers searched successfully',
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching drivers',
            error: error.message
        });
    }
};

// Get drivers by delivery type
exports.getDriversByDeliveryType = async (req, res) => {
    try {
        const { delivery_type } = req.params;
        
        const drivers = await Driver.findAll({
            where: {
                [Op.or]: [
                    { delivery_type: delivery_type },
                    { delivery_type: 'Both Types' }
                ]
            },
            attributes: { exclude: ['password'] }
        });
        
        res.status(200).json({
            success: true,
            message: 'Drivers retrieved successfully',
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving drivers',
            error: error.message
        });
    }
};

// Get drivers by status
exports.getDriversByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        const drivers = await Driver.findAll({
            where: { status: status },
            attributes: { exclude: ['password'] }
        });
        
        res.status(200).json({
            success: true,
            message: 'Drivers retrieved successfully',
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving drivers',
            error: error.message
        });
    }
};

// Update driver status
exports.updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Update is_active based on status
        const is_active = status !== 'Inactive';
        
        await driver.update({ 
            status: status,
            is_active: is_active
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver status updated successfully',
            data: { 
                status: driver.status,
                is_active: driver.is_active
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating driver status',
            error: error.message
        });
    }
};

// Update working hours
exports.updateWorkingHours = async (req, res) => {
    try {
        const { id } = req.params;
        const { working_hours } = req.body;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        await driver.update({ working_hours: working_hours });
        
        res.status(200).json({
            success: true,
            message: 'Working hours updated successfully',
            data: { working_hours: driver.working_hours }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating working hours',
            error: error.message
        });
    }
};

// Toggle driver active status
exports.toggleDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        const newActiveStatus = !driver.is_active;
        const newStatus = newActiveStatus ? 'Available' : 'Inactive';
        
        await driver.update({ 
            is_active: newActiveStatus,
            status: newStatus
        });
        
        res.status(200).json({
            success: true,
            message: `Driver ${newActiveStatus ? 'activated' : 'deactivated'} successfully`,
            data: { 
                is_active: driver.is_active,
                status: driver.status
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error toggling driver status',
            error: error.message
        });
    }
};

// Get driver attendance with filters
exports.getDriverAttendance = async (req, res) => {
    try {
        const { date, status, delivery_type, search } = req.query;
        
        let whereClause = {};
        
        // Filter by attendance status
        if (status && status !== 'All') {
            whereClause.attendance_status = status;
        }
        
        // Filter by delivery type
        if (delivery_type && delivery_type !== 'All') {
            whereClause.delivery_type = delivery_type;
        }
        
        // Search filter
        if (search) {
            whereClause[Op.or] = [
                { driver_name: { [Op.like]: `%${search}%` } },
                { driver_id: { [Op.like]: `%${search}%` } },
                { phone_number: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const drivers = await Driver.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: [['driver_name', 'ASC']]
        });
        
        // Calculate stats
        const totalRegistered = await Driver.count();
        const present = await Driver.count({ where: { attendance_status: 'Present' } });
        const absent = await Driver.count({ where: { attendance_status: 'Absent' } });
        const notMarked = totalRegistered - (present + absent);
        
        res.status(200).json({
            success: true,
            message: 'Driver attendance retrieved successfully',
            data: {
                drivers,
                stats: {
                    totalRegistered,
                    present,
                    absent,
                    notMarked
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving driver attendance',
            error: error.message
        });
    }
};

// Mark driver check-in
exports.markCheckIn = async (req, res) => {
    try {
        const { id } = req.params;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        await driver.update({
            login_time: new Date(),
            attendance_status: 'Present'
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver checked in successfully',
            data: {
                driver_id: driver.driver_id,
                driver_name: driver.driver_name,
                login_time: driver.login_time,
                attendance_status: driver.attendance_status
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking check-in',
            error: error.message
        });
    }
};

// Mark driver check-out
exports.markCheckOut = async (req, res) => {
    try {
        const { id } = req.params;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        if (!driver.login_time) {
            return res.status(400).json({
                success: false,
                message: 'Driver has not checked in yet'
            });
        }
        
        const checkOutTime = new Date();
        const workingHours = (checkOutTime - new Date(driver.login_time)) / (1000 * 60 * 60);
        
        await driver.update({
            logout_time: checkOutTime,
            working_hours: workingHours.toFixed(2)
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver checked out successfully',
            data: {
                driver_id: driver.driver_id,
                driver_name: driver.driver_name,
                logout_time: driver.logout_time,
                working_hours: driver.working_hours
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking check-out',
            error: error.message
        });
    }
};

// Mark driver as present
exports.markPresent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        await driver.update({
            attendance_status: 'Present',
            login_time: new Date()
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver marked as present',
            data: {
                driver_id: driver.driver_id,
                driver_name: driver.driver_name,
                attendance_status: driver.attendance_status,
                login_time: driver.login_time
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking driver as present',
            error: error.message
        });
    }
};

// Mark driver as absent
exports.markAbsent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const driver = await Driver.findByPk(id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        await driver.update({
            attendance_status: 'Absent',
            login_time: null,
            logout_time: null
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver marked as absent',
            data: {
                driver_id: driver.driver_id,
                driver_name: driver.driver_name,
                attendance_status: driver.attendance_status
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking driver as absent',
            error: error.message
        });
    }
};