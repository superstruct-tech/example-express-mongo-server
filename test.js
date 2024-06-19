const tape = require('tape')
const { MongoMemoryServer } = require('mongodb-memory-server')

process.env.NODE_ENV = 'test'

const mongoServer = getMongoSync()
process.env.MONGO_URI = process.env.MONGO_URI || mongoServer.getUri()
const port = (process.env.PORT = process.env.PORT || require('get-port-sync')())
const endpoint = `http://localhost:${port}`

const db = require('./db')
const server = require('./server')
const Client = require('./client')
const Products = require('./models/products')

const allProducts = require('./products.json')

const client = Client({
  endpoint
})

tape('setup', async function (t) {
  for (let i = 0; i < allProducts.length; i++) {
    allProducts[i].description =
      allProducts[i].description ||
      allProducts[i].alt_description ||
      'test description'
    await Products.create(allProducts[i])
  }
  t.end()
})

tape('should list all products', function (t) {
  client.listProducts(function (err, products) {
    if (err) t.error('should not error')

    t.equal(products.length, 25, 'number of products should match')
    const product = products[20]

    t.equal(product._id, 'cjv32mizj000kc9gl2r2lgj1r', 'id should match')
    t.equal(
      product.description,
      'Oculus NYC facade',
      'description should match'
    )

    t.end()
  })
})

tape('should list all products with limit', function (t) {
  client.listProducts({ limit: 5 }, function (err, products) {
    if (err) t.error('should not error')

    t.equal(products.length, 5, 'number of products should match')
    const product = products[4]

    t.equal(product._id, 'cjv32mizj0004c9glejahg9i4', 'id should match')
    t.equal(
      product.description,
      'blue and black abstract artwork',
      'description should match'
    )

    t.end()
  })
})

tape('should list all products with offset', function (t) {
  client.listProducts({ offset: 4, limit: 5 }, function (err, products) {
    if (err) t.error('should not error')

    t.equal(products.length, 5, 'number of products should match')
    const product = products[0]

    t.equal(product._id, 'cjv32mizj0004c9glejahg9i4', 'id should match')
    t.equal(
      product.description,
      'blue and black abstract artwork',
      'description should match'
    )

    t.end()
  })
})

tape('should list all products with filter', function (t) {
  client.listProducts({ tag: 'dog', limit: 2 }, function (err, products) {
    if (err) t.error('should not error')

    t.equal(products.length, 2, 'number of products should match')

    const tagSets = products.map(p => p.tags)
    tagSets.forEach(ts =>
      t.ok(ts.indexOf('dog') > -1, 'product should have selected tag')
    )

    t.end()
  })
})

tape('should get single product', function (t) {
  client.getProduct('cjv32mizj0004c9glejahg9i4', function (err, product) {
    if (err) t.error('should not error')

    t.equal(product._id, 'cjv32mizj0004c9glejahg9i4', 'id should match')
    t.equal(
      product.description,
      'blue and black abstract artwork',
      'description should match'
    )

    t.end()
  })
})

tape('should get error for missing single product', function (t) {
  client.getProduct('doesntexist', function (err, product) {
    t.equal(err.statusCode, 404, 'should get 404')
    t.equal(err.message, 'Not Found', 'should get Not Found')

    t.end()
  })
})

tape('should create new product', function (t) {
  const testProduct = {
    description: 'test description',
    imgThumb:
      'https://www.newline.co/fullstack-react/assets/images/fullstack-react-hero-book.png',
    img:
      'https://www.newline.co/fullstack-react/assets/images/fullstack-react-hero-book.png',
    link: 'https://fullstackreact.com',
    userId: 'fsreact',
    userName: 'David Guttman',
    userLink: 'https://fullstackreact.com',
    tags: ['react', 'javascript']
  }

  client.createProduct(testProduct, function (err, product) {
    if (err) t.error('should not error')

    hasSubset(t, product, testProduct)

    t.ok(product._id, 'should have product id')
    client.getProduct(product._id, function (err, remoteProduct) {
      if (err) t.error('should not error')

      t.equal(
        remoteProduct.description,
        testProduct.description,
        'description should match'
      )
      t.equal(
        remoteProduct.userName,
        testProduct.userName,
        'userName should match'
      )
      t.end()
    })
  })
})

tape('should edit product', function (t) {
  const productId = 'cjv32mizj0004c9glejahg9i4'
  const changes = {
    userName: 'FS Test Bot'
  }

  client.editProduct(productId, changes, function (err, product) {
    if (err) t.error('should not error')

    t.equal(product.userName, changes.userName, 'userName should match')
    t.equal(
      product.description,
      'blue and black abstract artwork',
      'description should stay the same'
    )
    t.end()
  })
})

tape('should not edit product with invalid userName', function (t) {
  const productId = 'cjv32mizj0004c9glejahg9i4'
  const changes = {
    userName: null
  }

  client.editProduct(productId, changes, function (err, product) {
    t.equal(err.statusCode, 400, 'should get 400 status')
    t.end()
  })
})

tape('should not edit product with invalid url', function (t) {
  const productId = 'cjv32mizj0004c9glejahg9i4'
  const changes = {
    img: 'http//invalid.url'
  }

  client.editProduct(productId, changes, function (err, product) {
    t.equal(err.statusCode, 400, 'should get 400 status')
    t.end()
  })
})

tape('should delete product', function (t) {
  const productId = 'cjv32mizj0004c9glejahg9i4'

  client.deleteProduct(productId, function (err, status) {
    if (err) t.error('should not error')

    t.ok(status.success, 'delete should be successful')

    client.getProduct(productId, function (err, product) {
      t.ok(err, 'should have error')
      t.end()
    })
  })
})

tape('should create order', function (t) {
  const userClient = Client({
    endpoint
  })

  const productId = 'cjv32mizj000kc9gl2r2lgj1r'

  const orderProps = {
    products: [productId]
  }

  userClient.createOrder(orderProps, function (err, order) {
    if (err) t.error('should not error')

    t.ok(order._id, 'should have order id')
    t.equal(
      order.products[0].description,
      'Oculus NYC facade',
      'should have product description'
    )

    t.equal(order.status, 'CREATED', 'should have status')

    t.end()
  })
})

tape('should list orders as user', function (t) {
  const productId = 'cjv32mizj000kc9gl2r2lgj1r'
  const opts = { status: 'CREATED', productId }
  const client = Client({
    endpoint
  })
  client.listOrders(opts, function (err, orders) {
    if (err) t.error('should not error')

    const [order] = orders

    t.ok(order._id, 'should have order id')
    t.equal(
      order.products[0].description,
      'Oculus NYC facade',
      'should have product description'
    )
    t.equal(order.status, 'CREATED', 'should have status')

    t.end()
  })
})

tape('should list orders as admin', function (t) {
  const opts = { status: 'CREATED' }
  client.listOrders(opts, function (err, orders) {
    if (err) t.error('should not error')

    const [order] = orders

    t.ok(order._id, 'should have order id')
    t.equal(
      order.products[0].description,
      'Oculus NYC facade',
      'should have product description'
    )
    t.equal(order.status, 'CREATED', 'should have status')

    t.end()
  })
})

tape('cleanup', function (t) {
  server.close()
  db.disconnect()
  mongoServer.stop()
  t.end()
})

function getMongoSync () {
  let server
  MongoMemoryServer.create().then(m => {
    server = m
  })
  require('deasync').loopWhile(() => !server)
  return server
}

function hasSubset (t, superset, subset) {
  Object.keys(subset).forEach(function (key) {
    t.deepEqual(superset[key], subset[key], `${key} should match`)
  })
}
