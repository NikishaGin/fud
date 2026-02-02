// src/features/records/components/DataTable.jsx
import React, {useEffect, useMemo, useCallback} from 'react'
import {DataGridPro} from '@mui/x-data-grid-pro'
import {Box, IconButton, Tooltip, LinearProgress} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
    fetchRecords,
    selectColumns,
    selectFilteredRows,
    selectPendingMap,
    patchRow,
    fetchCurators, selectCurators, fetchDepartments, fetchDti, selectDti, fetchHead, selectDepartment, selectHead,
    selectCustomersMiudol, selectCustomersCa, fetchCustomersMiudol, fetchCustomersCa, addRecord, deleteRecordThunk,
    setFilter,
    FIELD_LABELS,          // ← подписи колонок берём отсюда
} from '../recordsSlice'
import {openFilterPopover} from '../../ui/uiSlice'
import TextareaAutosize from '@mui/material/TextareaAutosize'
import {alpha} from '@mui/material/styles'
import ColumnFilterPopover from './ColumnFilterPopover'
import {Trash2} from 'lucide-react';
import {LongTextCell} from "./atoms/LongTextCell.jsx";
import {ListEyeCell} from "./atoms/ListEyeCell.jsx";
import {DtiMultiEditCell} from "./atoms/DtiMultiEditCell.jsx";
import {ComplexityChipCell, EffectivenessCell} from "./atoms/ComplexityChipCell.jsx";
import {HeaderWithFilter} from "./atoms/HeaderWithFilter.jsx";
import {AddFunctionFooter} from "./atoms/AddFunctionFooter.jsx";
import SelectEditAutocomplete from "./atoms/SelectEditAutocomplete.jsx";
import {AddFunctionDialog} from "./dialogs/AddFunctionDialog.jsx";
import {ConfirmDeleteDialog} from "./dialogs/ConfirmDeleteDialog.jsx";
import {
    COMPLEXITY_LABEL,
    EFFECTIVENESS_LABEL,
    ExecutionFrequencyMap,
    NON_EDITABLE_FIELDS,
    OWNER_LABEL
} from "../constants/records.js";
import AcceptCell, {STAGE_LABEL} from './accept/AcceptCell.jsx';
import {RowViewDialog} from "./dialogs/RowViewDialog.jsx";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {Stack} from '@mui/material';
import {useDispatch, useSelector, shallowEqual} from 'react-redux'
import {sanitizeTextOrNull} from "../../../utils/valid.js";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import {safeCopyToClipboard} from "../../../utils/copy.js";
import {AiDialogView} from '../../ai-agent/ai-agent-mvp7.jsx';

import { useLocation, useNavigate } from 'react-router-dom';

// ===== Компонент таблицы =====================================================
export default function DataTable() {
    const dispatch = useDispatch()

    const rows = useSelector(selectFilteredRows, shallowEqual)

    const columnsState = useSelector(selectColumns, shallowEqual)
    const pendingMap = useSelector(selectPendingMap, shallowEqual)
    const filters = useSelector(s => s.records.filters, shallowEqual)

    const [agentOpen, setAgentOpen] = React.useState(false);

    const location = useLocation();
    const navigate = useNavigate();

// при заходе с /?openId=XXX — открыть карточку
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const target = params.get('openId');
        if (!target) return;

        openById(target);

        // очистим параметр, чтобы не дублировалось при навигации назад
        params.delete('openId');
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);



    // стало:
    const [view, setView] = React.useState({open: false, index: -1});
    const openRowView = React.useCallback((row) => {
        const idx = rows.findIndex(r => r.id === row.id);
        setView({open: true, index: idx === -1 ? 0 : idx});
    }, [rows]);
    // const closeRowView = React.useCallback(() => setView({ open: false, index: -1 }), []);

    const currentRow = view.index >= 0 ? rows[view.index] : null;
    const canPrev = view.index > 0;
    const canNext = view.index >= 0 && view.index < rows.length - 1;

    const goPrev = React.useCallback(() => {
        setView(v => (v.index > 0 ? {...v, index: v.index - 1} : v));
    }, []);
    const goNext = React.useCallback(() => {
        setView(v => (v.index < rows.length - 1 ? {...v, index: v.index + 1} : v));
    }, [rows.length]);

// Если список строк обновился (фильтры/поиск) — подправим индекс в допустимые границы
    React.useEffect(() => {
        if (!view.open) return;
        setView(v => {
            if (rows.length === 0) return {open: false, index: -1};
            const clamped = Math.min(Math.max(v.index, 0), rows.length - 1);
            return {...v, index: clamped};
        });
    }, [rows, view.open]);


    // активные фильтры
    const activeFilterFields = React.useMemo(() => {
        if (!filters) return [];
        return Object.entries(filters)
            .filter(([, v]) => Boolean(v))
            .map(([field]) => field);
    }, [filters]);
    const hasAnyFilters = activeFilterFields.length > 0;

    // const clearAllFilters = useCallback(() => {
    //     activeFilterFields.forEach((f) => {
    //         dispatch(setFilter({field: f, values: null}));
    //     });
    // }, [dispatch, activeFilterFields]);


    // 2) Упрощённая очистка всех фильтров (у тебя уже есть clearAllFilters)
    const clearAllFilters = useCallback(() => {
        Object.entries(filters || {}).forEach(([field, v]) => {
            if (v) dispatch(setFilter({field, values: null}));
        });
    }, [dispatch, filters]);


    const isEditableCell = useCallback((row) => {
        const editableRow = row?.editableRow ?? true;
        return editableRow;
    }, []);

    // инициализация справочников/данных
    const didInitRef = React.useRef(false);
    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;
        dispatch(fetchRecords());
        dispatch(fetchCurators());
        dispatch(fetchDepartments());
        dispatch(fetchHead());
        dispatch(fetchDti());
        dispatch(fetchCustomersMiudol());
        dispatch(fetchCustomersCa());
    }, [dispatch])

    const curators = useSelector(selectCurators, shallowEqual)
    const departments = useSelector(selectDepartment, shallowEqual)
    const head = useSelector(selectHead, shallowEqual)
    const dti = useSelector(selectDti, shallowEqual)
    const customersMiudol = useSelector(selectCustomersMiudol, shallowEqual)
    const customersCa = useSelector(selectCustomersCa, shallowEqual)

    const curatorLabelById = useMemo(() => {
        return curators?.map(({id, name}) => ({label: name, value: id}))
    }, [curators])

    const departmentsLabelById = useMemo(() => {
        return departments?.map(({id, name}) => ({label: name, value: id}))
    }, [departments])

    const headLabelById = useMemo(() => {
        return head?.map(({id, name}) => ({label: name, value: id}))
    }, [head])

    const dtiLabelById = useMemo(() => {
        return dti?.map(({id, value}) => ({label: value, value: id}))
    }, [dti])

    const customersMiudolLabelById = useMemo(() => {
        return customersMiudol?.map(({id, name}) => ({label: name, value: id}))
    }, [customersMiudol])

    const customersCaLabelById = useMemo(() => {
        return customersCa?.map(({id, name}) => ({label: name, value: id}))
    }, [customersCa])

    const handleProcessRowUpdate = useCallback((newRow, oldRow) => {
        const changes = {};

        for (const k of Object.keys(newRow)) {
            const next = newRow[k];
            const prev = oldRow[k];

            // Если значение строковое — санитизируем
            if (typeof next === 'string') {
                const cleaned = sanitizeTextOrNull(next);
                // если «некорректно» — не считаем это изменением (оставляем prev)
                if (cleaned == null) {
                    continue; // просто не пишем changes[k], тем самым откатываем это поле
                }
                if (cleaned !== prev) {
                    changes[k] = cleaned;
                }
                continue;
            }

            // прежняя логика для null/пустых
            if (next !== prev) {
                changes[k] = (next === '' || next == null) ? null : next;
            }
        }

        if (Object.keys(changes).length > 0) {
            dispatch(patchRow({id: newRow.id, changes}));
            return {...oldRow, ...changes};
        }
        // нечего сохранять — просто вернуть старое состояние
        return oldRow;
    }, [dispatch]);

    // нумерация строк
    const visibleIndexById = useMemo(() => {
        const m = new Map()
        rows.forEach((r, i) => m.set(r.id, i + 1))
        return m
    }, [rows])

    const [confirm, setConfirm] = React.useState({open: false, id: null});

    const canDeleteRow = useCallback((row) => {
        if (typeof row?.canDelete === 'boolean') return row.canDelete;
        const editableRow = row?.editableRow ?? true;
        return editableRow;
    }, []);

    const ACTIONS_COL = useMemo(() => ({
        field: '__actions__',
        headerName: 'Действия',
        width: 100,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        disableReorder: true,
        pinnable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
            const id = params.id;
            const isDeleting = !!pendingMap[`del::${id}`];
            const isReadOnlyByRole = !isEditableCell(params.row);
            const allowedByRole = canDeleteRow(params.row);
            const canClick = !isReadOnlyByRole && allowedByRole && !isDeleting;

            const openConfirm = (e) => {
                e.stopPropagation();
                if (!canClick) return;
                setConfirm({open: true, id});
            };

            return (
                <Box
                    sx={{
                        opacity: 0,
                        transition: 'opacity 150ms ease',
                        '.MuiDataGrid-row:hover &': {opacity: 1},
                        position: 'relative',
                    }}
                >
                    <Tooltip
                        title={
                            canClick
                                ? 'Удалить'
                                : isDeleting
                                    ? 'Удаление выполняется…'
                                    : isReadOnlyByRole
                                        ? 'Нет прав на удаление'
                                        : 'Удаление недоступно'
                        }
                        disableInteractive
                    >
            <span
                className="action-delete-wrap"
                style={{pointerEvents: canClick ? 'auto' : 'none'}}
            >
              <IconButton
                  className="action-delete-btn"
                  size="small"
                  onClick={openConfirm}
                  disabled={!canClick}
                  sx={{
                      color: 'error.main',
                      '&:hover': {backgroundColor: 'error.light'},
                      '&.Mui-disabled': {
                          color: (theme) => theme.palette.action.disabled,
                          backgroundColor: 'transparent',
                          cursor: 'not-allowed',
                      },
                  }}
              >
                <Trash2 size={16}/>
              </IconButton>
            </span>
                    </Tooltip>

                    {isDeleting && (
                        <Box sx={{position: 'absolute', right: -2, top: -2, width: 18}}>
                            <LinearProgress variant="indeterminate"/>
                        </Box>
                    )}
                </Box>
            );
        },
    }), [pendingMap, setConfirm, canDeleteRow, isEditableCell]);


    const openFilter = useCallback((field) => {
        dispatch(openFilterPopover({column: field, anchorElId: `hdr-${field}`}))
    }, [dispatch])

    const clearFilter = useCallback((field) => {
        dispatch(setFilter({field, values: null}))
    }, [dispatch])

    const renderHeader = useCallback((params) => {
        const field = params?.colDef?.field
        const isFiltered = Boolean(filters?.[field])
        return (
            <HeaderWithFilter
                params={params}
                onOpen={openFilter}
                isFiltered={isFiltered}
                onClear={() => clearFilter(field)}
                anchorElId={`hdr-${field}`}
            />
        )
    }, [openFilter, clearFilter, filters])

    const ID_COL = useMemo(() => ({
        field: 'id',
        headerName: FIELD_LABELS.id ?? 'ID',
        width: 75,
        sortable: false,
        filterable: true,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        renderHeader,
        renderCell: (p) => (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, width: '100%'}}>
                <Box sx={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                    fontWeight: 800,
                    letterSpacing: '.02em'
                }}>
                    {String(p.value ?? '—')}
                </Box>
                <Tooltip title="Скопировать ID">
                    <IconButton
                        size="small"
                        onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await safeCopyToClipboard(String(p.value ?? ''));
                            // по желанию: всплывашка/тост
                            //enqueueSnackbar(ok ? 'ID скопирован' : 'Не удалось скопировать', { variant: ok ? 'success' : 'error' });
                        }}
                        sx={{'& .MuiSvgIcon-root': {fontSize: 16}}}
                    >
                        <ContentCopyOutlinedIcon/>
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    }), [renderHeader]);

    const ROW_NUMBER_COL = useMemo(() => ({
        field: '__rowNum__',
        headerName: '№',
        width: 75,
        sortable: false,
        filterable: true,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        renderHeader,
        renderCell: (p) => {
            const isEmpty = p.row?.emptyRow === true;

            return (
                <Box sx={{width: '100%', py: 0.5, lineHeight: 1.2, textAlign: 'center'}}>
                    <Box sx={{fontWeight: 600}}>
                        {visibleIndexById.get(p.id) ?? ''}
                    </Box>

                    <Tooltip title="Просмотреть строку">
                        <IconButton
                            size="small"
                            className="row-view-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                openRowView(p.row);
                            }}
                            sx={{mt: 0.5, '& .MuiSvgIcon-root': {fontSize: 18}}}
                        >
                            <VisibilityOutlinedIcon/>
                        </IconButton>
                    </Tooltip>

                    {/* индикатор под глазом */}
                    <Stack alignItems="center" sx={{mt: 0.25}}>
                        <Tooltip title={isEmpty ? 'Пустая строка' : 'Заполнено'}>
                            <FiberManualRecordIcon
                                sx={(theme) => ({
                                    fontSize: 10,
                                    color: isEmpty ? theme.palette.error.main : theme.palette.success.main,
                                    transition: 'color 150ms ease',
                                    // тонкий «ободок», чтобы точка не терялась на разных фонах:
                                    filter: `drop-shadow(0 0 0 1.5px ${theme.palette.background.paper})`,
                                })}
                            />
                        </Tooltip>
                    </Stack>
                </Box>
            );
        },
    }), [visibleIndexById, openRowView, rows, renderHeader]);


    const renderLong = useCallback((params) => {
        const key = `${params.id}::${params.field}`
        const isPending = !!pendingMap[key]
        return <LongTextCell value={params.value} isPending={isPending}/>
    }, [pendingMap])

    const ACCEPT_COL = useMemo(() => ({
        field: 'acceptStage',
        headerName: 'Акцепт',
        minWidth: 240,
        flex: 1,
        sortable: false,
        filterable: true,
        disableColumnMenu: false,
        renderHeader,
        valueGetter: (value) => STAGE_LABEL[value] || value,
        renderCell: (params) => (
            <AcceptCell
                row={params.row}
                onSave={handleProcessRowUpdate}
                history={params.row.accept}
            />
        ),
    }), [renderHeader, handleProcessRowUpdate]);


    // ====== ГРУППЫ ЗАГОЛОВКОВ (первая строка) ======
    const COLUMN_GROUPS = useMemo(() => ([
        {
            groupId: 'exec',
            headerName: 'Исполнитель',
            children: [
                {field: 'sources'},
                {field: 'curatorId'},
                {field: 'departmentNameId'},
                {field: 'departmentHeadId'},
            ],
        },
        {
            groupId: 'ident',
            headerName: 'Идентификация',
            children: [
                {field: 'functionBlock'},
                {field: 'function'},
                {field: 'functionDetails'},
            ],
        },
        {
            groupId: 'value',
            headerName: 'Значимость',
            children: [
                {field: 'dtiIds'},
                {field: 'customerId'},
                {field: 'howCustomerUses'},
                {field: 'whyCustomerUses'},
            ],
        },
        {
            groupId: 'attrs',
            headerName: 'Атрибуты',
            children: [
                {field: 'complexity'},
                {field: 'reason'},
                {field: 'execution'},
                {field: 'artifact'},
            ],
        },
    ]), []);

    // Колонки
    const dataCols = useMemo(() => {
        return columnsState.map((col) => {
            const editable = !NON_EDITABLE_FIELDS.has(col.field)
            const headerName = FIELD_LABELS[col.field] ?? col.headerName ?? col.field


            // sources — только отображение
            if (col.field === 'sources') {
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable: false,
                    minWidth: col.minWidth ?? 160,
                    flex: col.flex ?? 0.8,
                    resizable: true,
                    renderHeader,
                    renderCell: (p) => {
                        const key = `${p.id}::${p.field}`
                        const raw = p.row?.sources
                        const codes = Array.isArray(raw)
                            ? raw.map(x => (typeof x === 'string' ? x : x?.value)).filter(Boolean)
                            : (typeof raw === 'string' ? [raw] : [])
                        const label = codes.length
                            ? codes.map(c => OWNER_LABEL[c] ?? c).join(', ')
                            : '—'
                        return <LongTextCell value={label} isPending={!!pendingMap[key]}/>
                    },
                }
            }

            if (col.field === 'curatorId') {
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: curatorLabelById,
                    valueFormatter: (value) => {
                        return curators?.find(cur => cur.id === value)?.name || '';
                    },
                    valueSetter: (value, row) => {
                        if (value !== undefined && value !== null) {
                            return {...row, curatorId: value};
                        }
                        return row;
                    },
                    resizable: true,
                    renderEditCell: (params) => (
                        <SelectEditAutocomplete params={params} options={curatorLabelById}/>
                    ),
                    renderHeader,
                };
            }

            if (col.field === 'departmentNameId') {
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: departmentsLabelById,
                    valueFormatter: (value) => {
                        return departments?.find(cur => cur.id === value)?.name || '';
                    },
                    valueSetter: (value, row) => {
                        if (value !== undefined && value !== null) {
                            return {...row, departmentNameId: value};
                        }
                        return row;
                    },
                    resizable: true,
                    renderEditCell: (params) => (
                        <SelectEditAutocomplete params={params} options={departmentsLabelById}/>
                    ),
                    renderHeader,
                }
            }

            if (col.field === 'departmentHeadId') {
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: headLabelById,
                    valueFormatter: (value) => {
                        return head?.find(cur => cur.id === value)?.name || '';
                    },
                    valueSetter: (value, row) => {
                        if (value !== undefined && value !== null) {
                            return {...row, departmentHeadId: value};
                        }
                        return row;
                    },
                    renderEditCell: (params) => (
                        <SelectEditAutocomplete params={params} options={headLabelById}/>
                    ),
                    resizable: true,
                    renderHeader,
                }
            }

            if (col.field === 'dtiIds') {
                return {
                    ...col,
                    headerName,
                    editable: true,
                    valueGetter: (value) => {
                        const arr = Array.isArray(value) ? value : [];
                        return arr
                            .map(v => (v && typeof v === 'object' ? v.id : v))
                            .filter(v => v != null);
                    },
                    valueSetter: (newValue, row) => {
                        const ids = Array.isArray(newValue) ? newValue : [];
                        return {...row, dtiIds: ids};
                    },
                    valueOptions: dtiLabelById,
                    minWidth: col.minWidth ?? 220,
                    flex: col.flex ?? 1,
                    sortable: false,
                    resizable: true,
                    renderHeader,
                    renderCell: (params) => {
                        const key = `${params.id}::${params.field}`;
                        const ids = Array.isArray(params.value) ? params.value : [];
                        const labels = ids
                            .map(id => dti.find(x => x.id === id)?.value)
                            .filter(Boolean);

                        return (
                            <ListEyeCell
                                items={labels}
                                isPending={!!pendingMap[key]}
                                maxLines={4}
                            />
                        );
                    },
                    renderEditCell: (params) => <DtiMultiEditCell {...params} />,
                };
            }

            if (col.field === 'execution') {
                const valueOptions = Object.entries(ExecutionFrequencyMap).map(([value, label]) => ({value, label}))
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable,
                    type: 'singleSelect',
                    valueOptions,
                    minWidth: col.minWidth ?? 180,
                    flex: col.flex ?? 0.8,
                    resizable: true,
                    renderHeader,
                    renderCell: (p) => {
                        const label = ExecutionFrequencyMap[p.value] ?? '—'
                        const key = `${p.id}::${p.field}`
                        return <LongTextCell value={label} isPending={!!pendingMap[key]}/>
                    },
                }
            }

            if (col.field === 'complexity') {
                const valueOptions = [
                    {value: 'SIMPLE', label: COMPLEXITY_LABEL.SIMPLE},
                    {value: 'MIDDLE', label: COMPLEXITY_LABEL.MIDDLE},
                    {value: 'HARD', label: COMPLEXITY_LABEL.HARD},
                ]
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable,
                    type: 'singleSelect',
                    valueOptions,
                    minWidth: col.minWidth ?? 140,
                    flex: col.flex ?? 0.6,
                    resizable: true,
                    renderHeader,
                    renderCell: (p) => {
                        const v = typeof p.value === 'string' ? p.value : ''
                        const label = COMPLEXITY_LABEL[v] ?? '—'
                        const key = `${p.id}::${p.field}`
                        const isPending = !!pendingMap[key]
                        return (
                            <Box sx={{position: 'relative', width: '100%', py: 0.75}}>
                                <Box
                                    sx={(theme) => ({
                                        display: 'inline-flex', alignItems: 'center',
                                        padding: '2px 8px', borderRadius: 999,
                                        fontSize: 12, fontWeight: 600, lineHeight: 1.6,
                                        border: '1px solid', ...ComplexityChipCell(theme, v),
                                    })}
                                >
                                    {label}
                                </Box>
                                {isPending && (
                                    <Box sx={{position: 'absolute', right: 6, top: 8, width: 16}}>
                                        <LinearProgress variant="indeterminate"/>
                                    </Box>
                                )}
                            </Box>
                        )
                    },
                }
            }

            if (col.field === 'action') {
                const valueOptions = [
                    {value: 'REMOVE', label: EFFECTIVENESS_LABEL.REMOVE},
                    {value: 'KEEP', label: EFFECTIVENESS_LABEL.KEEP},
                    {value: 'OPTIMIZE', label: EFFECTIVENESS_LABEL.OPTIMIZE},
                ]
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable,
                    type: 'singleSelect',
                    valueOptions,
                    minWidth: col.minWidth ?? 140,
                    flex: col.flex ?? 0.6,
                    resizable: true,
                    renderHeader,
                    renderCell: (p) => {
                        const v = typeof p.value === 'string' ? p.value : '';
                        const label = EFFECTIVENESS_LABEL[v] ?? '—';
                        const isEmpty = !v || !EFFECTIVENESS_LABEL[v]; // пусто/неизвестно → простой прочерк

                        const key = `${p.id}::${p.field}`;
                        const isPending = !!pendingMap[key];

                        return (
                            <Box sx={{position: 'relative', width: '100%', py: 0.75}}>
                                {isEmpty ? (
                                    // простой прочерк без обводки/пилюли/отступов
                                    <Box component="span" sx={{fontSize: 14, fontWeight: 400, lineHeight: 1,}}>
                                        —
                                    </Box>
                                ) : (
                                    // выбранное значение — ваша пилюля со стилями EffectivenessCell
                                    <Box
                                        sx={(theme) => ({
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            lineHeight: 1.6,
                                            border: '1px solid',
                                            ...EffectivenessCell(theme, v),
                                        })}
                                    >
                                        {label}
                                    </Box>
                                )}

                                {isPending && (
                                    <Box sx={{position: 'absolute', right: 6, top: 8, width: 16}}>
                                        <LinearProgress variant="indeterminate"/>
                                    </Box>
                                )}
                            </Box>
                        );
                    },
                }
            }


            if (col.field === 'effectiveness') {
                const valueOptions = [1, 2, 3, 4, 5].map(n => ({value: n, label: String(n)}));

                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable,
                    type: 'singleSelect',
                    valueOptions,
                    minWidth: col.minWidth ?? 120,
                    flex: col.flex ?? 0.4,
                    resizable: true,
                    renderHeader,
                    renderCell: (p) => {
                        const n = typeof p.value === 'number' ? p.value : Number(p.value);
                        const isEmpty = p.value == null || !Number.isFinite(n);

                        const key = `${p.id}::${p.field}`;
                        const isPending = !!pendingMap[key];

                        return (
                            <Box sx={{position: 'relative', width: '100%', py: 0.75}}>
                                {isEmpty ? (
                                    // ← ПУСТО: простой прочерк без любых «воздушных» стилей
                                    <Box component="span" sx={{fontSize: 14, fontWeight: 400, lineHeight: 1}}>
                                        —
                                    </Box>
                                ) : (
                                    // ← ЧИСЛО: «пилюля» с крупным жирным шрифтом и цветом по шкале
                                    <Box
                                        sx={(t) => {
                                            const colorByNum = {
                                                1: t.palette.error.main,
                                                2: t.palette.warning.main,
                                                3: t.palette.info.main,
                                                4: t.palette.success.light,
                                                5: t.palette.success.main,
                                            };
                                            const c = colorByNum[n] || t.palette.text.primary;
                                            return {
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '4px 10px',
                                                color: c,
                                                fontSize: 14,
                                                fontWeight: 800,
                                                lineHeight: 1.1,
                                                letterSpacing: 0.2,
                                            };
                                        }}
                                    >
                                        {String(n)}
                                    </Box>
                                )}

                                {isPending && (
                                    <Box sx={{position: 'absolute', right: 6, top: 8, width: 16}}>
                                        <LinearProgress variant="indeterminate"/>
                                    </Box>
                                )}
                            </Box>
                        );
                    },
                };
            }

            if (col.field === 'customerId') {
                return {
                    ...col,
                    headerName,
                    sortable: false,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: customersMiudolLabelById,
                    valueFormatter: (value) => {
                        return customersMiudol?.find(cur => cur.id === value)?.name || '';
                    },
                    valueSetter: (value, row) => {
                        if (value !== undefined) {
                            return {...row, customerId: value};
                        }
                        return row;
                    },
                    minWidth: col.minWidth ?? 200,
                    flex: col.flex ?? 0.9,
                    resizable: true,
                    renderEditCell: (params) => (
                        <SelectEditAutocomplete params={params} options={customersMiudolLabelById}/>
                    ),
                    renderHeader,
                }
            }

            // базовые текстовые поля
            const base = {
                ...col,
                headerName,
                sortable: false,
                editable,
                minWidth: col.minWidth ?? 160,
                flex: col.flex ?? 1,
                resizable: true,
                renderHeader,
                renderCell: renderLong,
            }

            if (editable) {
                base.renderEditCell = (params) => (
                    <Box sx={{
                        p: 0.75, width: '100%',
                        '& textarea': {
                            color: 'text.secondary', caretColor: 'primary.main',
                            backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider',
                            borderRadius: 1, width: '100%', boxSizing: 'border-box',
                            font: 'inherit', lineHeight: 1.4, padding: 1, resize: 'none', outline: 'none',
                        },
                        '& textarea:focus': {
                            borderColor: 'primary.main',
                            boxShadow: '0 0 0 2px rgba(37,99,235,0.2)',
                            backgroundColor: 'background.paper',
                        },
                        '& textarea::placeholder': {color: 'text.disabled'},
                    }}>
                        <TextareaAutosize
                            autoFocus
                            defaultValue={params.value ?? ''}
                            minRows={3}
                            onKeyDown={(e) => {
                                const id = params.id;
                                const field = params.field;

                                // ESC — откат без сохранения
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    params.api?.stopCellEditMode({id, field, ignoreModifications: true});
                                    return;
                                }

                                // ENTER — попытка сохранить
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    const cleaned = sanitizeTextOrNull(e.currentTarget.value);
                                    if (cleaned == null) {
                                        // «некорректно» — откат к старому
                                        params.api?.stopCellEditMode({id, field, ignoreModifications: true});
                                        return;
                                    }
                                    params.api?.setEditCellValue({id, field, value: cleaned}, e);
                                    params.api?.stopCellEditMode({id, field});
                                    return;
                                }

                                // Ctrl/Cmd+Enter — тоже сохранить
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                    const cleaned = sanitizeTextOrNull(e.currentTarget.value);
                                    if (cleaned == null) {
                                        params.api?.stopCellEditMode({id, field, ignoreModifications: true});
                                        return;
                                    }
                                    params.api?.setEditCellValue({id, field, value: cleaned}, e);
                                    params.api?.stopCellEditMode({id, field});
                                    return;
                                }
                            }}
                            onBlur={(e) => {
                                // На блюре ведём себя как «сохранить, если корректно; иначе — откат»
                                const id = params.id;
                                const field = params.field;
                                const cleaned = sanitizeTextOrNull(e.currentTarget.value);

                                if (cleaned == null) {
                                    params.api?.stopCellEditMode({id, field, ignoreModifications: true});
                                    return;
                                }
                                params.api?.setEditCellValue({id, field, value: cleaned}, e);
                            }}
                        />
                    </Box>
                );
            }

            return base
        })
    }, [
        columnsState,
        curatorLabelById, departmentsLabelById, headLabelById, dtiLabelById,
        customersMiudolLabelById, customersCaLabelById,
        renderHeader, renderLong, pendingMap
    ])

    const columns = useMemo(
        () => [ID_COL, ROW_NUMBER_COL, ACCEPT_COL, ...dataCols, ACTIONS_COL],
        [ID_COL, ROW_NUMBER_COL, ACCEPT_COL, dataCols, ACTIONS_COL]
    );

    // модалки
    const [openAdd, setOpenAdd] = React.useState(false);
    const handleAddClick = React.useCallback(() => setOpenAdd(true), []);
    const handleCloseAdd = React.useCallback(() => setOpenAdd(false), []);

    const [form, setForm] = React.useState({
        curatorId: '',
        departmentNameId: '',
        departmentHeadId: '',
        functionBlock: '',
        function: '',
        functionDetails: '',
        dtiIds: [],
        customerId: '',
        howCustomerUses: '',
        whyCustomerUses: '',
        complexity: '',
        reason: '',
        execution: '',
        artifact: '',
    });

    const handleSaveAdd = React.useCallback(async () => {
        const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
        try {
            await dispatch(addRecord(payload)).unwrap();
            setOpenAdd(false);
            setForm({
                curatorId: '', departmentNameId: '', departmentHeadId: '',
                functionBlock: '', function: '', functionDetails: '',
                dtiIds: [], customerId: '', howCustomerUses: '',
                whyCustomerUses: '', complexity: '', reason: '',
                execution: '', artifact: '',
            });
        } catch (e) {
            console.error('Не удалось добавить запись', e);
        }
    }, [dispatch, form]);

    const executionOptions = React.useMemo(
        () => Object.entries(ExecutionFrequencyMap).map(([value, label]) => ({value, label})),
        []
    );

    // const openById = React.useCallback((id) => {
    //     const idx = rows.findIndex(r => String(r.id) === String(id));
    //     if (idx !== -1) {
    //         setView({ open: true, index: idx });
    //     } else {
    //         // опционально: можно подгрузить, показать тост, etc.
    //         console.warn('Запись с таким ID не найдена в текущем списке:', id);
    //     }
    // }, [rows]);

    // 1) Рефы для «отложенного» открытия и (опционально) возврата фильтров
    const pendingOpenIdRef = React.useRef(null);
    const prevFiltersRef = React.useRef(null);

// 3) Обновлённый openById: если не нашли — чистим фильтры и откроем после обновления rows
    const openById = React.useCallback((id) => {
        const idStr = String(id);
        const idx = rows.findIndex(r => String(r.id) === idStr);

        if (idx !== -1) {
            setView({open: true, index: idx});
            return;
        }

        // не видно из-за фильтра: запомним цель и текущие фильтры, очистим фильтры
        pendingOpenIdRef.current = idStr;
        prevFiltersRef.current = filters; // если не хочешь авто-возврат, можно убрать эту строку
        clearAllFilters();
    }, [rows, filters, clearAllFilters]);

// 4) Когда rows обновятся после очистки — попробуем открыть нужную строку
    React.useEffect(() => {
        const target = pendingOpenIdRef.current;
        if (!target) return;

        const idx = rows.findIndex(r => String(r.id) === target);
        if (idx !== -1) {
            pendingOpenIdRef.current = null;
            setView({open: true, index: idx});
        }
    }, [rows]);

// 5) (Опционально) Возврат фильтров при закрытии карточки
    const closeRowView = React.useCallback(() => {
        setView({open: false, index: -1});

        if (prevFiltersRef.current) {
            const snapshot = prevFiltersRef.current;
            prevFiltersRef.current = null;
            // аккуратно восстановим (если нужно — оставь; не нужно — убери блок целиком)
            Object.entries(snapshot).forEach(([field, values]) => {
                dispatch(setFilter({field, values: values ?? null}));
            });
        }
    }, [dispatch]);

    return (
        <Box sx={{height: 'calc(100vh - 148px)', width: '100%', p: 2}}>
			{agentOpen && <AiDialogView onClose={() => setAgentOpen(false)} />}
		
            <DataGridPro
                // редактируемость строк целиком по флагу commonFields (как было у тебя сейчас)
                isCellEditable={({row}) => row.editableRow && !row.isAcceptedRow}

                getCellClassName={(params) => {
                    if (params.field === '__rowNum__' || params.field === 'id') return '';
                    return isEditableCell(params.row) ? '' : 'cell-readonly';
                }}

                pinnedColumns={{left: ['__rowNum__', 'acceptStage', 'id',]}}
                rows={rows}
                columns={columns}

                // ГРУППЫ ЗАГОЛОВКОВ
                columnGroupingModel={COLUMN_GROUPS}
                columnHeaderHeight={40}

                pagination={false}
                showCellVerticalBorder
                showColumnVerticalBorder
                getRowHeight={() => 'auto'}
                getEstimatedRowHeight={() => 120}
                disableColumnFilter
                disableColumnMenu
                disableColumnSorting
                disableColumnReorder
                disableRowSelectionOnClick
                slots={{footer: AddFunctionFooter}}
                slotProps={{
                    footer: {
                        onAdd: handleAddClick,
                        count: rows.length,
                        hasAnyFilters,
                        onClearAll: clearAllFilters,
						onOpenAgent: () => setAgentOpen(true),
                    },
                }}
                processRowUpdate={handleProcessRowUpdate}
                onProcessRowUpdateError={(err) => console.error('[grid] processRowUpdate error', err)}
                density="compact"
                sx={(theme) => ({
                    '& .MuiDataGrid-cell': {
                        alignItems: 'flex-start',
                        position: 'relative',
                        transition: 'background-color 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
                    },
                    '& .MuiDataGrid-columnHeader': {
                        backgroundColor: (theme) => theme.palette.background.paper,
                    },
                    '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                        borderRight: '1px solid', borderColor: 'divider',
                    },
                    '& .MuiDataGrid-columnHeader:last-of-type, & .MuiDataGrid-cell:last-of-type': {
                        borderRight: 'none',
                    },

                    /* --- pinned (фиксированные) колонки --- */
                    '& .MuiDataGrid-cell--pinnedLeft, & .MuiDataGrid-columnHeader--pinnedLeft': {
                        position: 'sticky',
                        left: 0,
                        zIndex: 7,
                        background: theme.palette.background.paper,
                        boxShadow: `2px 0 6px ${alpha(theme.palette.divider, 0.06)}`,
                    },
                    '& .MuiDataGrid-columnHeader--pinnedLeft': {zIndex: 7},

                    '& .MuiDataGrid-cell--editing:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.10),
                        borderRightColor: 'transparent',
                    },
                    '& .MuiDataGrid-cell--editing:hover::after': {
                        content: '""', position: 'absolute', inset: 0,
                        border: `1px solid ${theme.palette.primary.main}`, pointerEvents: 'none', borderRadius: 0,
                    },
                    '& .MuiDataGrid-cell:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        borderRightColor: 'transparent',
                    },
                    '& .MuiDataGrid-cell:hover::after': {
                        content: '""',
                        position: 'absolute', inset: 0,
                        border: `1px solid ${theme.palette.primary.main}`,
                        pointerEvents: 'none',
                        borderRadius: 0,
                    },

                    // === READONLY-ЯЧЕЙКИ ==================================================
                    '& .cell-readonly': {
                        backgroundColor: alpha(theme.palette.action.disabledBackground, 0.2),
                        color: theme.palette.text.disabled,
                        cursor: 'not-allowed',
                        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.divider, 0.8)}`,
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 14,
                            height: 14,
                            opacity: 0.7,
                            overflow: 'hidden', // <-- добавь это, чтобы фон не "вылазил"
                            zIndex: 1,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '14px 14px',
                            backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(theme.palette.text.disabled)}'>
                  <path d='M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z'/>
                </svg>
              `)}")`,
                            pointerEvents: 'none',
                        },
                    },
                    '& .MuiDataGrid-cell--pinnedLeft.cell-readonly': {
                        position: 'sticky !important',
                        left: 0,
                        zIndex: 3,
                    },
                    '& .MuiDataGrid-columnHeader--pinnedLeft.cell-readonly': {
                        position: 'sticky !important',
                        left: 0,
                        zIndex: 4,
                    },
                    '& .cell-readonly .cell-eye-btn': {
                        pointerEvents: 'auto',
                        opacity: 1,
                        cursor: 'pointer',
                    },
                    '& .cell-readonly:hover::after': {display: 'none'},

                    '& .MuiDataGrid-columnHeadersInner > .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeader': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',      // ← центр по горизонтали
                        textAlign: 'center',
                    },
                    // 2) На всякий случай — внутренние контейнеры заголовка (draggable/title)
                    '& .MuiDataGrid-columnHeadersInner > .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeaderDraggableContainer': {
                        width: '100%',
                        justifyContent: 'center',
                    },
                    '& .MuiDataGrid-columnHeadersInner > .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeaderTitleContainer': {
                        width: '100%',
                        justifyContent: 'center',
                    },
                    '& .MuiDataGrid-columnHeadersInner > .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeaderTitle': {
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 700,
                    },

                    // TARGET GROUPED HEADERS SPECIFICALLY
                    // 1) The header cell itself (the <th> with aria-colspan)
                    '& .MuiDataGrid-columnHeadersInner [role="columnheader"][aria-colspan]:not([aria-colspan="1"])': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                    },

                    // 2) The draggable container
                    '& .MuiDataGrid-columnHeadersInner [role="columnheader"][aria-colspan]:not([aria-colspan="1"]) .MuiDataGrid-columnHeaderDraggableContainer': {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    },

                    // 3) The title container - CRITICAL: remove left padding
                    '& .MuiDataGrid-columnHeadersInner [role="columnheader"][aria-colspan]:not([aria-colspan="1"]) .MuiDataGrid-columnHeaderTitleContainer': {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        paddingLeft: '0 !important',  // Force remove default padding
                        paddingRight: '0 !important',
                    },

                    // 4) The title text itself
                    '& .MuiDataGrid-columnHeadersInner [role="columnheader"][aria-colspan]:not([aria-colspan="1"]) .MuiDataGrid-columnHeaderTitle': {
                        width: '100%',
                        textAlign: 'center',
                        fontWeight: 700,
                    },

                    // Keep your background styling
                    '& .MuiDataGrid-columnHeadersInner > .MuiDataGrid-columnHeaderRow:first-of-type': {
                        background: alpha(theme.palette.primary.main, 0.06),
                    },

                    // FORCE CENTER ALIGNMENT FOR GROUPED HEADERS - Multiple targeting strategies

                    // Strategy 1: Target by columnHeaderRow position
                    '& .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeader': {
                        justifyContent: 'center !important',
                        textAlign: 'center !important',
                        '& > *': {
                            justifyContent: 'center !important',
                        },
                    },

                    '& .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeaderDraggableContainer': {
                        width: '100%',
                        justifyContent: 'center !important',
                        display: 'flex !important',
                    },

                    '& .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeaderTitleContainer': {
                        width: '100%',
                        justifyContent: 'center !important',
                        display: 'flex !important',
                        paddingLeft: '0 !important',
                        paddingRight: '0 !important',
                        flexGrow: 1,
                    },

                    '& .MuiDataGrid-columnHeaderRow:first-of-type .MuiDataGrid-columnHeaderTitle': {
                        width: '100%',
                        textAlign: 'center !important',
                        fontWeight: 700,
                        flexGrow: 1,
                    },

                    // Strategy 2: Target by aria-colspan attribute (for grouped columns)
                    '& [role="columnheader"][aria-colspan]': {
                        justifyContent: 'center !important',
                        display: 'flex !important',

                        '& .MuiDataGrid-columnHeaderDraggableContainer': {
                            width: '100%',
                            justifyContent: 'center !important',
                            display: 'flex !important',
                        },

                        '& .MuiDataGrid-columnHeaderTitleContainer': {
                            width: '100%',
                            justifyContent: 'center !important',
                            display: 'flex !important',
                            paddingLeft: '0 !important',
                            paddingRight: '0 !important',
                            margin: '0 auto',
                        },

                        '& .MuiDataGrid-columnHeaderTitle': {
                            width: '100%',
                            textAlign: 'center !important',
                            fontWeight: 700,
                        },
                    },
                    // Strategy 3: Override any columnGroupHeader specific classes
                    '& .MuiDataGrid-columnGroupHeader': {
                        justifyContent: 'center !important',

                        '& .MuiDataGrid-columnHeaderDraggableContainer': {
                            justifyContent: 'center !important',
                        },

                        '& .MuiDataGrid-columnHeaderTitleContainer': {
                            justifyContent: 'center !important',
                            paddingLeft: '0 !important',
                        },
                    },
                    // Keep your background styling
                    '& .MuiDataGrid-columnHeaderRow:first-of-type': {
                        background: alpha(theme.palette.primary.main, 0.06),
                    },
                    // === pinned left surface isolation ===
                    '& .MuiDataGrid-pinnedColumns': {
                        backgroundColor: theme.palette.background.paper,
                        position: 'relative',
                        zIndex: 5,
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: -1,
                            width: 1,
                            height: '100%',
                            backgroundColor: theme.palette.divider,
                        },
                    },

                    // optional — поднимаем acceptStage компонент
                    '& .MuiDataGrid-cell[data-field="acceptStage"]': {
                        zIndex: 10,
                        background: theme.palette.background.paper,
                    },
                    '& .MuiDataGrid-cell--editing': {
                        overflow: 'visible',     // чтобы инпут/иконки не резались
                        zIndex: 2,               // поверх соседей
                    },
                })}
            />

            {/* ===== Модалка "Добавить функцию" ===== */}
            <AddFunctionDialog
                open={openAdd}
                onClose={handleCloseAdd}
                onSave={handleSaveAdd}
                form={form}
                setForm={setForm}
                curatorLabelById={curatorLabelById}
                departmentsLabelById={departmentsLabelById}
                headLabelById={headLabelById}
                dtiLabelById={dtiLabelById}
                customersMiudolLabelById={customersMiudolLabelById}
                customersCaLabelById={customersCaLabelById}
                executionOptions={executionOptions}
            />

            {/* ===== Модалка "Удалить функцию" ===== */}
            <ConfirmDeleteDialog
                open={confirm.open}
                title="Удалить запись?"
                message="Это действие необратимо. Подтвердить удаление?"
                onCancel={() => setConfirm({open: false, id: null})}
                isProcessing={confirm.id != null && !!pendingMap[`del::${confirm.id}`]}
                onConfirm={() => {
                    if (confirm.id != null) {
                        dispatch(deleteRecordThunk(confirm.id));
                    }
                    setConfirm({open: false, id: null});
                }}
            />

            <RowViewDialog
                open={view.open}
                onClose={closeRowView}
                row={currentRow}
                columns={columns}
                maps={{
                    curators,
                    departments,
                    head,
                    dti,
                    customersMiudol,
                    customersCa,
                    ExecutionFrequencyMap,
                    COMPLEXITY_LABEL,
                    OWNER_LABEL,
                    STAGE_LABEL, // ← добавь это
                }}
                onPrev={goPrev}
                onNext={goNext}
                canPrev={canPrev}
                canNext={canNext}
                onAcceptSave={handleProcessRowUpdate} // ← важно!

                onOpenById={openById}

            />

            <ColumnFilterPopover/>
        </Box>
    )
}
