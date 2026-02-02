// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { Provider } from 'react-redux'
// import { ThemeProvider, CssBaseline } from '@mui/material'
// import { BrowserRouter } from 'react-router-dom'
// import {store, persistor} from './app/store'
// import AppRouter from './routes/AppRouter'
// import theme from './theme'
// import {PersistGate} from "redux-persist/integration/react";
//
// ReactDOM.createRoot(document.getElementById('root')).render(
//     <Provider store={store}>
//         <PersistGate loading={null} persistor={persistor}>
//           <ThemeProvider theme={theme}>
//             <CssBaseline />
//             <BrowserRouter>
//               <AppRouter />
//             </BrowserRouter>
//           </ThemeProvider>
//         </PersistGate>
//     </Provider>
// )


import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import {store, persistor} from './app/store'
import AppRouter from './routes/AppRouter'
import theme from './theme'
import {PersistGate} from "redux-persist/integration/react";
import { Provider } from 'react-redux'

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                       {/* Глобально отключаем скролл у страницы и задаём единый стиль скролл-баров */}
                       <GlobalStyles styles={{
                         'html, body, #root': {
                           height: '100%',
                           overflow: 'hidden',      // <— страница больше не скроллится
                         },
                         // Базовый стиль скролла для всех прокручиваемых контейнеров:
                         '*, *::before, *::after': {
                           scrollbarWidth: 'thin',                  // Firefox
                           scrollbarColor: '#9aa4b2 transparent',   // Firefox (thumb, track)
                         },
                         '::-webkit-scrollbar': {
                           width: '10px',
                           height: '10px',
                         },
                         '::-webkit-scrollbar-track': {
                           background: 'transparent',
                         },
                         '::-webkit-scrollbar-thumb': {
                           backgroundColor: 'rgba(120,120,120,.55)',
                           borderRadius: '8px',
                           border: '2px solid transparent',   // «внутренняя» обводка для тонкости
                           backgroundClip: 'content-box',
                         },
                         '::-webkit-scrollbar-thumb:hover': {
                           backgroundColor: 'rgba(120,120,120,.75)',
                         },
                         // Наш главный скроллящийся контейнер
                         '#app-scroll': {
                           position: 'fixed',
                           inset: 0,                // top/right/bottom/left: 0
                           overflow: 'auto',
                           WebkitOverflowScrolling: 'touch',
                           scrollbarGutter: 'stable both-edges', // меньше дёрганий при появлении скролла
                           // Можно фон/пэддинги задать тут, если нужно.
                         },
                       }} />
                <BrowserRouter>
                             {/* Вся страница скроллится ТОЛЬКО внутри этого контейнера */}
                             <div id="app-scroll">
                               <AppRouter />
                             </div>
                </BrowserRouter>
            </ThemeProvider>
        </PersistGate>
    </Provider>
)
