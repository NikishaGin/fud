// src/features/records/components/ColumnFilterPopover.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Popover, Box, Typography, FormGroup, FormControlLabel, Checkbox, Button, TextField,
    InputAdornment, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { closeFilterPopover } from '../../ui/uiSlice.js';
import {
    makeSelectUniqueValues,
    setFilter,
    selectColumns,
    selectCurators,
    selectHead,
    selectDepartment,
    selectDti,
    selectCustomersMiudol,
    selectCustomersCa,
    selectRows,
} from '../recordsSlice.js';
import { getLatestStage } from '../../../utils/acceptFilter.js';
import { STAGE_LABEL } from './accept/AcceptCell.jsx';
import {
    ExecutionFrequencyMap,
    OWNER_LABEL,
    COMPLEXITY_LABEL,
    EFFECTIVENESS_LABEL,
} from "../constants/records.js";


// ключ-комбинации: массив кодов -> отсортировать -> join('|')
const makeComboKey = (codes) => codes.slice().sort().join('|');

export default function ColumnFilterPopover() {
    const dispatch = useDispatch();
    const { open, column, anchorElId } = useSelector((s) => s.ui.filterPopover);

    const allRows = useSelector(selectRows);

    // Если открыли фильтр у первой колонки (номер строки), фактически фильтруем по emptyRow
    const effectiveField = column === '__rowNum__' ? 'emptyRow' : column;

    const curators = useSelector(selectCurators);
    const department = useSelector(selectDepartment);
    const head = useSelector(selectHead);
    const dti = useSelector(selectDti);
    const customersMiudol = useSelector(selectCustomersMiudol);
    const customersCa = useSelector(selectCustomersCa);

    const columns = useSelector(selectColumns);
    const headerName = useMemo(() => {
        if (column === '__rowNum__') return 'Заполнение';
        return columns.find((c) => c.field === column)?.headerName ?? column ?? '';
    }, [columns, column]);

    // Селектор уникальных значений строим по *effectiveField*
    const selectUniqueValues = useMemo(() => makeSelectUniqueValues(effectiveField), [effectiveField]);
    const uniqueValues = useSelector((state) => (effectiveField ? selectUniqueValues(state) : []));
    const filters = useSelector((s) => s.records.filters);

    // Лейблы для emptyRow
    const EMPTY_LABEL = 'Не заполнено'; // emptyRow === true
    const FILLED_LABEL = 'Заполнено';   // emptyRow === false

    // Нормализованные значения для чекбоксов
    const normValues = useMemo(() => {
        if (!effectiveField) return [];

        // Акцепт — уникальные стадии по последнему статусу
        if (effectiveField === 'acceptStage') {
            const stages = new Set();
            allRows.forEach((r) => stages.add(getLatestStage(r)));
            return Array.from(stages);
        }

        if (effectiveField === 'emptyRow') {
            const set = new Set();
            uniqueValues.forEach((v) => {
                if (v === true || v === false) set.add(v);
            });
            return Array.from(set);
        }

        if (effectiveField === 'sources') {
            const combos = new Map(); // key -> codes[]
            const toCode = (x) => (typeof x === 'string' ? x : x?.value);

            uniqueValues.forEach((v) => {
                const codes = (Array.isArray(v) ? v : [v]).map(toCode).filter(Boolean);
                if (codes.length === 0) {
                    const key = '';
                    if (!combos.has(key)) combos.set(key, []);
                    return;
                }
                const key = makeComboKey(codes);
                if (!combos.has(key)) combos.set(key, codes);
            });

            return Array.from(combos.keys()); // ["MIUDOL", "MIUDOL|UOPB", ...]
        }

        if (effectiveField === 'dtiIds') {
            const set = new Set();
            const toId = (x) => (typeof x === 'object' ? x?.id : x);
            uniqueValues.forEach((v) => {
                const ids = Array.isArray(v) ? v.map(toId) : [toId(v)];
                ids.filter((id) => id != null).forEach((id) => set.add(id));
            });
            return Array.from(set);
        }

        return uniqueValues;
    }, [uniqueValues, effectiveField, allRows]);

    // Подпись чекбокса для конкретного нормализованного значения
    const labelFor = (value) => {
        if (effectiveField === 'acceptStage') {
            const stageLabel = STAGE_LABEL[value] ?? String(value);
            return stageLabel;
        }

        if (effectiveField === 'emptyRow') {
            return value === true ? EMPTY_LABEL : FILLED_LABEL;
        }

        if (['customerId', 'customerCAId'].includes(effectiveField) && value === '—') return 'Неизвестно';
        if (value == null || value === '—') return '—';

        if (effectiveField === 'curatorId') return curators.find((c) => c.id === value)?.name ?? String(value);
        if (effectiveField === 'departmentNameId') return department.find((c) => c.id === value)?.name ?? String(value);
        if (effectiveField === 'departmentHeadId') return head.find((c) => c.id === value)?.name ?? String(value);
        if (effectiveField === 'customerId') return customersMiudol.find((c) => c.id === value)?.name ?? String(value);
        if (effectiveField === 'customerCAId') return customersCa.find((c) => c.id === value)?.name ?? String(value);
        if (effectiveField === 'dtiIds') {
            const label = dti.find((t) => t.id === value)?.value;
            return label ?? String(value);
        }
        if (effectiveField === 'complexity') return COMPLEXITY_LABEL[value] ?? String(value);
        if (effectiveField === 'execution') return ExecutionFrequencyMap[value] ?? String(value);
        if (effectiveField === 'action') return EFFECTIVENESS_LABEL[value] ?? String(value);

        if (effectiveField === 'sources') {
            if (value === '') return '—';
            const codes = value.split('|').filter(Boolean);
            return codes.map((c) => OWNER_LABEL[c] ?? c).join(', ');
        }


        return String(value);
    };

    const options = useMemo(
        () =>
            normValues
                .map((v) => ({ value: v, label: labelFor(v) }))
                .sort((a, b) => a.label.localeCompare(b.label, 'ru')),
        [normValues, effectiveField]
    );

    const [localSet, setLocalSet] = useState(null);
    const [query, setQuery] = useState('');
    const anchorEl = anchorElId ? document.getElementById(anchorElId) : null;

    // видимые (отфильтрованные по поиску) опции
    const visibleOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(({ label }) => label.toLowerCase().includes(q));
    }, [options, query]);

    useEffect(() => {
        if (open && effectiveField) {
            const existing = filters[effectiveField]; // Set | null (в НОРМАЛИЗОВАННЫХ значениях!)
            setLocalSet(existing ? new Set(Array.from(existing)) : new Set(normValues));
            setQuery(''); // сбросить текст поиска при открытии
        }
    }, [open, effectiveField, filters, normValues]);

    const toggleValue = (val) => {
        const next = new Set(localSet);
        next.has(val) ? next.delete(val) : next.add(val);
        setLocalSet(next);
    };

    const selectAll = () => setLocalSet(new Set(normValues));
    const reset = () => setLocalSet(new Set());
    const selectVisible = () => setLocalSet((prev) => {
        const next = new Set(prev ?? []);
        visibleOptions.forEach(({ value }) => next.add(value));
        return next;
    });
    const unselectVisible = () => setLocalSet((prev) => {
        const next = new Set(prev ?? []);
        visibleOptions.forEach(({ value }) => next.delete(value));
        return next;
    });

    const apply = () => {
        const allSelected = localSet && normValues.length === localSet.size;
        dispatch(setFilter({ field: effectiveField, values: allSelected ? null : localSet }));
        dispatch(closeFilterPopover());
    };

    const handleClose = () => dispatch(closeFilterPopover());

    return (
        <Popover
            open={open}
            onClose={handleClose}
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
            <Box sx={{ p: 2, minWidth: 380, maxWidth: 520 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Фильтр: {headerName}
                </Typography>

                {/* Поиск по опциям */}
                <TextField
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск значений…"
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: query ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setQuery('')} aria-label="clear-search">
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />

                {/* Кнопки массового выбора */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={selectAll}>Выбрать все</Button>
                    <Button size="small" variant="outlined" onClick={reset} color="warning">Сброс</Button>
                </Box>

                {/* Список чекбоксов (фильтрованный) */}
                <FormGroup sx={{ maxHeight: 280, overflowY: 'auto', pr: 1 }}>
                    {visibleOptions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, py: 1 }}>
                            Ничего не найдено
                        </Typography>
                    ) : (
                        visibleOptions.map(({ value, label }) => (
                            <FormControlLabel
                                key={String(value)}
                                control={
                                    <Checkbox
                                        checked={!!localSet && localSet.has(value)}
                                        onChange={() => toggleValue(value)}
                                        size="small"
                                    />
                                }
                                label={label}
                            />
                        ))
                    )}
                </FormGroup>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                    <Button onClick={handleClose}>Отмена</Button>
                    <Button variant="contained" onClick={apply}>Применить</Button>
                </Box>
            </Box>
        </Popover>
    );
}
