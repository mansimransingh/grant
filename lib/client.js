const qs = require('qs');
const pkg = require('../package');
var oauth = require('request-oauth')

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
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {}
  }
};

const requestToFetchOptions = (requestOptions) => {
  const {
    method = 'GET',
    headers = {},
    body,
    json,
    form,
    qs,
    timeout,
    followRedirect = true,
    agent,
  } = requestOptions;

  let fetchOptions = {
    method,
    headers: { ...headers },
    redirect: followRedirect ? 'follow' : 'manual',
  };

  if (json) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  } else if (form) {
    fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    fetchOptions.body = new URLSearchParams(form).toString();
  } else if (body) {
    fetchOptions.body = body;
  }

  let url = requestOptions.uri || requestOptions.url;
  if (qs && typeof qs === 'object') {
    const queryString = new URLSearchParams(qs).toString();
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  if (timeout) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;
  }

  return { url, fetchOptions };
};

const request = async (options) => {
  const { url, fetchOptions } = requestToFetchOptions(defaults(options))
  let response = await fetch(url, fetchOptions);
  return parse(response);
};

module.exports = request;