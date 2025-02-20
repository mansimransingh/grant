const qs = require('qs');
const pkg = require('../package');

const defaults = (args = {}) => {
  return () => {
    let options = {
      method: 'GET',
      headers: {
        'user-agent': `simov/grant/${pkg.version}`,
        ...args.headers
      },
      ...args
    };
    return { options };
  };
};

const parse = async (res) => {
  let raw = await res.text();
  let body = raw;
  let contentType = res.headers.get('content-type') || '';

  if (/json|javascript/.test(contentType)) {
    try {
      body = JSON.parse(raw);
    } catch (err) {}
  } else if (/application\/x-www-form-urlencoded/.test(contentType)) {
    try {
      body = qs.parse(raw);
    } catch (err) {}
  } else {
    // Some providers return incorrect content-type (text/html, text/plain)
    try {
      body = JSON.parse(raw);
    } catch (err) {
      body = qs.parse(raw);
    }
  }

  log({ parse: { res, body } });

  return { res, body, raw };
};

const log = (data) => {
  if (process.env.DEBUG) {
    try {
      console.log(JSON.stringify(data, null, 2)); // Cloudflare Workers do not support require('request-logs')
    } catch (err) {}
  }
};

const request = async (url, options) => {
  let response = await fetch(url, options);
  return parse(response);
};

const client = {
  request,
  defaults,
  parse
};

module.exports = client;