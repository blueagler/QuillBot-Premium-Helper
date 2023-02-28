chrome = chrome ?? browser;

async function run(promises) {
  const results = [];
  const errors = [];

  setTimeout(() => this.sendResponse({
    success: false,
    error: 'Timeout'
  }), 10000);

  for (const promise of promises) {
    try {
      results.push(await promise);
    } catch (e) {
      errors.push(e);
      console.log(e);
    }
  }

  const response = {};

  if (errors.length > 0) {
    if (errors.length === 1) {
      response.error = errors[0];
    } else {
      response.errors = errors;
    }
    response.success = false;
  } else {
    if (results.length === 1) {
      response.result = results[0];
    } else {
      response.results = results;
    }
    response.success = true;
  }
  this.sendResponse(response);
}

async function proxyFetch() {
  const { url, config } = this.params;
  const result = await (await fetch(url, config)).text();
  return result;
}

async function getCookies() {
  return [
    ...await chrome.cookies.getAll({ domain: '.quillbot.com' }),
    ...await chrome.cookies.getAll({ domain: 'quillbot.com' })
  ]
}

async function generateCookie(token) {
  return encodeURIComponent((await getCookies())
    .map((cookie) => {
      switch (cookie.name) {
        case 'useridtoken':
          cookie.value = token;
          break;
        default:
          break;
      }
      return `${cookie.name}=${cookie.value};`
    })
    .join(''))
}

async function setTokenHeader() {
  const { token, url } = this.params;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1], addRules: [{
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            "header": "Cookie",
            "operation": "set",
            "value": await generateCookie(token)
          },
          {
            "header": "useridtoken",
            "operation": "set",
            "value": token
          }
        ]
      },
      condition: {
        resourceTypes: ['xmlhttprequest'],
        urlFilter: url
      },
      id: 1,
      priority: 1
    }]
  });
  return true;
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const { method, params } = message;
  this.sender = sender;
  this.sendResponse = sendResponse;
  this.params = params;

  switch (method) {
    case 'proxyFetch':
      run.call(this, [proxyFetch.call(this)]);
      return true;
    case 'setTokenHeader':
      run.call(this, [setTokenHeader.call(this)]);
      return true;
  }
  sendResponse({
    success: false,
    error: 'Unknown method'
  })
});