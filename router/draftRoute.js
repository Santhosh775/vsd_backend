const express = require('express');
const router = express.Router();
const { createDraft, getAllDrafts, getDraftById, updateDraft, deleteDraft } = require('../controller/draftController');

// Create a new draft
router.post('/create', createDraft);

// Get all drafts
router.get('/list', getAllDrafts);

// Get draft by ID
router.get('/:id', getDraftById);

// Update draft
router.put('/:id', updateDraft);

// Delete draft
router.delete('/:id', deleteDraft);

module.exports = router;