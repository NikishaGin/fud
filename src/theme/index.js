import { createTheme } from '@mui/material/styles'
import { ruRU as coreRuRU } from '@mui/material/locale'
import { ruRU as gridRuRU } from '@mui/x-data-grid/locales'

const theme = createTheme(
  {
    palette: {
      mode: 'dark',
      primary: { main: '#2563EB' },
      secondary: { main: '#1E293B' },
      background: {
        default: '#0B1220',
        paper: '#0F172A'
      },
      text: {
        primary: '#E6EDF7',
        secondary: '#B8C4D9'
      },
      divider: '#1F2937'
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: 'Inter, system-ui, Arial',
    },
    components: {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: '1px solid #1F2937',
          }
        }
      }
    }
  },
  coreRuRU,
  gridRuRU
)

export default theme
