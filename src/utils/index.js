export async function waitForSelector(selector, opts = {}) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }
    const mutObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        const nodes = Array.from(mutation.addedNodes)
        for (const node of nodes) {
          if (node.matches && node.matches(selector)) {
            mutObserver.disconnect()
            resolve(node)
            return
          }
        }
      }
    })
    mutObserver.observe(document.documentElement, { childList: true, subtree: true })
    if (opts.timeout) {
      setTimeout(() => {
        mutObserver.disconnect()
        if (opts.optional) {
          resolve(null)
        } else {
          reject(new Error(`Timeout exceeded while waiting for selector ("${selector}").`))
        }
      }, opts.timeout)
    }
  })
}
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    window.addEventListener("QuillBot-Premium-Crack-Receive", function ({ detail: payload }) {
      if (payload.success) {
        if (payload.result) {
          resolve(payload.result);
        } else if (payload.results) {
          resolve(payload.results);
        } else {
          reject(new Error(`Unexpected response from background script.`));
        }
      } else {
        if (payload.errors) {
          reject(payload.errors);
        } else if (payload.error) {
          reject(payload.error);
        } else {
          reject(new Error(`Unexpected response from background script.`));
        }
      }
    }, { once: true });
    window.dispatchEvent(new CustomEvent("QuillBot-Premium-Crack-Send", { detail: message }));
    setTimeout(() => {
      reject(new Error(`Timeout exceeded while waiting for response from background script.`))
    }, 10000)
  })
}