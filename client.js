const request = require('request')
const querystring = require('querystring')

module.exports = function ({ endpoint, username, password }) {
  endpoint = endpoint || 'http://localhost:1337'

  return {
    getProduct,
    listProducts,
    createProduct,
    editProduct,
    deleteProduct,
    createOrder,
    listOrders
  }

  function getProduct (id, cb) {
    const url = `${endpoint}/products/${id}`
    getJSON(url, cb)
  }

  function listProducts (opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }

    const { offset = 0, limit = 25, tag } = opts
    const url = `${endpoint}/products?${querystring.stringify({
      offset,
      limit,
      tag
    })}`
    getJSON(url, cb)
  }

  function createProduct (product, cb) {
    const url = `${endpoint}/products`
    postJSON(url, product, cb)
  }

  function editProduct (id, changes, cb) {
    const url = `${endpoint}/products/${id}`
    putJSON(url, changes, cb)
  }

  function deleteProduct (id, cb) {
    const url = `${endpoint}/products/${id}`
    delJSON(url, cb)
  }

  function createOrder ({ products, username }, cb) {
    const url = `${endpoint}/orders`
    postJSON(url, { products, username }, cb)
  }

  function listOrders (opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }

    const { offset = 0, limit = 25, status, productId } = opts
    const url = `${endpoint}/orders?${querystring.stringify({
      offset,
      limit,
      status,
      productId
    })}`
    getJSON(url, cb)
  }

  function getJSON (url, cb) {
    request.get(url, { json: true }, handleResponse(cb))
  }

  function postJSON (url, data, cb) {
    request.post(url, { json: true, body: data }, handleResponse(cb))
  }

  function putJSON (url, data, cb) {
    request.put(url, { json: true, body: data }, handleResponse(cb))
  }

  function delJSON (url, cb) {
    request.delete(url, { json: true }, handleResponse(cb))
  }
}

function handleResponse (cb) {
  return function (err, res, body) {
    if (err) return cb(err)
    if (res.statusCode !== 200) {
      const defaultMsg = `Request Failed.\n Status Code: ${res.statusCode}`
      const serverMsg = (body || {}).error
      err = new Error(serverMsg || defaultMsg)
      err.statusCode = res.statusCode
      return cb(err)
    }
    cb(null, body)
  }
}
