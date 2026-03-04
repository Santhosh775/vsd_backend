const Customer = require('../model/customerModel');

const ALLOWED_CUSTOMER_CATEGORIES = ['LOCAL GRADE ORDER', 'BOX ORDER', 'FLOWER ORDER'];

exports.createCustomer = async (req, res) => {
    try {
        const { customer_name, customer_category } = req.body;

        if (customer_category && !ALLOWED_CUSTOMER_CATEGORIES.includes(customer_category)) {
            return res.status(400).json({
                success: false,
                message: 'Customer category must be one of: LOCAL GRADE ORDER, BOX ORDER, FLOWER ORDER'
            });
        }
        
        const newCustomer = await Customer.create({ customer_name, customer_category });
        
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

// Get customers by category
exports.getCustomersByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const customers = await Customer.findAll({
            where: { customer_category: category },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers by category",
            error: error.message
        });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, customer_category } = req.body;

        if (customer_category !== undefined && customer_category !== null && customer_category !== '' && !ALLOWED_CUSTOMER_CATEGORIES.includes(customer_category)) {
            return res.status(400).json({
                success: false,
                message: 'Customer category must be one of: LOCAL GRADE ORDER, BOX ORDER, FLOWER ORDER'
            });
        }
        
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }
        
        await customer.update({ customer_name, customer_category });
        
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
