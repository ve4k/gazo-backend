const express = require('express')
const multer = require('multer')
const fs = require('fs')
const Image = require('../models/Image')
const gazo_config = require('../configs/gazo.config.json')
const mime = require('mime-types')
const redis = require('redis')
const client = require('../index').client

const getDirSize = function(dirPath) {
    files = fs.readdirSync(dirPath)
    dirSize = 0
    files.forEach(() => {
        dirSize++
    })
    console.log(dirSize)
    return dirSize
 }

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().getTime() + file.originalname);
    }
})

const upload = multer({ 
    storage: storage,
    limits: {
        fieldSize: 1024*1024*4
    }
})

const router = express.Router()

router.get('/', (req, res) => {
    res.send('gazo.host API / backend : Images')
})

router.get('/:name', (req, res) => {
    const name = req.params.name
    client.get(name, function(err, data) {
        console.log('data: ' + data)
        if(err) console.error(err)
        if(data != null)  {res.send(data);return}
    })
    Image.findOne({ name: name }, (err, docs) => {
        if(err) {
            console.log(err)
            return err
        }
        res.contentType(mime.lookup(docs.path.split('.')[docs.path.split('.').length - 1]))
        res.send(fs.readFileSync("./uploads/" + docs.path))
    })
})

function ensureUploadAuthenticated(req, res, next) {
    const header = req.header('gazo-auth-v1-string')
    if(header === 'accepted')
        return next()
    res.status(403)
    res.send('Not authorized')
}

router.post('/new', ensureUploadAuthenticated, upload.single('image'), (req, res) => {
    if(req.file === null) {
        res.status(400)
        res.send('No image')
    }
    if(req.file.filename === null) {
        res.status(400)
        res.send('No image')
    }
    const image = new Image;
    image.path = req.file.filename
    image.save((err, img) => {
        if(err) {
            res.status(500)
            res.send("gazo.host error")
            return
        }
        if(req.useragent.source.startsWith('ShareX')) {
            res.json({ "success": true, "url": gazo_config.server_location + "/image/" + img.name })
            console.log(req.file)
            client.set(img.name, fs.readFileSync(req.file.path), function(callback){console.log(callback)})
        } else {
            res.send(gazo_config.server_location + "/image/" + img.name)
        }
    })
})

module.exports = router