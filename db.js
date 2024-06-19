const mongoose = require('mongoose')
const config = require('./config')

const { dbName, connectionString } = config.mongo

mongoose.connect(connectionString, { dbName })

mongoose.checkHealth = async function () {
  const time = Date.now()
  const { db } = mongoose.connection
  const collection = db.collection('healthcheck')

  const query = { _id: 'heartbeat' }
  const value = { $set: { time } }
  await collection.updateOne(query, value, { upsert: true })

  const found = await collection.findOne({ time: { $gte: time } })
  if (!found) throw new Error('DB Healthcheck Failed')
  return !!found
}

module.exports = mongoose
