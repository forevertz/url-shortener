const { send, json } = require('micro')
const fetch = require('node-fetch')
const isURL = require('validator/lib/isURL')
const matches = require('validator/lib/matches')

const { addShortlink, getShortlink } = require('./shortlink')

const endpoints = {
  GET: {
    '/': {
      description: 'List all API endpoints',
      call: () => {
        const { name, version, description, repository, license } = require('../package.json')
        return { name, version, description, repository, license, endpoints }
      }
    },
    '/:shortlinkCode': {
      description: 'Redirect to link',
      call: async (req, res) => {
        try {
          if (req.url && matches(req.url, /^\/[a-zA-Z0-9_-]*$/i)) {
            const shortlinkCode = req.url.substr(1)
            const shortlink = await getShortlink(shortlinkCode)
            if (shortlink && shortlink.url) {
              if (shortlink.hook) {
                fetch(shortlink.hook, {
                  method: 'POST',
                  body: JSON.stringify({
                    shortlinkCode,
                    url: shortlink.url,
                    ip:
                      req.headers['x-real-ip'] ||
                      req.headers['x-forwarded-for'] ||
                      req.connection.remoteAddress,
                    ua: req.headers['user-agent'],
                    langs: req.headers['accept-language']
                  }),
                  headers: { 'Content-Type': 'application/json' }
                })
              }
              res.setHeader('Location', shortlink.url)
              return send(res, 302, `Redirecting to ${shortlink.url}`)
            }
          }
        } catch (error) {
          return send(res, 500, {
            success: false,
            error: 'Something went wrong, please retry later.'
          })
        }
        return send(res, 404, { success: false, error: 'Not found' })
      }
    }
  },
  POST: {
    '/shortlink': {
      description: 'Add a new shortlink',
      call: async (req, res) => {
        const { url, hook } = await json(req, { encoding: 'utf8' })
        if (!url || !isURL(url, { require_protocol: true, protocols: ['http', 'https'] })) {
          return send(res, 400, {
            success: false,
            error: 'Parameter `url` is required and should be an URL.'
          })
        }
        if (hook && !isURL(hook, { require_protocol: true, protocols: ['http', 'https'] })) {
          return send(res, 400, {
            success: false,
            error: 'Parameter `hook` should be an URL.'
          })
        }
        const DAY = 60 * 60 * 24
        const code = await addShortlink(url, { hook, expireIn: 90 * DAY })
        return code
          ? { code, link: `http://${req.headers['host']}/${code}` }
          : send(res, 500, { success: false, error: 'Something went wrong, please retry later.' })
      }
    }
  }
}

async function handleGet(req, res, pathname) {
  const DEFAULT_ROUTE = '/:shortlinkCode'
  const endpoint = endpoints.GET[pathname] ? pathname : DEFAULT_ROUTE
  return endpoints.GET[endpoint].call(req, res)
}

async function handlePost(req, res, pathname) {
  // Endpoint existance
  if (!endpoints.POST[pathname]) {
    return send(res, 404, { success: false, error: 'Not found' })
  }
  // JSON content type
  const acceptedContentTypes = ['application/json', 'application/json; charset=utf-8']
  if (!acceptedContentTypes.includes(req.headers['content-type'])) {
    return send(res, 400, {
      success: false,
      error: `Header "Content-Type" should be one of "${acceptedContentTypes.join('", "')}"`
    })
  }
  // Call endpoint
  return endpoints.POST[pathname].call(req, res)
}

module.exports = async (req, res) => {
  const pathname = req.url.split('?')[0]
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', ['Content-Type'].join(', '))

  return req.method === 'GET'
    ? handleGet(req, res, pathname)
    : req.method === 'POST'
      ? handlePost(req, res, pathname)
      : ''
}
