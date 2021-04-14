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
    }
},{ timestamps: {
    createdAt: 'created_at' 
}});

module.exports = mongoose.model('User', userSchema);
