import * as React from 'react'
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {useDispatch} from "react-redux";
import {clearUser, fetchLoginUser, useMessageAuth} from "../../app/user/userSlice.js";

export default function LoginPage() {
    const dispatch = useDispatch();
    const messageError = useMessageAuth();
    const [login, setLogin] = React.useState('')
    const [password, setPassword] = React.useState('')

    React.useEffect(() => {
        dispatch(clearUser())
    }, [dispatch])

    const onSubmit = (e) => {
        e.preventDefault()
        dispatch(fetchLoginUser({ login, password }))
    }

    return (
        <Box
            sx={(theme) => ({
                display: 'grid',
                placeItems: 'center',
                px: 2,
                bgcolor: theme.palette.background.default,
            })}
        >
            <Paper
                elevation={0}
                sx={{
                    width: 420,
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                }}
            >
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight={700}>
                        Вход в систему
                    </Typography>
                </Box>

                <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
                    <TextField
                        label="Логин"
                        placeholder="username"
                        fullWidth
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        autoComplete="username"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonOutlineIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label="Пароль"
                        type="password"
                        placeholder="••••••••"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: 16, color: 'red', height: 30 }}>
                        {messageError}
                    </Typography>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{ mt: 1 }}
                    >
                        Войти
                    </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Доступ разрешён уполномоченным пользователям.
                </Typography>
            </Paper>
        </Box>
    )
}
