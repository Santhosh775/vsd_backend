const LabourRemark = require('../model/labourRemarkModel');
const Labour = require('../model/labourModel');
const { Op } = require('sequelize');

exports.createRemark = async (req, res) => {
    try {
        const labour = await Labour.findByPk(req.body.labour_id);
        if (!labour) {
            return res.status(404).json({ success: false, message: 'Labour not found' });
        }
        const remark = await LabourRemark.create(req.body);
        res.status(201).json({ success: true, message: 'Remark created successfully', data: remark });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error creating remark', error: error.message });
    }
};

exports.getAllRemarks = async (req, res) => {
    try {
        const remarks = await LabourRemark.findAll({
            include: [{ model: Labour, as: 'labour', attributes: ['lid', 'labour_id', 'full_name', 'mobile_number'] }],
            order: [['date', 'DESC']]
        });
        res.status(200).json({ success: true, message: 'Remarks retrieved successfully', data: remarks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving remarks', error: error.message });
    }
};

exports.getRemarkById = async (req, res) => {
    try {
        const remark = await LabourRemark.findByPk(req.params.id, {
            include: [{ model: Labour, as: 'labour', attributes: ['lid', 'labour_id', 'full_name', 'mobile_number'] }]
        });
        if (!remark) {
            return res.status(404).json({ success: false, message: 'Remark not found' });
        }
        res.status(200).json({ success: true, message: 'Remark retrieved successfully', data: remark });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving remark', error: error.message });
    }
};

exports.getRemarksByLabourId = async (req, res) => {
    try {
        const remarks = await LabourRemark.findAll({
            where: { labour_id: req.params.labour_id },
            include: [{ model: Labour, as: 'labour', attributes: ['lid', 'labour_id', 'full_name', 'mobile_number'] }],
            order: [['date', 'DESC']]
        });
        res.status(200).json({ success: true, message: 'Remarks retrieved successfully', data: remarks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving remarks', error: error.message });
    }
};

exports.updateRemark = async (req, res) => {
    try {
        const remark = await LabourRemark.findByPk(req.params.id);
        if (!remark) {
            return res.status(404).json({ success: false, message: 'Remark not found' });
        }
        await remark.update(req.body);
        res.status(200).json({ success: true, message: 'Remark updated successfully', data: remark });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error updating remark', error: error.message });
    }
};

exports.deleteRemark = async (req, res) => {
    try {
        const remark = await LabourRemark.findByPk(req.params.id);
        if (!remark) {
            return res.status(404).json({ success: false, message: 'Remark not found' });
        }
        await remark.destroy();
        res.status(200).json({ success: true, message: 'Remark deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting remark', error: error.message });
    }
};
