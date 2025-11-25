const express = require('express');
const router = express.Router();
const farmerController = require('../controller/farmerController');
const { validateFarmer, validateFarmerUpdate } = require('../validator/farmerValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadFarmer } = require('../middleware/upload');

// Create a new farmer (Admin only)
router.post('/create', 
    authMiddleware, 
    uploadFarmer.single('profile_image'),
    validateFarmer,
    farmerController.createFarmer
);

// Get all farmers (Admin only)
router.get('/list', 
    authMiddleware, 
    farmerController.getAllFarmers
);

// Get farmer by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    farmerController.getFarmerById
);

// Update farmer by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    uploadFarmer.single('profile_image'),
    validateFarmerUpdate,
    farmerController.updateFarmer
);

// Delete farmer by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    farmerController.deleteFarmer
);

// Search farmers (Admin only)
router.get('/search', 
    authMiddleware, 
    farmerController.searchFarmers
);

module.exports = router;