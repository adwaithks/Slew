const mongoose = require('mongoose');

const publicGroupSchema = mongoose.Schema({
    groupName: {
        type: String
    },
    participants: [String],
    admin: {
        type: String
    }
},{ timestamps: {
    createdAt: 'created_at' 
}});

module.exports = mongoose.model('PublicGroup', publicGroupSchema);
