const express = require('express');
const router = express.Router();
const thirdPartyController = require('../controller/thirdPartyController');
const { validateThirdParty, validateThirdPartyUpdate } = require('../validator/thirdPartyValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadThirdParty } = require('../middleware/upload');

// Create a new third party (Admin only)
router.post('/create', 
    authMiddleware, 
    uploadThirdParty.single('profile_image'),
    validateThirdParty,
    thirdPartyController.createThirdParty
);

// Get all third parties (Admin only)
router.get('/list', 
    authMiddleware, 
    thirdPartyController.getAllThirdParties
);

// Get third party by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    thirdPartyController.getThirdPartyById
);

// Update third party by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    uploadThirdParty.single('profile_image'),
    validateThirdPartyUpdate,
    thirdPartyController.updateThirdParty
);

// Delete third party by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    thirdPartyController.deleteThirdParty
);

// Search third parties (Admin only)
router.get('/search', 
    authMiddleware, 
    thirdPartyController.searchThirdParties
);

module.exports = router;