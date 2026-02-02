// src/features/tree/TreePage.jsx
import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {Box, Paper, Stack, Typography, Button, Autocomplete, TextField, CircularProgress} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { fetchHead, selectHead } from '../records/recordsSlice';
import {
    fetchTreeByHead,
    selectTreeData,
    selectTreeStatus,
    selectTreeError,
    selectFlowGraphRaw,
    selectTreeStatistics,
} from './treeSlice';
import { useNavigate } from "react-router-dom";
import TreeGraph from "./TreeGraph.jsx";
import { downloadTreeStatistics } from "../records/api.js";
import {downloadExcel} from "../../utils/downloadExcel.js";

export default function TreePage() {
    const dispatch = useDispatch();

    const head    = useSelector(selectHead, shallowEqual);
    const tree    = useSelector(selectTreeData, shallowEqual);
    const status  = useSelector(selectTreeStatus);
    const error   = useSelector(selectTreeError);
    const stats   = useSelector(selectTreeStatistics);   // 👈 статистика
    const graphRaw = useSelector(selectFlowGraphRaw, shallowEqual);

    const navigate = useNavigate();
    const handleOpenById = React.useCallback((id) => {
        navigate(`/?openId=${encodeURIComponent(id)}`);
    }, [navigate]);

    const [selectedHead, setSelectedHead] = React.useState(null);

    React.useEffect(() => {
        dispatch(fetchHead());
    }, [dispatch]);

    const headOptions = React.useMemo(
        () => {
            const options = (head || []).map((h) => ({ value: h.id, label: h.name }))
            options.unshift({ value: 'URZ', label: 'Всё по УРЗ' });
            options.unshift({ value: 'UOPB', label: 'Всё по УОПБ' });
            options.unshift({ value: null, label: 'Всё дерево' });
            return options;
        },
        [head]
    );

    const handleShow = async () => {
        await dispatch(fetchTreeByHead(selectedHead.value));
    };

    const handleDownload = async () => {
        try {
            const response = await downloadTreeStatistics();
            downloadExcel(response);
        } catch (error) {
            console.log(error)
        }
    }

    const hasStats = status === 'succeeded' && stats && stats.count > 0;

    return (
        <Stack spacing={2}>
            {/* Панель выбора + статистика справа */}
            <Paper
                variant="outlined"
                sx={{
                    p: 1,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: hasStats ? 'minmax(220px, 360px) auto 330px' : 'minmax(220px, 360px) auto' },
                    gap: 1,
                    alignItems: 'center',
                }}
            >
                {/* Левая часть — выбор начальника + кнопка */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Autocomplete
                        options={headOptions}
                        value={selectedHead}
                        onChange={(_, v) => setSelectedHead(v)}
                        getOptionLabel={(o) => o?.label ?? ''}
                        clearOnEscape
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Начальник (ФИО)"
                                size="small"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        minHeight: 36,
                                    },
                                    '& .MuiInputBase-input': {
                                        py: 0.5,
                                    },
                                }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleShow}
                        disabled={!selectedHead || status === 'loading'}
                        size="small"
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {status === 'loading' ? 'Загрузка…' : 'Показать'}
                    </Button>
                </Stack>

                {/* Правая часть — компактная статистика дерева */}
                {hasStats && (
                    <Box
                        sx={(t) => ({
                            justifySelf: 'flex-end',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            border: '1px dashed',
                            borderColor: t.palette.divider,
                            backgroundColor: t.palette.mode === 'light'
                                ? t.palette.background.default
                                : t.palette.background.paper,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            maxHeight: 36,         // визуально низкий чип
                            whiteSpace: 'nowrap',  // всё в одну строку
                        })}
                    >

                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Функций&nbsp;
                            <Box component="span" sx={{ fontWeight: 700 }}>
                                {stats.count}
                            </Box>
                            &nbsp;· Детей&nbsp;
                            <Box component="span" sx={{ fontWeight: 700 }}>
                                {stats.countChildren}
                            </Box>
                            &nbsp;· Пар&nbsp;
                            <Box component="span" sx={{ fontWeight: 700 }}>
                                {stats.countPairs}
                            </Box>
                            &nbsp;· Без пар&nbsp;
                            <Box component="span" sx={{ fontWeight: 700 }}>
                                {stats.countWithoutPairs}
                            </Box>
                        </Typography>
                    </Box>
                )}


                <Button
                    variant="outlined"
                    onClick={handleDownload}
                    endIcon={<DownloadIcon />}
                    sx={{ ml: "auto", width: 300, height: 40 }}
                >
                    Статистика дерева функций
                </Button>
            </Paper>

            {/* Область с деревом */}
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    height: 'calc(100vh - 225px)',
                    minHeight: 460,
                    position: 'relative',
            }}
            >
                {status === 'idle' && (
                    <Box sx={{ color: 'text.secondary' }}>
                        Выберите начальника и нажмите <b>Показать</b>, чтобы загрузить дерево.
                    </Box>
                )}

                {status === 'loading' && (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: 440, color: 'text.secondary' }}>
                        <CircularProgress size={28} />
                        <Typography variant="body2" sx={{ mt: 1 }}>Строим дерево…</Typography>
                    </Stack>
                )}

                {status === 'failed' && (
                    <Box sx={{ color: 'error.main' }}>
                        Ошибка загрузки: {String(error || '')}
                    </Box>
                )}

                {status === 'succeeded' && (
                    <TreeGraph graph={graphRaw} onOpenById={handleOpenById} />
                )}
            </Paper>
        </Stack>
    );
}
