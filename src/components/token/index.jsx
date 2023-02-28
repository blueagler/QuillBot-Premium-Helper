import { useCallback, memo, useState, useEffect } from 'react'
import { useLocalObservable, Observer } from 'mobx-react';
import store from 'store';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from "./List";
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import HelpIcon from '@mui/icons-material/Help';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import api from "utils/api";
import { observe } from 'mobx';
import { enqueueSnackbar } from 'notistack';

const title = <DialogTitle>Token Manager</DialogTitle>;

async function getPublicToken() {
  if (Date.now() - store.cacheStore.getPersistCache('lastGetPublicToken') < 600000) return;
  try {
    await api.getPublicToken();
    store.cacheStore.setPersistCache('lastGetPublicToken', Date.now());
  } catch (e) {
    enqueueSnackbar(`Failed to get public token: ${e.message}`, { variant: 'error' });
  }
}

function Token() {

  const tokenStore = useLocalObservable(() => store.tokenStore);
  const windowStore = useLocalObservable(() => store.windowStore);

  const handleToggleTokenWindow = useCallback(() => windowStore.toggleTokenWindow(), []);

  const [helpPopover, setHelpPopover] = useState(null);

  const handleHelpPopoverOpen = useCallback((event) => {
    setHelpPopover(event.currentTarget);
  }, []);

  const handleHelpPopoverClose = useCallback(() => {
    setHelpPopover(null);
  }, []);

  const [addTokenPopover, setAddTokenPopover] = useState(null);

  const handleAddTokenPopoverOpen = useCallback((event) => {
    setAddTokenPopover(event.currentTarget);
  }, []);

  const handleAddTokenPopoverClose = useCallback(() => {
    setAddTokenPopover(null);
  }, []);

  const [addTokenId, setAddTokenId] = useState('');
  const [addToken, setAddToken] = useState('');

  const handleSetAddTokenId = useCallback((e) => {
    setAddTokenId(e.target.value);
  }, []);

  const handleSetAddToken = useCallback((e) => {
    setAddToken(e.target.value);
  }, []);

  const saveToken = useCallback(() => {
    tokenStore.addToken({
      property: 'private',
      id: addTokenId,
      token: addToken
    });
    handleAddTokenPopoverClose();
    setAddTokenId('');
    setAddToken('');
  }, [addToken, addTokenId]);

  useEffect(() => {
    const isHydratedListener = observe(tokenStore, 'isHydrated', ({ newValue }) => {
      if (newValue) {
        setTimeout(getPublicToken, 3000);
        isHydratedListener();
      }
    });
    const visibleListener = document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        getPublicToken();
      }
    })
    return () => {
      document.removeEventListener('visibilitychange', visibleListener);
    }
  }, [])

  return (
    <Observer>{() =>
      <Dialog
        open={windowStore.isTokenWindowOpen ?? false}
        onClose={handleToggleTokenWindow}
        PaperProps={{
          sx: {
            height: '70%',
            minWidth: 400,
          }
        }}
      >
        <IconButton
          size="large"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10
          }}
          onMouseEnter={handleHelpPopoverOpen}
          onMouseLeave={handleHelpPopoverClose}
        >
          <HelpIcon />
        </IconButton>
        <Popover
          sx={{
            pointerEvents: 'none',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(helpPopover)}
          anchorEl={helpPopover}
          onClose={handleHelpPopoverClose}
          disableRestoreFocus
        >
          <Typography sx={{ p: 1 }}>
            QuillBot Premium Token helps you access premium modes. Without a token, you can only use the free mode. However, you can still enjoy Unlimited Characters, Maximum Synonyms and Paraphrase History without a token.
          </Typography>
        </Popover>
        {title}
        <DialogContent>
          <List />
        </DialogContent>
        <DialogActions>
          <Popover
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            open={Boolean(addTokenPopover)}
            anchorEl={addTokenPopover}
            onClose={handleAddTokenPopoverClose}
          >
            <Stack
              spacing={2}
              sx={{
                minWidth: 500,
                p: 2
              }}
            >
              <TextField label="ID" variant="outlined" helperText="This is the id(name) of your token" onChange={handleSetAddTokenId} value={addTokenId} />
              <TextField label="Token" variant="outlined" helperText="e.g. eyJhbG..." onChange={handleSetAddToken} value={addToken} fullWidth /> :
              <Button variant="contained" onClick={saveToken} disabled={!(addTokenId && addToken)} fullWidth> Save </Button>
            </Stack>
          </Popover>
          <Button onClick={handleAddTokenPopoverOpen}>
            Add your own token
          </Button>
          <Button onClick={handleToggleTokenWindow}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    }</Observer>
  )
}

export default memo(Token, () => true);