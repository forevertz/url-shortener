const redis = require('redis')

const client = redis.createClient(process.env.REDIS)

function get(key) {
  return new Promise((resolve, reject) => {
    client.get(key, (error, result) => (error ? reject(error) : resolve(result)))
  })
}

function insert(key, value, options = []) {
  return new Promise((resolve, reject) => {
    // Set only if key does not exist
    client.set(key, value, 'NX', ...options, (error, result) => {
      error
        ? reject(error)
        : result === null
          ? reject(new Error('key already exists'))
          : resolve(true)
    })
  })
}

module.exports = {
  client,
  get,
  insert
}
