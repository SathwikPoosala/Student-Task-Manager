const Assignment = require('../models/assignments.js');

const todayString = new Date().toISOString().split('T')[0];

const isPastDate = (dateValue) => {
    return typeof dateValue === 'string' && dateValue < todayString;
};

const postassignment = async(req, res) => {
    try{
        const {name, priority, completed, duedate} = req.body;

        if (!name || priority === undefined || completed === undefined || !duedate) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (isPastDate(duedate)) {
            return res.status(400).json({ message: 'Due date cannot be in the past' });
        }

        const assignment = await Assignment.create({
            name,
            priority,
            completed,
            duedate,
            user: req.user._id,
        });

        res.status(201).json({
            message: 'Successfully added assignment',
            assignment,
        });
    }
    catch(error){
        res.status(500).json({message : error.message});
    }
};

const getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({ assignments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.status(200).json({ assignment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const { name, priority, completed, duedate } = req.body;

        if (name !== undefined) assignment.name = name;
        if (priority !== undefined) assignment.priority = priority;
        if (completed !== undefined) assignment.completed = completed;
        if (duedate !== undefined) {
            if (isPastDate(duedate)) {
                return res.status(400).json({ message: 'Due date cannot be in the past' });
            }

            assignment.duedate = duedate;
        }

        await assignment.save();

        res.status(200).json({
            message: 'Assignment updated successfully',
            assignment,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    postassignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
};