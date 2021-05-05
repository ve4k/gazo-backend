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
