const express = require('express');
const {
	postassignment,
	getAssignments,
	getAssignmentById,
	updateAssignment,
	deleteAssignment,
} = require('../controllers/assignmentController.js');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
	.get(getAssignments)
	.post(postassignment);

router.route('/:id')
	.get(getAssignmentById)
	.put(updateAssignment)
	.delete(deleteAssignment);

module.exports = router;