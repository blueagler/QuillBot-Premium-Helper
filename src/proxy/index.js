import { openRules, sendRules } from './rules';
const originalXhrOpen = XMLHttpRequest.prototype.open;
const originalXhrSend = XMLHttpRequest.prototype.send;

function modifyHandler(rule) {
  if (rule.response) {
    switch (rule.response.type) {
      case 'override':
        Object.defineProperty(this, "responseText", {
          get: () => rule.response.override,
        });
        Object.defineProperty(this, "status", {
          get: () => 200,
        });
        rule.drop = true;
        break;
      case 'handler':
        Object.defineProperty(this, "responseText", {
          get: () => rule.response.handler.call(this),
        });
        Object.defineProperty(this, "status", {
          get: () => 200,
        });
        rule.drop = true;
        break;
    }
  }
  if (rule.onErrorHandler) {
    this.addEventListener('error', rule.onErrorHandler);
  }
  if (rule.onLoadHandler) {
    this.addEventListener('readystatechange', () => {
      if (this.readyState === this.DONE) {
        rule.onLoadHandler.call(this);
      }
    });
  }
  if (rule.drop) {
    Object.defineProperty(this, "send", {
      get: () => () => { },
    });
    Object.defineProperty(this, "setRequestHeader", {
      get: () => () => { },
    });
    Object.defineProperty(this, "readyState", {
      get: () => this.DONE,
    });
    this.dispatchEvent(new Event('readystatechange'));
    return 'abort'
  }
}

export function proxy() {
  XMLHttpRequest.prototype.open = async function (method, url, ...rest) {
    this.method = method;
    this.url = url;
    for (const rule of openRules) {
      if (typeof this.url === 'string' && rule.match.test(this.url)) {
        if (rule.await) {
          await rule.await.call(this);
        }
        if (modifyHandler.call(this, rule) === 'abort') {
          return
        }
        if (rule.changeUrl) {
          switch (rule.changeUrl.type) {
            case 'handler':
              this.url = rule.changeUrl.handler.call(this);
              break;
            case 'replace':
              this.url = this.url.replace(rule.match, rule.changeUrl.replace);
              break;
            case 'override':
              this.url = rule.changeUrl.override;
              break;
          }
        }
        if (rule.changeMethod) {
          this.method = rule.changeMethod;
        }
      }
    }
    method = this.method;
    url = this.url;
    return originalXhrOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (payload, ...rest) {
    this.payload = payload;
    (async () => {
      for (const rule of sendRules) {
        if ((rule.matchPayload && rule.matchPayload.test(this.payload)) || (rule.matchUrl && rule.matchUrl.test(this.url))) {
          if (rule.await) {
            await rule.await.call(this);
          }
          if (modifyHandler.call(this, rule) === 'abort') {
            return
          }
          if (rule.changePayload) {
            switch (rule.changePayload.type) {
              case 'replace':
                this.payload = this.payload.replace(rule.matchPayload, rule.changePayload.replace);
                break;
            }
          }
        }
      }
      payload = this.payload;
      originalXhrSend.call(this, payload, ...rest);
    })();
  };
}
export function unproxy() {
  XMLHttpRequest.prototype.open = originalXhrOpen;
  XMLHttpRequest.prototype.send = originalXhrSend;
}