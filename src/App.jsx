import { memo, useEffect, useCallback } from 'react'
import TipsAndUpdates from '@mui/icons-material/TipsAndUpdates';
import Annoumcement from 'components/annoumcement';
import Btns from 'components/Btns';
import GlobalStyle from 'components/GlobalStyle';
import Token from 'components/token';
import store from 'store';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useLocalObservable, Observer } from 'mobx-react';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { waitForSelector, sendMessage } from "utils";
import api, { generateUpdateBtn } from "utils/api";
import Loading from 'components/Loading';
import { observe } from 'mobx';
import TokenIcon from '@mui/icons-material/Token';
import { injectAnalytic } from "analytic";

import { proxy, unproxy } from "proxy";

const theme = createTheme({
  palette: {
    primary: {
      main: '#499557',
    }
  },
  zIndex: {
    drawer: 1204
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none"
        }
      }
    }
  }
});

async function getDomModifier() {
  let domModifier = [];
  if (Date.now() - store.cacheStore.getPersistCache('lastGetDomModifier') < 10800000) {
    domModifier = store.configStore.getDomModifier;
  } else {
    try {
      domModifier = await api.getDomModifier();
      store.cacheStore.setPersistCache('lastGetDomModifier', Date.now());
    } catch (error) {
      domModifier = store.configStore.getDomModifier;
      enqueueSnackbar(`Get dom modifier failed: ${error.message}`, { variant: 'error' })
    }
  }
  for (const { selector, enabled, type, options } of domModifier ?? []) {
    if (enabled) {
      const handler = {
        replaceContent: (el, { html }) => {
          el.innerHTML = html;
        },
        insertAdjacentHTML: (el, { html, location }) => {
          el.insertAdjacentHTML(location, html);
        },
        remove: (el) => {
          el.remove();
        },
        setAttribute: (el, { attr, value }) => {
          el.setAttribute(attr, value);
        }
      }[type];
      if (handler) {
        (async function () {
          handler(await waitForSelector(selector), options)
        })()
      }
    }
  }
}

async function checkUpdate() {
  if (Date.now() - store.cacheStore.getPersistCache('lastUpdateCheck') < 300000) return;
  try {
    const update = await api.getUpdate();
    if (update.available) {
      enqueueSnackbar(`Update available: ${update.version}!`, { variant: 'info', action: () => generateUpdateBtn(update.url), })
    }
    store.cacheStore.setPersistCache('lastUpdateCheck', Date.now());
  } catch (error) {
    enqueueSnackbar(`Update check failed: ${error.message}`, { variant: 'error' })
  }
}

async function loadRemoteScript() {
  if (Date.now() - store.cacheStore.getPersistCache('lastGetRemoteScript') < 10800000) {
    setTimeout(store.cacheStore.getPersistCache('remoteScript'), 0);
  } else {
    try {
      const code = await sendMessage({
        method: 'proxyFetch',
        params: {
          url: `${process.env.NODE_ENV === 'development' ? "http://127.0.0.1:8787" : "https://serverless.blueagle.top"}/static/quillbot-premium-crack/remote-script.js`,
          config: {}
        }
      });
      setTimeout(code, 0);
      store.cacheStore.setPersistCache('lastGetRemoteScript', Date.now());
      store.cacheStore.setPersistCache('remoteScript', code);
    } catch (error) {
      if (store.cacheStore.getPersistCache('remoteScript')) {
        setTimeout(store.cacheStore.getPersistCache('remoteScript'), 0);
      }
      enqueueSnackbar(`Get remote script failed: ${error.message}`, { variant: 'error' })
    }
  }
}

function App() {

  const configStore = useLocalObservable(() => store.configStore);
  const tokenStore = useLocalObservable(() => store.tokenStore);

  const handleToggleAnnouncementWindow = useCallback(() => store.windowStore.toggleAnnouncementWindow(), []);
  const handleToggleTokenWindow = useCallback(() => store.windowStore.toggleTokenWindow(), []);

  useEffect(() => {
    const isHydratedListener = observe(configStore, 'isHydrated', ({ newValue }) => {
      if (newValue) {
        setTimeout(checkUpdate, 3000);
        setTimeout(loadRemoteScript, 3000);
        setTimeout(getDomModifier, 3000);
        injectAnalytic();
        isHydratedListener();
      }
    });

    const getAvailableListener = observe(configStore, 'getAvailable', ({ newValue }) => {
      if (newValue) {
        proxy();
      } else {
        unproxy()
      }
    });

    const visibleListener = document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkUpdate();
      }
    })

    return () => {
      getAvailableListener();
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', visibleListener);
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SnackbarProvider autoHideDuration={3000} maxSnack={6} />
      <Loading />
      <Observer>{() =>
        <Btns
          btns={[
            {
              label: 'Announcement',
              icon: <TipsAndUpdates />,
              onClick: handleToggleAnnouncementWindow,
              show: (configStore.getAnnouncements ?? []).length > 0
            },
            {
              label: !!tokenStore.getActiveId ? 'Using Premium Token' : 'Token Manager',
              icon: <TokenIcon />,
              onClick: handleToggleTokenWindow,
              bounce: !!tokenStore.getActiveId,
              show: true
            }
          ]}
        />
      }</Observer>
      <Annoumcement />
      <Token />
    </ThemeProvider>
  )
}

export default memo(App, () => true);