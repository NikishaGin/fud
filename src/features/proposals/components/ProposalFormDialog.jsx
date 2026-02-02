// src/features/proposals/ProposalFormDialog.jsx
import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Grid, TextField, Button, Autocomplete
} from '@mui/material'
import {fetchGetExecutors, fetchGetWhoOffers, fetchGetWhoUses, useOptionsForSelect} from "../proposalSlice.js";
import {useDispatch} from "react-redux";
import {useEffect} from "react";



export default function ProposalFormDialog({ open, onClose, onSubmit }) {
    const dispatch = useDispatch()
    const { whoOffers, executors, whoUses } = useOptionsForSelect();

    useEffect(() => {
        dispatch(fetchGetWhoOffers());
        dispatch(fetchGetExecutors());
        dispatch(fetchGetWhoUses());
    }, [dispatch]);


    const [values, setValues] = React.useState({
        whoOffers: '',
        executor: '',
        functionBlock: '',
        function: '',
        reason: '',
        whoUses: '',
        howUses: '',
        whyUses: '',
    })

    console.log(values)

    const disableSubmit =
        !values.whoOffers?.trim() ||
        !values.executor?.trim() ||
        !values.whoUses?.trim() ||
        !values.functionBlock?.trim() ||
        !values.function?.trim() ||
        !values.reason?.trim() ||
        !values.howUses?.trim() ||
        !values.whyUses?.trim()


    const handleSubmit = (e) => {
        e.preventDefault()
        if (disableSubmit) return
        const payload = Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, value.trim()])
        )
        onSubmit?.(payload)
    }

    return (
        <Dialog
            open={open}
            onClose={(_, r) => (r === 'backdropClick' || r === 'escapeKeyDown') ? null : onClose?.()}
            fullWidth
            maxWidth="md"
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' } } }}
            PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
        >
            <DialogTitle sx={{ fontWeight: 800 }}>
                Новое предложение
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        {/* 1) Кто предлагает? — SELECT */}
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={whoOffers.map(v => ({ id: v,  label: v }))}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={values.whoOffers}
                                onChange={(_, v) => setValues(s => ({ ...s, whoOffers: v.id }))}
                                renderInput={(p) => <TextField {...p} label="Кто предлагает?" required fullWidth />}
                            />
                        </Grid>

                        {/* 2) Исполнитель функции — SELECT */}
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={executors.map(v => ({ id: v, label: v }))}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={values.executor}
                                onChange={(_, v) => setValues(s => ({ ...s, executor: v.id }))}
                                renderInput={(p) => <TextField {...p} label="Исполнитель функции" required fullWidth />}
                            />
                        </Grid>

                        {/* 3) Блок функции — TEXT */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Блок функции"
                                value={values.functionBlock}
                                onChange={(e) => setValues(s => ({ ...s, functionBlock: e.target.value }))}
                                fullWidth
                                required
                            />
                        </Grid>

                        {/* 4) Функция — TEXT */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Функция"
                                value={values.function}
                                onChange={(e) => setValues(s => ({ ...s, function: e.target.value }))}
                                fullWidth
                                required
                            />
                        </Grid>

                        {/* 5) Кто использует? — SELECT */}
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={whoUses.map(v => ({ id: v, label: v }))}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={values.whoUses}
                                onChange={(_, v) => setValues(s => ({ ...s, whoUses: v.id }))}
                                renderInput={(p) => <TextField {...p} label="Кто использует?" required fullWidth />}
                            />
                        </Grid>

                        <Grid item xs={12} md={6} />

                        {/* 6) Как использует? — TEXT */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Как использует?"
                                value={values.howUses}
                                onChange={(e) => setValues(s => ({ ...s, howUses: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                                required
                            />
                        </Grid>

                        {/* 7) Зачем использует? — TEXT */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Зачем использует?"
                                value={values.whyUses}
                                onChange={(e) => setValues(s => ({ ...s, whyUses: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                                required
                            />
                        </Grid>

                        {/* 8) Основание — TEXT */}
                        <Grid item xs={12}>
                            <TextField
                                label="Основание"
                                value={values.reason}
                                onChange={(e) => setValues(s => ({ ...s, reason: e.target.value }))}
                                fullWidth
                                multiline
                                minRows={2}
                                required
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Отмена</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={disableSubmit}>
                    Добавить
                </Button>
            </DialogActions>
        </Dialog>
    )
}
