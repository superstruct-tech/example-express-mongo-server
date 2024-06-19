const healthpoint = require('healthpoint')

const db = require('./db')
const Orders = require('./models/orders')
const Products = require('./models/products')
const autoCatch = require('./lib/auto-catch')
const { version } = require('./package.json')

const hp = healthpoint({ version }, function (cb) {
  db.checkHealth()
    .catch(cb)
    .then(isHealthy => {
      if (isHealthy) return cb(null, { status: 'UP' })
      cb(new Error('Database connectivity issue'))
    })
})

module.exports = autoCatch({
  checkHealth,
  getProduct,
  listProducts,
  createProduct,
  editProduct,
  deleteProduct,
  createOrder,
  listOrders
})

async function checkHealth (req, res, next) {
  return hp(req, res)
}

async function getProduct (req, res, next) {
  const { id } = req.params

  const product = await Products.get(id)
  if (!product) return next()

  res.json(product)
}

async function listProducts (req, res, next) {
  const { offset = 0, limit = 25, tag } = req.query

  const products = await Products.list({
    offset: Number(offset),
    limit: Number(limit),
    tag
  })

  res.json(products)
}

async function createProduct (req, res, next) {
  if (!req.user) return forbidden(next)

  const product = await Products.create(req.body)
  res.json(product)
}

async function editProduct (req, res, next) {
  if (!req.user) return forbidden(next)

  const change = req.body
  const product = await Products.edit(req.params.id, change)

  res.json(product)
}

async function deleteProduct (req, res, next) {
  if (!req.user) return forbidden(next)

  await Products.remove(req.params.id)
  res.json({ success: true })
}

async function createOrder (req, res, next) {
  const fields = req.body
  if (req.user) fields.username = req.user.email

  const order = await Orders.create(fields)
  res.json(order)
}

async function listOrders (req, res, next) {
  const { offset = 0, limit = 25, productId, status } = req.query

  const opts = {
    offset: Number(offset),
    limit: Number(limit),
    productId,
    status
  }

  if (req.user) opts.username = req.user.email

  const orders = await Orders.list(opts)

  res.json(orders)
}

function forbidden (next) {
  const err = new Error('Forbidden')
  err.statusCode = 403
  return next(err)
}
