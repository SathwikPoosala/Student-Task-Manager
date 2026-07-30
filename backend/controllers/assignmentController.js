const Assignment = require('../models/assignments.js');

// post
const postassignment = async(req, res) => {
    try{
        const {name, priority, completed, duedate,} = req.body;
        if(!name || !priority || !completed || !duedate){
            res.status(400).json({ message: 'all feilds are required'});
        }

        const assignment = await Assignment.create({
            name,
            priority,
            completed,
            duedate
        });

        res.status(201).json({
            message: "Succesfully added assignment"

        });
    }
    catch(error){
        res.status(500).json({message : error.message});
    }
};

module.exports = {postassignment};