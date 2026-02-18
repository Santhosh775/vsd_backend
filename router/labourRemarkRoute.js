const express = require('express');
const router = express.Router();
const labourRemarkController = require('../controller/labourRemarkController');

router.post('/', labourRemarkController.createRemark);
router.get('/', labourRemarkController.getAllRemarks);
router.get('/:id', labourRemarkController.getRemarkById);
router.get('/labour/:labour_id', labourRemarkController.getRemarksByLabourId);
router.put('/:id', labourRemarkController.updateRemark);
router.delete('/:id', labourRemarkController.deleteRemark);

module.exports = router;
