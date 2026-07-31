const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: [true, 'name is required'],
            trim: true
        },
        priority:{
            type: Number,
            required: [true, 'priority is required'],
            min: 1,
            max: 3
        },
        completed:{
            type: Boolean,
            required: [true, 'completed is required'],
        },
        duedate:{
            type: Date,
            required: [true, 'duedate is required'],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps : true,
    }
);

module.exports = mongoose.model('Assignment', assignmentSchema);