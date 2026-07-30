const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        name:{
            required: [true, 'name is required'],
            type: String,
            trim: true
        },
        priority:{
            required: [true, 'priority is required'],
            type: Number,
            trim: true

        },
        completed:{
            required: [true, 'completed is required'],
            type: Boolean
        },
        duedate:{
            required: [true, 'duedate is required'],
            type: Date
        }
    },
    {
        timestamps : true,
    }
);

module.exports = mongoose.model('Assignment', assignmentSchema);