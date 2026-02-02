// src/features/proposals/ProposeFunctionPage.jsx
import * as React from 'react'
import { Box, Stack, Typography, Button, Grid, Paper, LinearProgress, Divider } from '@mui/material'
import ProposalFormDialog from './ProposalFormDialog.jsx'
import ProposalCard from './ProposalCard.jsx'
import {useDispatch} from "react-redux";
import {
    fetchCreate,
    fetchGetRecommendations,
    fetchStatusChange,
    useLoading,
    useRecommendations
} from "../proposalSlice.js";
import {useRoleDetection} from "../../../app/user/userSlice.js";



export default function ProposeFunctionPage() {
    const { isRepresentativeCA } = useRoleDetection();
    const dispatch = useDispatch()

    const items = useRecommendations()
    const loading = useLoading()

    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        dispatch(fetchGetRecommendations())
    }, [dispatch])



    // Создание нового предложения
    const handleCreate = (formValues) => {
        dispatch(fetchCreate(formValues));
        setOpen(false);
    }

    // Обновление статуса (например, из карточки)
    const handleUpdateStatus = async (index, id, status, comment) => {
        dispatch(fetchStatusChange({ index, id, status, comment }));
    }


    return (
        <Box>
            {/* Шапка страницы */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '.01em' }}>
                    Заполните форму и отправьте на рассмотрение.
                </Typography>
                {isRepresentativeCA && (
                    <Button variant="contained" onClick={() => setOpen(true)}>
                        Новое предложение
                    </Button>
                )}
            </Stack>

            {/* Список предложений */}
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: 2,
                    borderColor: t.palette.divider,
                })}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Предложения</Typography>
                    {loading && <LinearProgress sx={{ height: 6, flex: 1, borderRadius: 1 }} />}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={1.5}>
                    {items.length === 0 && !loading && (
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Пока предложений нет
                            </Typography>
                        </Grid>
                    )}

                    {items.map((p, index) => (
                        <Grid item xs={12} md={6} lg={4} key={p.id}>
                            <ProposalCard
                                proposal={p}
                                onChangeStatus={(status, comment) => handleUpdateStatus(index, p.id, status, comment)}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Модалка с формой */}
            {open && (
                <ProposalFormDialog
                    open={open}
                    onClose={() => setOpen(false)}
                    onSubmit={handleCreate}
                />
            )}
        </Box>
    )
}
