const LabourAttendance = require('../model/labourAttendanceModel');
const Labour = require('../model/labourModel');
const { Op } = require('sequelize');

const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [inHours, inMinutes, inSeconds] = checkIn.split(':').map(Number);
    const [outHours, outMinutes, outSeconds] = checkOut.split(':').map(Number);
    const inTime = inHours + inMinutes / 60;
    const outTime = outHours + outMinutes / 60;
    const hours = outTime - inTime;
    return hours > 0 ? hours.toFixed(2) : 0;
};

exports.getAttendanceOverview = async (req, res) => {
    try {
        const { date, status, department, search } = req.query;
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        let labourWhereClause = {};
        
        if (department && department !== 'All') {
            labourWhereClause.department = department;
        }
        
        if (search) {
            labourWhereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { labour_id: { [Op.like]: `%${search}%` } },
                { mobile_number: { [Op.like]: `%${search}%` } }
            ];
        }
        
        const labours = await Labour.findAll({
            where: labourWhereClause,
            order: [['full_name', 'ASC']]
        });
        
        const attendanceRecords = await LabourAttendance.findAll({
            where: { date: attendanceDate },
            raw: true
        });
        
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.labour_id] = record;
        });
        
        const laboursWithAttendance = labours.map(labour => {
            const labourData = labour.toJSON();
            const attendance = attendanceMap[labour.lid];
            
            return {
                ...labourData,
                check_in_time: attendance?.check_in_time || null,
                check_out_time: attendance?.check_out_time || null,
                work_hours: attendance?.work_hours || 0,
                attendance_status: attendance?.status || 'Not Marked',
                attendance_id: attendance?.id || null
            };
        });
        
        let filteredLabours = laboursWithAttendance;
        if (status && status !== 'All') {
            filteredLabours = laboursWithAttendance.filter(l => l.attendance_status === status);
        }
        
        const totalRegistered = labours.length;
        const present = laboursWithAttendance.filter(l => l.attendance_status === 'Present').length;
        const absent = laboursWithAttendance.filter(l => l.attendance_status === 'Absent').length;
        const halfDay = laboursWithAttendance.filter(l => l.attendance_status === 'Half Day').length;
        const notMarked = laboursWithAttendance.filter(l => l.attendance_status === 'Not Marked').length;
        
        res.status(200).json({
            success: true,
            message: 'Attendance overview retrieved successfully',
            data: {
                labours: filteredLabours,
                stats: {
                    totalRegistered,
                    present,
                    absent,
                    halfDay,
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

exports.markPresent = async (req, res) => {
    try {
        const { labour_id } = req.params;
        const { date, time } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkInTime = time || new Date().toTimeString().split(' ')[0];
        
        const labour = await Labour.findByPk(labour_id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        let attendance = await LabourAttendance.findOne({
            where: {
                labour_id: labour_id,
                date: attendanceDate
            }
        });
        
        if (attendance) {
            await attendance.update({
                check_in_time: checkInTime,
                status: 'Present'
            });
        } else {
            attendance = await LabourAttendance.create({
                labour_id: labour_id,
                date: attendanceDate,
                check_in_time: checkInTime,
                status: 'Present'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Labour marked as present',
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking labour as present',
            error: error.message
        });
    }
};

exports.markCheckOut = async (req, res) => {
    try {
        const { labour_id } = req.params;
        const { date } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkOutTime = new Date().toTimeString().split(' ')[0];
        
        const labour = await Labour.findByPk(labour_id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        const attendance = await LabourAttendance.findOne({
            where: {
                labour_id: labour_id,
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
                message: 'Labour has not checked in yet'
            });
        }
        
        const work_hours = calculateWorkHours(attendance.check_in_time, checkOutTime);
        
        await attendance.update({
            check_out_time: checkOutTime,
            work_hours: work_hours,
            status: 'Checked-Out'
        });
        
        res.status(200).json({
            success: true,
            message: 'Labour checked out successfully',
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

exports.updateCheckInTime = async (req, res) => {
    try {
        const { labour_id } = req.params;
        const { date, time } = req.body;

        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkInTime = time || new Date().toTimeString().split(' ')[0];

        const labour = await Labour.findByPk(labour_id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        const attendance = await LabourAttendance.findOne({
            where: {
                labour_id: labour_id,
                date: attendanceDate
            }
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No attendance record found for this date'
            });
        }

        await attendance.update({
            check_in_time: checkInTime,
            status: 'Present'
        });

        res.status(200).json({
            success: true,
            message: 'Check-in time updated successfully',
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating check-in time',
            error: error.message
        });
    }
};

exports.updateCheckOutTime = async (req, res) => {
    try {
        const { labour_id } = req.params;
        const { date, time } = req.body;

        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const checkOutTime = time || new Date().toTimeString().split(' ')[0];

        const labour = await Labour.findByPk(labour_id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        const attendance = await LabourAttendance.findOne({
            where: {
                labour_id: labour_id,
                date: attendanceDate
            }
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No attendance record found for this date'
            });
        }

        if (!attendance.check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Labour has not checked in yet'
            });
        }

        const work_hours = calculateWorkHours(attendance.check_in_time, checkOutTime);

        await attendance.update({
            check_out_time: checkOutTime,
            work_hours: work_hours,
            status: 'Checked-Out'
        });

        res.status(200).json({
            success: true,
            message: 'Check-out time updated successfully',
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating check-out time',
            error: error.message
        });
    }
};

exports.markAbsent = async (req, res) => {
    try {
        const { labour_id } = req.params;
        const { date } = req.body;
        
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        const labour = await Labour.findByPk(labour_id);
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }
        
        let attendance = await LabourAttendance.findOne({
            where: {
                labour_id: labour_id,
                date: attendanceDate
            }
        });
        
        if (attendance) {
            await attendance.update({
                status: 'Absent',
                check_in_time: null,
                check_out_time: null,
                work_hours: 0
            });
        } else {
            attendance = await LabourAttendance.create({
                labour_id: labour_id,
                date: attendanceDate,
                status: 'Absent'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Labour marked as absent',
            data: attendance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error marking labour as absent',
            error: error.message
        });
    }
};

exports.getAttendanceStats = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const totalRegistered = await Labour.count();
        
        const present = await LabourAttendance.count({
            where: { date: targetDate, status: 'Present' }
        });
        
        const absent = await LabourAttendance.count({
            where: { date: targetDate, status: 'Absent' }
        });
        
        const halfDay = await LabourAttendance.count({
            where: { date: targetDate, status: 'Half Day' }
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

exports.getPresentLaboursToday = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const presentLabours = await LabourAttendance.findAll({
            where: { date: today, status: 'Present' },
            include: [{ model: Labour, as: 'labour' }]
        });
        
        res.status(200).json({
            success: true,
            data: presentLabours
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching present labours',
            error: error.message
        });
    }
};
