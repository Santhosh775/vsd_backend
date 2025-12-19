const AttendanceHistory = require('../model/driverAttendanceModel');
const Driver = require('../model/driverModel');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// Get attendance overview for a specific date
exports.getAttendanceOverview = async (req, res) => {
    try {
        const { date, status, delivery_type, search } = req.query;
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        // Build where clause for drivers
        let driverWhereClause = {};
        
        if (delivery_type && delivery_type !== 'All') {
            driverWhereClause[Op.or] = [
                { delivery_type: delivery_type },
                { delivery_type: 'Both Types' }
            ];
        }
        
        if (search) {
            driverWhereClause[Op.or] = [
                { driver_name: { [Op.like]: `%${search}%` } },
                { driver_id: { [Op.like]: `%${search}%` } },
                { phone_number: { [Op.like]: `%${search}%` } }
            ];
        }
        
        // Get all drivers matching filters
        const drivers = await Driver.findAll({
            where: driverWhereClause,
            attributes: { exclude: ['password'] },
            order: [['driver_name', 'ASC']]
        });
        
        // Get attendance records for the date
        const attendanceRecords = await AttendanceHistory.findAll({
            where: { date: attendanceDate },
            raw: true
        });
        
        // Create a map of driver_id to attendance
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.driver_id] = record;
        });
        
        // Merge driver data with attendance
        const driversWithAttendance = drivers.map(driver => {
            const driverData = driver.toJSON();
            const attendance = attendanceMap[driver.did];
            
            return {
                ...driverData,
                check_in_time: attendance?.check_in_time || null,
                check_out_time: attendance?.check_out_time || null,
                attendance_status: attendance?.attendance_status || 'Not Marked',
                attendance_id: attendance?.id || null
            };
        });
        
        // Filter by status if provided
        let filteredDrivers = driversWithAttendance;
        if (status && status !== 'All') {
            filteredDrivers = driversWithAttendance.filter(d => d.attendance_status === status);
        }
        
        // Calculate statistics
        const totalRegistered = drivers.length;
        const present = driversWithAttendance.filter(d => d.attendance_status === 'Present').length;
        const absent = driversWithAttendance.filter(d => d.attendance_status === 'Absent').length;
        const notMarked = driversWithAttendance.filter(d => d.attendance_status === 'Not Marked').length;
        
        res.status(200).json({
            success: true,
            message: 'Attendance overview retrieved successfully',
            data: {
                drivers: filteredDrivers,
                stats: {
                    totalRegistered,
                    present,
                    absent,
                    notMarked
                },
                date: attendanceDate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving attendance overview',
            error: error.message
        });
    }
};

// Mark driver check-in
exports.markCheckIn = async (req, res) => {
    try {
        const { driver_id } = req.params;
        const { date, time } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkInTime = time || new Date().toTimeString().split(' ')[0];
        
        // Check if driver exists
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Find or create attendance record for the date
        let attendance = await AttendanceHistory.findOne({
            where: {
                driver_id: driver_id,
                date: attendanceDate
            }
        });
        
        if (attendance) {
            // Update existing record
            await attendance.update({
                check_in_time: checkInTime,
                attendance_status: 'Present'
            });
        } else {
            // Create new record
            attendance = await AttendanceHistory.create({
                driver_id: driver_id,
                date: attendanceDate,
                check_in_time: checkInTime,
                attendance_status: 'Present'
            });
        }
        
        // Update driver's current status
        await driver.update({
            login_time: new Date(),
            attendance_status: 'Present'
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver checked in successfully',
            data: attendance
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
        const { driver_id } = req.params;
        const { date } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkOutTime = new Date().toTimeString().split(' ')[0];
        
        // Check if driver exists
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Find attendance record
        const attendance = await AttendanceHistory.findOne({
            where: {
                driver_id: driver_id,
                date: attendanceDate
            }
        });
        
        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'No attendance record found for this date'
            });
        }
        
        if (!attendance.check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Driver has not checked in yet'
            });
        }
        
        // Update attendance record
        await attendance.update({
            check_out_time: checkOutTime
        });
        
        // Update driver's current status
        await driver.update({
            logout_time: new Date()
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver checked out successfully',
            data: attendance
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
        const { driver_id } = req.params;
        const { date } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkInTime = new Date().toTimeString().split(' ')[0];
        
        // Check if driver exists
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Find or create attendance record
        let attendance = await AttendanceHistory.findOne({
            where: {
                driver_id: driver_id,
                date: attendanceDate
            }
        });
        
        if (attendance) {
            await attendance.update({
                check_in_time: checkInTime,
                attendance_status: 'Present'
            });
        } else {
            attendance = await AttendanceHistory.create({
                driver_id: driver_id,
                date: attendanceDate,
                check_in_time: checkInTime,
                attendance_status: 'Present'
            });
        }
        
        // Update driver's current status
        await driver.update({
            login_time: new Date(),
            attendance_status: 'Present'
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver marked as present and checked in',
            data: attendance
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
        const { driver_id } = req.params;
        const { date, remarks } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        // Check if driver exists
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Find or create attendance record
        let attendance = await AttendanceHistory.findOne({
            where: {
                driver_id: driver_id,
                date: attendanceDate
            }
        });
        
        if (attendance) {
            await attendance.update({
                attendance_status: 'Absent',
                check_in_time: null,
                check_out_time: null,
                remarks: remarks || null
            });
        } else {
            attendance = await AttendanceHistory.create({
                driver_id: driver_id,
                date: attendanceDate,
                attendance_status: 'Absent',
                remarks: remarks || null
            });
        }
        
        // Update driver's current status
        await driver.update({
            attendance_status: 'Absent',
            login_time: null,
            logout_time: null
        });
        
        res.status(200).json({
            success: true,
            message: 'Driver marked as absent',
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking driver as absent',
            error: error.message
        });
    }
};

// Get attendance history for a driver
exports.getDriverAttendanceHistory = async (req, res) => {
    try {
        const { driver_id } = req.params;
        const { start_date, end_date, limit, offset } = req.query;
        
        let whereClause = { driver_id: driver_id };
        
        if (start_date && end_date) {
            whereClause.date = {
                [Op.between]: [start_date, end_date]
            };
        }
        
        const attendanceHistory = await AttendanceHistory.findAndCountAll({
            where: whereClause,
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']],
            limit: limit ? parseInt(limit) : 30,
            offset: offset ? parseInt(offset) : 0
        });
        
        res.status(200).json({
            success: true,
            message: 'Attendance history retrieved successfully',
            data: {
                records: attendanceHistory.rows,
                total: attendanceHistory.count,
                limit: limit ? parseInt(limit) : 30,
                offset: offset ? parseInt(offset) : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving attendance history',
            error: error.message
        });
    }
};

// Get attendance statistics for a driver
exports.getDriverAttendanceStats = async (req, res) => {
    try {
        const { driver_id } = req.params;
        const { start_date, end_date } = req.query;
        
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const startDate = start_date || `${currentMonth}-01`;
        const endDate = end_date || new Date().toISOString().split('T')[0];
        
        // Get attendance records
        const attendanceRecords = await AttendanceHistory.findAll({
            where: {
                driver_id: driver_id,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            raw: true
        });
        
        // Calculate statistics
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(r => r.attendance_status === 'Present').length;
        const absentDays = attendanceRecords.filter(r => r.attendance_status === 'Absent').length;
        const notMarkedDays = attendanceRecords.filter(r => r.attendance_status === 'Not Marked').length;
        
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
        
        res.status(200).json({
            success: true,
            message: 'Attendance statistics retrieved successfully',
            data: {
                driver_id: driver_id,
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                stats: {
                    totalDays,
                    presentDays,
                    absentDays,
                    notMarkedDays,
                    attendancePercentage
                }
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

// Get attendance report for all drivers
exports.getAttendanceReport = async (req, res) => {
    try {
        const { start_date, end_date, delivery_type } = req.query;
        
        const currentMonth = new Date().toISOString().slice(0, 7);
        const startDate = start_date || `${currentMonth}-01`;
        const endDate = end_date || new Date().toISOString().split('T')[0];
        
        // Build driver where clause
        let driverWhereClause = {};
        if (delivery_type && delivery_type !== 'All') {
            driverWhereClause[Op.or] = [
                { delivery_type: delivery_type },
                { delivery_type: 'Both Types' }
            ];
        }
        
        // Get all drivers
        const drivers = await Driver.findAll({
            where: driverWhereClause,
            attributes: ['did', 'driver_id', 'driver_name', 'phone_number', 'delivery_type'],
            order: [['driver_name', 'ASC']]
        });
        
        // Get attendance records for the period
        const attendanceRecords = await AttendanceHistory.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            raw: true
        });
        
        // Group attendance by driver
        const attendanceByDriver = {};
        attendanceRecords.forEach(record => {
            if (!attendanceByDriver[record.driver_id]) {
                attendanceByDriver[record.driver_id] = [];
            }
            attendanceByDriver[record.driver_id].push(record);
        });
        
        // Calculate stats for each driver
        const report = drivers.map(driver => {
            const driverAttendance = attendanceByDriver[driver.did] || [];
            
            const presentDays = driverAttendance.filter(r => r.attendance_status === 'Present').length;
            const absentDays = driverAttendance.filter(r => r.attendance_status === 'Absent').length;
            const totalDays = driverAttendance.length;
            
            const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
            
            return {
                driver_id: driver.did,
                driver_code: driver.driver_id,
                driver_name: driver.driver_name,
                phone_number: driver.phone_number,
                delivery_type: driver.delivery_type,
                presentDays,
                absentDays,
                totalDays,
                attendancePercentage
            };
        });
        
        res.status(200).json({
            success: true,
            message: 'Attendance report retrieved successfully',
            data: {
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                report
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating attendance report',
            error: error.message
        });
    }
};

// Bulk mark attendance (mark multiple drivers at once)
exports.bulkMarkAttendance = async (req, res) => {
    try {
        const { date, driver_ids, attendance_status } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        if (!driver_ids || !Array.isArray(driver_ids) || driver_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Driver IDs array is required'
            });
        }
        
        if (!['Present', 'Absent'].includes(attendance_status)) {
            return res.status(400).json({
                success: false,
                message: 'Attendance status must be Present or Absent'
            });
        }
        
        const results = [];
        
        for (const driver_id of driver_ids) {
            try {
                // Find or create attendance record
                let attendance = await AttendanceHistory.findOne({
                    where: {
                        driver_id: driver_id,
                        date: attendanceDate
                    }
                });
                
                if (attendance) {
                    await attendance.update({
                        attendance_status: attendance_status
                    });
                } else {
                    attendance = await AttendanceHistory.create({
                        driver_id: driver_id,
                        date: attendanceDate,
                        attendance_status: attendance_status
                    });
                }
                
                results.push({
                    driver_id,
                    status: 'success',
                    attendance_id: attendance.id
                });
            } catch (error) {
                results.push({
                    driver_id,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        
        res.status(200).json({
            success: true,
            message: `Bulk attendance marked: ${successCount} succeeded, ${failedCount} failed`,
            data: {
                successCount,
                failedCount,
                results
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking bulk attendance',
            error: error.message
        });
    }
};

// Update attendance remarks
exports.updateAttendanceRemarks = async (req, res) => {
    try {
        const { attendance_id } = req.params;
        const { remarks } = req.body;
        
        const attendance = await AttendanceHistory.findByPk(attendance_id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        await attendance.update({ remarks });
        
        res.status(200).json({
            success: true,
            message: 'Attendance remarks updated successfully',
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating attendance remarks',
            error: error.message
        });
    }
};

// Delete attendance record
exports.deleteAttendanceRecord = async (req, res) => {
    try {
        const { attendance_id } = req.params;
        
        const attendance = await AttendanceHistory.findByPk(attendance_id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        await attendance.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Attendance record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting attendance record',
            error: error.message
        });
    }
};

// Get drivers who are present today
exports.getPresentDriversToday = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const presentDrivers = await AttendanceHistory.findAll({
            where: { date: today, attendance_status: 'Present' },
            include: [{ 
                model: Driver, 
                as: 'driver',
                attributes: { exclude: ['password'] }
            }]
        });
        
        res.status(200).json({
            success: true,
            message: 'Present drivers retrieved successfully',
            data: presentDrivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching present drivers',
            error: error.message
        });
    }
};