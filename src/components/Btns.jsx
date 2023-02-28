import { memo } from 'react'
import { styled } from '@mui/material/styles';

import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

const Wrapper = styled(Stack)({
  position: 'fixed',
  zIndex: 1203,
  right: 14,
  bottom: 86,
});

function Btns({ btns }) {
  return (
    <Wrapper
      direction="column"
      spacing={2}
      justifyContent="space-evenly"
    >
      {
        (btns ?? []).map((btn, key) => {
          if (!btn.show) return null
          return (
            <Tooltip
              key={btn.label ?? key}
              title={btn.label}
              placement="left"
            >
              <Fab
                onClick={btn.onClick}
                color="primary"
                aria-label={btn.label}
                sx={{
                  animation: btn.bounce ? 'QuillBot-Premium-Crack-Bounce-Animation 3s ease-in-out infinite' : 'none',
                }}
              >
                {btn.icon}
              </Fab>
            </Tooltip>
          )
        })
      }
    </Wrapper>
  )
}

export default memo(Btns, (prevProps, nextProps) => prevProps.btns === nextProps.btns);