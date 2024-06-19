const cuid = require('cuid')

const db = require('../db')

const Order = db.model('Order', {
  _id: { type: String, default: cuid },
  username: { type: String, required: true, index: true },
  products: [
    {
      type: String,
      ref: 'Product',
      index: true,
      required: true
    }
  ],
  status: {
    type: String,
    index: true,
    default: 'CREATED',
    enum: ['CREATED', 'PENDING', 'COMPLETED']
  }
})

module.exports = {
  get,
  list,
  create,
  edit,
  remove,
  model: Order
}

async function list (opts = {}) {
  const { offset = 0, limit = 25, username, productId, status } = opts

  const query = {}
  if (username) query.username = username
  if (productId) query.products = productId
  if (status) query.status = status

  const orders = await Order.find(query)
    .sort({ _id: 1 })
    .skip(offset)
    .limit(limit)
    .populate('products')
    .exec()

  return orders
}

async function get (_id) {
  const order = await Order.findById(_id)
    .populate('products')
    .exec()
  return order
}

async function create (fields) {
  const order = new Order(fields)
  await order.save()
  return order.populate('products') // Correct usage of populate without exec()
}

async function edit (_id, change) {
  const order = await get({ _id })
  Object.keys(change).forEach(function (key) {
    order[key] = change[key]
  })
  await order.save()
  return order
}

async function remove (_id) {
  await Order.deleteOne({ _id })
}
