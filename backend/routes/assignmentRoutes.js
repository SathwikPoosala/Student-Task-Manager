const express = require('express');
const {postassignment} = require('../controllers/assignmentController.js');

const router = express.Router();

router.post('/create', postassignment);

module.exports = router;