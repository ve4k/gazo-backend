const mongoose = require('mongoose')
const shortid = require('shortid')

const ImageSchema = mongoose.Schema({
    name: {
        type: String,
        default: shortid.generate
    },
    originalname: {
        type: String,
        require: true
    },
    path: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Image', ImageSchema)