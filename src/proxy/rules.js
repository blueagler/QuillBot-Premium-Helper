import { enqueueSnackbar } from 'notistack'
import store from 'store';
import { sendMessage } from 'utils'

export const openRules = [
  {
    match: /api\/tracking/,
    response: {
      type: 'override',
      override: `{"message":"tracker action server success","traceID":"0","code":"TRACKER_SUCCESS","data":{},"status":200}`
    }
  },
  {
    match: /api\/(utils\/(sentence-spiltter|grammar-check|bib-search)|summarizer\/summarize-para\/(abs|ext)|paraphraser\/(single-(paraphrase\/(2|0)|flip)|segment)|write-assist\/list-projects)/,
    onLoadHandler() {
      switch (JSON.parse(this.responseText).code) {
        case "SESSION_FAILED":
          enqueueSnackbar('Your session has expired, please log out and log in again', {
            variant: 'error'
          })
          break;
      }
    },
  },
  {
    match: /api\/paraphraser\/single-paraphrase\/(9|10|6|8|7)/,
    onLoadHandler() {
      switch (JSON.parse(this.responseText).code) {
        case "USER_PREMIUM_FORBIDDEN":
          if (store.tokenStore.getActiveId) {
            enqueueSnackbar('Token is not premium, please change your token', {
              variant: 'error'
            })
            break;
          } else {
            enqueueSnackbar('Using premium features requires a token, please choose a token', {
              variant: 'error',
            })
          }
          break;
        case "SESSION_FAILED":
          if (store.tokenStore.getActiveId) {
            enqueueSnackbar('Premium token is invalid, please change your token', {
              variant: 'error'
            })
            break;
          } else {
            enqueueSnackbar('Your session has expired, please log out and log in again', {
              variant: 'error'
            })
          }
          break;
      }
    },
  }
]

export const sendRules = [
  {
    matchUrl: /get-account-details/,
    async await() {
      const responseGetter = function () {
        if (this.status !== 200) {
          return this.response
        }
        const result = JSON.parse(this.response);
        result.data.profile.premium = true;
        return JSON.stringify(result);
      }.bind(this);
      Object.defineProperty(this, "responseText", {
        get: responseGetter,
      })
    }
  },
  {
    matchUrl: /api\/paraphraser\/single-paraphrase\/(9|10|6|8|7)/,
    async await() {
      if (store.tokenStore.getActiveId) {
        try {
          await sendMessage({
            method: 'setTokenHeader',
            params: {
              token: store.tokenStore.getActiveId?.token,
              url: this.url
            }
          });
        } catch (err) {
          console.log(err)
        }
      }
    }
  }
]