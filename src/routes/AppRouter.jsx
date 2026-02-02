// src/routes/AppRouter.jsx
import React from 'react'
import {Routes, Route, NavLink, useLocation, Navigate} from 'react-router-dom'
import {Box, AppBar, Toolbar, Typography, Tabs, Tab, Container, Button} from '@mui/material'
import DataTable from '../features/records/components/DataTable.jsx'
import LoginPage from '../features/auth/LoginPage'
import {useIsAuth} from "../app/user/userSlice.js";
import logout from "../app/store.js"
import {download} from "../features/records/api.js";
import {downloadExcel} from "../utils/downloadExcel.js";
import DashboardPage from '../features/dashboard/DashboardPage'
// новая страница (дерево)
import TreePage from '../features/tree/TreePage.jsx'
// уже была
import ProposeFunctionPage from '../features/proposals/components/ProposeFunctionPage.jsx'

function a11yProps(index) {
    return { id: `tab-${index}`, 'aria-controls': `tabpanel-${index}` }
}

export default function AppRouter() {
    const isAuth = useIsAuth()
    const location = useLocation()


    const isLogin = location.pathname.startsWith('/login')
    // индекс вкладки по пути
    const current =
        location.pathname.startsWith('/dashboard') ? 1 :
            location.pathname.startsWith('/tree')      ? 2 :
                location.pathname.startsWith('/propose')   ? 3 : 0

    const handleDownload = async () => {
        try {
            const response = await download();
            downloadExcel(response);
        } catch (error) {
            console.log(error)
        }
    }

    if (!isAuth) {
        return (
            <Box sx={{ display:'flex', flexDirection:'column', height:'100vh' }}>
                <Container maxWidth="sm" sx={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', py: 4 }}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Container>
            </Box>
        )
    }

    return (
        <Box sx={{ display:'flex', flexDirection:'column', height:'100vh' }}>
            {!isLogin && (
                <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>Функции управления долгом</Typography>
                        <Button onClick={handleDownload}>Выгрузка</Button>
                        <Button onClick={logout}>Выход</Button>
                    </Toolbar>

                    <Tabs value={current} aria-label="tabs" sx={{ px: 2 }}>
                        <Tab label="Таблица" component={NavLink} to="/"           {...a11yProps(0)} />
                        <Tab label="Дашборд" component={NavLink} to="/dashboard"  {...a11yProps(1)} />
                        <Tab label="Дерево функций" component={NavLink} to="/tree" {...a11yProps(2)} />
                        <Tab label="Предложить функцию" component={NavLink} to="/propose" {...a11yProps(3)} />
                    </Tabs>
                </AppBar>
            )}

            <Container maxWidth={false} sx={{ flex: 1, px: 2, py: 2 }}>
                <Routes>
                    <Route path="/" element={<DataTable />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tree" element={<TreePage />} />
                    <Route path="/propose" element={<ProposeFunctionPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Container>
        </Box>
    )
}




