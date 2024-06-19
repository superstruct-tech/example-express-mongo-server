const Authentic = require('authentic-service')
const config = require('./config')

const auth = Authentic({
  server: config.auth.server
})

module.exports = {
  ensureUser: process.env.NODE_ENV === 'test' ? ensureUserTest : ensureUser
}

function ensureUser (req, res, next) {
  auth(req, res, function (err, authData) {
    if (err) return next(err)
    if (!authData || !authData.email) {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      return next(err)
    }

    req.user = authData
    next()
  })
}

function ensureUserTest (req, res, next) {
  req.user = { email: 'test@test.com' }
  next()
}
