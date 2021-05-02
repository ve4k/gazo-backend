// Styling "documentation" in how-to-write-your-code.md
const express = require('express')
const mongoose = require('mongoose')
const rateLimiter = require('express-rate-limit')
const userAgent = require('express-useragent')

const auth_config = require('./configs/auth.config.json')
const gazo_config = require('./configs/gazo.config.json')

const app = express()

const rateLimit = rateLimiter({
    max: gazo_config.rate_limiting.requests,
    windowMs: gazo_config.rate_limiting.time * 1000,
    handler: (req, res) => { res.status(429); res.send("get rate limited noob")}
})

app.use(userAgent.express())

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