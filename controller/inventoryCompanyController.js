const InventoryCompany = require('../model/inventoryCompanyModel');
const InventoryStock = require('../model/inventoryStockModel');
const { sequelize } = require('../config/db');

exports.createCompany = async (req, res) => {
    try {
        const { name, payment_status } = req.body;
        
        const newCompany = await InventoryCompany.create({
            name,
            payment_status: payment_status || 'unpaid'
        });
        
        res.status(201).json({
            success: true,
            message: "Company created successfully",
            data: newCompany
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create company",
            error: error.message 
        });
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await InventoryCompany.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        // Calculate totals for each company
        const companiesWithTotals = await Promise.all(companies.map(async (company) => {
            const result = await InventoryStock.findOne({
                where: { company_id: company.id },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('total_with_gst')), 'total_amount']
                ],
                raw: true
            });
            
            const totalAmount = parseFloat(result?.total_amount || 0);
            const paidAmount = parseFloat(company.paid_amount || 0);
            const pendingAmount = totalAmount - paidAmount;
            
            return {
                ...company.toJSON(),
                total_amount: totalAmount.toFixed(2),
                pending_amount: pendingAmount.toFixed(2)
            };
        }));
        
        res.status(200).json({
            success: true,
            data: companiesWithTotals
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch companies",
            error: error.message 
        });
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await InventoryCompany.findByPk(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: company
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch company",
            error: error.message 
        });
    }
};

exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, payment_status } = req.body;
        
        const company = await InventoryCompany.findByPk(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }
        
        await company.update({
            name,
            payment_status
        });
        
        res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: company
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update company",
            error: error.message 
        });
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await InventoryCompany.findByPk(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }
        
        await company.destroy();
        
        res.status(200).json({
            success: true,
            message: "Company deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete company",
            error: error.message 
        });
    }
};
