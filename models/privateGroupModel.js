const mongoose = require('mongoose');

const privateGroupSchema = mongoose.Schema({
    groupName: {
        type: String
    },
    pass: {
        type: String
    },
    participants: [String],
    admin: {
        type: String
    }
},{ timestamps: {
    createdAt: 'created_at' 
}});

module.exports = mongoose.model('PrivateGroup', privateGroupSchema);
