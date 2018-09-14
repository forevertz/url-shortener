const crypto = require('crypto')

const { insert, get } = require('./redis')

function generateShortCode(length) {
  return (
    crypto
      .randomBytes(length)
      .toString('base64')
      // urlsafe
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substr(0, length)
  )
}

async function addShortlink(url, { hook = null, expireIn = false } = {}, codeLength = 6) {
  try {
    const code = generateShortCode(codeLength)
    await insert(
      `shortlink:${code}`,
      JSON.stringify({ url, hook }),
      expireIn ? ['EX', expireIn] : []
    )
    return code
  } catch (error) {
    return codeLength < 10 ? addShortlink(url, { hook, expireIn }, codeLength + 1) : null
  }
}

async function getShortlink(code) {
  return JSON.parse(await get(`shortlink:${code}`))
}

module.exports = {
  addShortlink,
  getShortlink
}
