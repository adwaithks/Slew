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
    },
    chats: [{
        newComer: {
            type: Boolean
        },
        exitmsg: {
            type: Boolean
        },
        chunkName: {
            type: String
        },
        audioMsg: {
            type: Boolean
        },
        user: {
            type: String
        },
        message: {
            type: String
        },
        email: {
            type: String
        },
        time: {
            type: String
        },
        imageUrl: {
            type: String
        }
    }]
},{ timestamps: {
    createdAt: 'created_at' 
}});

module.exports = mongoose.model('PrivateGroup', privateGroupSchema);
