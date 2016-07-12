const request = require('request-promise')
const cheerio = require('cheerio')
const URI = require('urijs')
const parseXml = require('xml2js').parseString
const XMLprocessors = require('xml2js/lib/processors')
const Promise = require('bluebird')

const isStatusCode = code => response => {
  if (response.statusCode === code) return response
  else throw Error(`response status code returned is ${response.statusCode}, not status code ${code}`)
}

const getCasLoginPage = url => request({
  method: 'GET',
  uri: url,
  resolveWithFullResponse: true
})

const postCasLoginPage = (url, body) => request({
  // simple is FALSE because anything other than a 2xx response would be sent to error callback
  simple: false,
  method: 'POST',
  uri: url,
  headers: {
    'User-Agent': 'request-promise/3.0.0',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  // body is used here instead of form due to encoding errors
  body,
  resolveWithFullResponse: true
})

const serializeMap = map => {
  var str = [];
  map.forEach((value, key) => {
    str.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
  })
  return str.join('&')
}

const getCasValidation = validateUrl => response => {
  const location = response.headers.location
  const serviceTicket = new URI(location).search(true).ticket

  return request({
    method: 'GET',
    uri: validateUrl + '&ticket=' + serviceTicket,
    resolveWithFullResponse: true
  })
}

const serialize = (username, password) => $ => {
  const lt = $('input[name=lt]').val()
  const execution = $('input[name=execution]').val()

  const loginBody = new Map()
  loginBody.set('username', username)
  loginBody.set('password', password)
  loginBody.set('lt', lt)
  loginBody.set('execution', execution)
  loginBody.set('_eventId', 'submit')
  loginBody.set('submit', 'LOGIN')

  return serializeMap(loginBody)
}

const parseXmlResponse = response => new Promise((resolve, reject) => {
  const options = {
    trim: true,
    normalize: true,
    explicitArray: false,
    tagNameProcessors: [XMLprocessors.normalize, XMLprocessors.stripPrefix]
  }
  parseXml(response.body, options, (err, result) => {
    if (err) reject(Error(err))
    if (!result.serviceresponse.authenticationsuccess)
      reject(Error('cas authentication was not successful'))

    resolve(result.serviceresponse.authenticationsuccess)
  })
})

module.exports = options => {
  const CAS_BASE_URL = options.casBaseUrl
  const SERVICE_URL = options.serviceUrl
  const USERNAME = options.username
  const PASSWORD = options.password

  const CAS_LOGIN_URL = CAS_BASE_URL + '/login'
  const CAS_VALIDATE_URL = CAS_BASE_URL + '/p3/serviceValidate'
  const CAS_LOGIN_FULL_URL = CAS_LOGIN_URL + '?service=' + encodeURIComponent(SERVICE_URL)
  const CAS_VALIDATE_FULL_URL = CAS_VALIDATE_URL + '?service=' + encodeURIComponent(SERVICE_URL)

  return getCasLoginPage(CAS_LOGIN_FULL_URL)
    .then(isStatusCode(200))
    .then(response => cheerio.load(response.body))
    .then(serialize(USERNAME, PASSWORD))
    .then(loginBody => postCasLoginPage(CAS_LOGIN_FULL_URL, loginBody))
    .then(isStatusCode(302))
    .then(getCasValidation(CAS_VALIDATE_FULL_URL))
    .then(parseXmlResponse)
}
