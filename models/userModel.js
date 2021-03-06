const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    imageUrl: {
        type: String
    },
    groups: [{
        type: mongoose.Types.ObjectId,
        ref: 'PrivateGroup'
    }],
    publicGroups: [{
        type: mongoose.Types.ObjectId,
        ref: 'PublicGroup'
    }]
},{ timestamps: {
    createdAt: 'created_at' 
}});

module.exports = mongoose.model('User', userSchema);
