const Customer = require('../model/customerModel');

exports.createCustomer = async (req, res) => {
    try {
        const { customer_name } = req.body;
        
        const newCustomer = await Customer.create({ customer_name });
        
        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: newCustomer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create customer",
            error: error.message 
        });
    }
};

exports.getAllCustomers = async (req, res) => {
    try {
        const { page, limit, offset } = req.pagination;
        
        const { count, rows } = await Customer.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch customers",
            error: error.message 
        });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByPk(id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch customer",
            error: error.message 
        });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name } = req.body;
        
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }
        
        await customer.update({ customer_name });
        
        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update customer",
            error: error.message 
        });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByPk(id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }
        
        await customer.destroy();
        
        res.status(200).json({
            success: true,
            message: "Customer deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete customer",
            error: error.message 
        });
    }
};
