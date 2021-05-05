/*
write your JS like this:
(arg1, arg2) => { ... }
not like this:
function (arg1, arg2) { ... }
*/
const express = require('express')
const mongoose = require('mongoose')
const rateLimiter = require('express-rate-limit')
const userAgent = require('express-useragent')
const redis = require('redis')
const fs = require('fs')
const Image = require('./models/Image')

const auth_config = require('./configs/auth.config.json')
const gazo_config = require('./configs/gazo.config.json')

const app = express()
const client = redis.createClient()
module.exports.client = client
const rateLimit = rateLimiter({
    max: gazo_config.rate_limiting.requests,
    windowMs: gazo_config.rate_limiting.time * 1000,
    handler: (req, res) => { res.status(429); res.send("You are rate limited.") }
})

if(gazo_config.purging.logs) {
    const logs = fs.readdirSync("./logs")
    for (let i = 0; i < logs.length; i++) {
        const content = logs[i]
        fs.unlinkSync("./logs/" + content)
    }
}

if(gazo_config.logging) {
    const logDate = new Date().getFullYear() + "-" + new Date().getMonth() + "-" + new Date().getDay() + "-" + new Date().getHours() + "." + new Date().getMinutes() + "." + new Date().getSeconds() + "." + new Date().getMilliseconds()
    const currLogFile = logDate + '-gazo-log.txt'
    fs.writeFile('./logs/' + currLogFile, "--- gazo.host backend log, time is " + logDate + " ---\n", (err) => { if (err) throw err } )
    console.log("Current log file can be found in ./logs/" + currLogFile)
}

if(gazo_config.purging.redis) {
    client.flushdb((err) => { if(err) { console.log("Error purging redis."); throw err } console.log("Cleared redis database.") })
}

if(gazo_config.purging.mongodb) {
    Image.deleteMany({}, (err) => { if(err) { console.log("Error purging mongodb."); throw err } console.log("Cleared MongoDB database.") })
}

if(gazo_config.purging.uploads) {
    const uploads = fs.readdirSync("./uploads")
    for (let i = 0; i < uploads.length; i++) {
        const content = uploads[i]
        if(content != "NOTE.md")
            fs.unlinkSync("./uploads/" + content)
    }
}

app.use(userAgent.express())
client.on("error", function(error) {
    console.error(error)
});

if (gazo_config.rate_limiting.enabled) {
    app.use(rateLimit)
    console.log('Enabled rate limiting.')
} else
    console.log('Rate limiting is disabled.')

app.get('/', (req, res) => {
    res.send("hi")
})

// routes
const imageRoute = require('./routes/image')
const authRoute = require('./routes/auth')

app.use('/image', imageRoute)
app.use('/user/auth', authRoute)

// mongodb | Make sure to URL encode your password in the database connection string.
mongoose.connect(auth_config.mongo.database_connection_string, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log("Connected to MongoDB database.")
})

// listening
app.listen(gazo_config.port, console.log("Started server at " + gazo_config.server_location))
