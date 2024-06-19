require('dotenv').config()

module.exports = {
  mongo: {
    connectionString: process.env.MONGO_URI || 'mongodb://localhost:27017/',
    dbName: process.env.MONGO_DB_NAME || 'example'
  },
  auth: {
    server: process.env.AUTHENTIC_SERVER || 'http://localhost:3001'
  }
}
