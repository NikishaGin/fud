// src/features/records/components/dialogs/RowViewDialog.jsx
import React from 'react';
import {
    Dialog, Box, Typography, Stack, IconButton, Tooltip, Paper,
    Chip, Button, Autocomplete, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import {useDispatch, useSelector} from 'react-redux';
import {deleteTreeThunk, selectTree2, selectTreeStatus2} from '../../recordsSlice.js';
import AcceptCell, {STAGE_LABEL as ACCEPT_STAGE_LABEL} from '../accept/AcceptCell.jsx';
import {
    fetchTreeChildren,
    fetchTreeParents,
    saveAddChildLink,
    saveParentLink,
    selectTree,
    selectTreeStatus
} from '../../recordsSlice.js';

/* ---------- atoms ---------- */
const LabelWithInfo = ({text, hint}) => (
    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5, lineHeight: 1}}>
        {hint ? (
            <Tooltip title={hint} placement="top" arrow>
                <InfoOutlinedIcon
                    fontSize="inherit"
                    sx={{fontSize: 16, color: 'text.secondary', cursor: 'help'}}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                />
            </Tooltip>
        ) : null}
        <Box component="span">{text}</Box>
    </Box>
);

const Section = ({ title, children }) => (
    <Box sx={{ mt: 2, '&:first-of-type': { mt: 1 } }}>
        <Typography
            variant="subtitle2"
            sx={{
                mb: 0.75,
                fontWeight: 700,
                color: 'text.secondary',
            }}
        >
            {title}
        </Typography>

        <Paper
            elevation={0}
            variant="outlined"
            sx={{
                borderRadius: 1,
                overflow: 'hidden',
            }}
        >
            {children}
        </Paper>
    </Box>
);



const FieldRow = ({ label, children }) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '240px 1fr' },
            columnGap: { xs: 1.5, sm: 2.5 },
            rowGap: { xs: 0.5, sm: 0 },
            alignItems: 'flex-start',
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 1.1 },
            '&:not(:last-of-type)': {
                borderBottom: '1px solid',
                borderColor: 'divider',
            },
        }}
    >
        {/* Лейбл слева */}
        <Typography
            variant="body2"
            sx={{
                color: 'text.secondary',
                fontWeight: 600,
                lineHeight: 1.4,
                pr: { sm: 1 },
            }}
        >
            {label}
        </Typography>

        {/* Значение справа */}
        <Box
            sx={{
                fontSize: 14,
                lineHeight: 1.6,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                color: 'text.primary',
            }}
        >
            {children ?? '—'}
        </Box>
    </Box>
);



/* ---------- config ---------- */
const SECTION_FIELDS = {
    'Исполнитель': ['sources', 'curatorId', 'departmentNameId', 'departmentHeadId'],
    'Идентификация': ['functionBlock', 'function', 'functionDetails'],
    'Значимость': ['dtiIds', 'customerId', 'howCustomerUses', 'whyCustomerUses'],
    'Атрибуты': ['complexity', 'reason', 'execution', 'artifact'],
};

const HINTS = {
    sources: 'Владелец записи / источник данных.',
    curatorId: 'ФИО начальника инспекции/управления, заместителя начальника инспекции/управления, который курирует отдел\n' +
        'Пример заполнения: Андрусенко Д.Л.',
    departmentNameId: 'Наименование отдела, на который возложено выполнение функции\n' +
        'Пример заполнения: Отдел мониторинга имущественного обеспечения',
    departmentHeadId: 'ФИО начальника (и.о. начальника) отдела, выполняющего функцию\n' +
        'Пример заполнения: Гурьев Р.И.',
    functionBlock: 'Короткое наименование направления, к которому относится функция\n' +
        'Пример заполнения: Площадка реструктуризации долга',
    function: 'Наименование функции, которую выполняет отдел\n' +
        'Пример заполнения: Регистрация уведомлений ТНО о залоге движимого имущества',
    functionDetails: 'Пошаговое описание, что необходимо сделать для выполнения функции\n' +
        'Пример заполнения: 1. Формирование пакета документов в ФНП.2. Получение статуса обработки. 3. Направление информации в ТНО',
    dtiIds: 'Выбор проекта Стратегии Д, у которого есть связь с выполняемой функцией \n' +
        'Пример заполнения: DTI-38, Эффективный залог',
    customerId: 'Выбор заказчика - инициатора выполнения данного функционал. Пример: для функций МИУДОЛ это отдел ФНС России, для ФНС России это руководитель, зам.руководителя, НУ / ЗНУ, другие ОГВ.',
    howCustomerUses: 'Описание действий пользователя после выполнения функции и получения ее результатов \n' +
        'Пример заполнения: Предоставление данных в суд, прекращение залога',
    whyCustomerUses: 'Описание цели использования результатов функции\n' +
        'Пример заполнения: Обеспечение регистрации предмета залога с целью его реализации',
    complexity: 'Выбор оценки сложности выполнения функции (низкая, средняя, высокая).\n' +
        'Пример заполнения: средняя',
    reason: 'Указание документа, на основании которого осуществляется выполнение функции (вид, дата и номер)\n' +
        'Пример заполнения: Письмо ФНС России от 01.01.2025 № 18-01/156',
    execution: 'Выбор частоты выполнения функции\n' +
        'Пример заполнения: ежеквартально',
    artifact: 'Указание последнего документа, который является результатом выполнения функции\n' +
        'Пример заполнения: Письмо МИУДОЛ от 15.02.2025 № 13-01/125',
    estimationII: 'Оценка ИИ',
    effectiveness: 'Выбор оценки полезности результатов выполнения функции от 1 до 5\n' +
        'Пример заполнения: 4',
    action: 'Выбор направления развития функции - что необходимо с ней сделать (оставить, убрать, оптимизировать).\n' +
        'Пример заполнения: убрать',
    comment: 'Пояснение, почему было принято решение в блоке "Что сделать с функцией?" - "убрать",  "оптимизировать"\n' +
        'Пример заполнения: Функция подлежит оптимизации, так как процесс выполнения функции можно перенести в автоматический режим.'

};

/* ---------- helpers ---------- */
const formatId = (id) => {
    const s = String(id ?? '');
    return s.startsWith('ID-') ? s : `ID-${s}`;
};
const toOption = (x) => {
    if (x == null) return null;
    if (typeof x === 'object') {
        const value = String(x.value ?? x.id ?? '');
        if (!value) return null;
        const label = String(x.label ?? x.name ?? `ID ${value}`);
        return {value, label};
    }
    const value = String(x);
    return {value, label: `ID ${value}`};
};

// Источник правды — row.{parentId|parents} и row.{childrenIds|children}
const getParentIdFromRow = (row) =>
    row?.parentId ?? row?.parents?.[0]?.parentId ?? null;

const getChildrenIdsFromRow = (row) => {
    if (Array.isArray(row?.childrenIds)) return row.childrenIds;
    if (Array.isArray(row?.children)) {
        return row.children
            .map((c) => c?.childId ?? c?.id)
            .filter((v) => v != null);
    }
    return [];
};

/* =================================================================== */

export const RowViewDialog = ({
                                  open,
                                  onClose,
                                  row,
                                  columns,
                                  maps,
                                  onPrev,
                                  onNext,
                                  canPrev,
                                  canNext,
                                  onAcceptSave,
                                  // внешние колбэки для сохранения/навигации
                                  onSetParent,
                                  onAddChild,
                                  onRemoveChild,
                                  onOpenById,

                                  // опции выбора из общего дерева
                                  allIds = [],
                              }) => {
    const {
        curators, departments, head, dti,
        customersMiudol, customersCa,
        ExecutionFrequencyMap, COMPLEXITY_LABEL,
    } = maps || {};

    const dispatch = useDispatch();
    const tree = useSelector(selectTree);             // ожидаем [{ value, label }]
    const treeStatus = useSelector(selectTreeStatus); // 'idle' | 'loading' | ...
    const tree2 = useSelector(selectTree2);             // ожидаем [{ value, label }]
    const treeStatus2 = useSelector(selectTreeStatus2); // 'idle' | 'loading' | ...

    React.useEffect(() => {
        if (open && treeStatus === 'idle') {
            dispatch(fetchTreeChildren());
            dispatch(fetchTreeParents());
        }
    }, [open, treeStatus, dispatch]);

    // достаёт relationId для родителя (если он есть)
    const getParentRelationId = (row) =>
        row?.parents?.[0]?.id ?? null;

// достаёт relationId для конкретной дочери по её childId
    const getChildRelationId = (row, childId) => {
        const rel = (row?.children || []).find(
            (c) => c.childId === childId
        );
        return rel?.id ?? null;
    };


    // локальный «снэпшот» только для оптимистического UI, без автопридумывания связей
    const demoMode = !onSetParent && !onAddChild && !onRemoveChild;
    const [demoParent, setDemoParent] = React.useState(null);
    const [demoChildren, setDemoChildren] = React.useState([]);

    // синхронизируем отображаемые связи с row при открытии/обновлении
    React.useEffect(() => {
        if (!open) return;
        setDemoParent(getParentIdFromRow(row));
        setDemoChildren(getChildrenIdsFromRow(row));
    }, [open, row?.parentId, row?.parents, row?.childrenIds, row?.children]);

    // что показывать
    const parentIdView =
        (demoMode ? demoParent : undefined) ?? getParentIdFromRow(row);

    const childrenDraft = demoMode ? demoChildren : undefined;
    const childrenIdsView =
        (Array.isArray(childrenDraft) && childrenDraft.length)
            ? childrenDraft
            : getChildrenIdsFromRow(row);

    // права на редактирование (если нужны; можно заменить своей логикой)
    const isMiudolSource = React.useMemo(() => {
        const raw = row?.sources;
        const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return arr.some((it) => {
            const v = typeof it === 'object' ? it?.value : it;
            return String(v).toUpperCase() === 'MIUDOL';
        });
    }, [row?.sources]);

    const canPickParent = isMiudolSource;   // дочка выбирает родителя
    const canAddChild = !isMiudolSource;   // родитель добавляет детей

    // безопасные сеттеры (учитывают наличие внешних колбэков)
    const setParentSafe = async (pid) => {
        if (onSetParent) return onSetParent(pid ?? null);
        setDemoParent(pid ?? null);
    };
    const addChildSafe = async (cid) => {
        if (onAddChild) return onAddChild(cid);
        setDemoChildren((arr) => (arr.includes(cid) ? arr : [...arr, cid]));
    };
    const removeChildSafe = async (cid) => {
        if (onRemoveChild) return onRemoveChild(cid);
        setDemoChildren((arr) => arr.filter((x) => x !== cid));
    };

    // источники опций для автокомплита
    const propOptions = React.useMemo(
        () => (Array.isArray(allIds) ? allIds.map(toOption).filter(Boolean) : []),
        [allIds]
    );

    const propOptions2 = React.useMemo(
        () => (Array.isArray(allIds) ? allIds.map(toOption).filter(Boolean) : []),
        [allIds]
    );

    const treeOptions = React.useMemo(
        () => (Array.isArray(tree) ? tree.map(toOption).filter(Boolean) : []),
        [tree]
    );
    const treeOptions2 = React.useMemo(
        () => (Array.isArray(tree2) ? tree2.map(toOption).filter(Boolean) : []),
        [tree2]
    );
    const allOptions = React.useMemo(() => {
        const src = propOptions.length ? propOptions : treeOptions;
        const map = new Map();
        src.forEach(o => {
            if (o?.value) map.set(o.value, o);
        });
        return Array.from(map.values());
    }, [propOptions, treeOptions]);

    const allOptions2 = React.useMemo(() => {
        const src = propOptions2.length ? propOptions2 : treeOptions2;
        const map = new Map();
        src.forEach(o => {
            if (o?.value) map.set(o.value, o);
        });
        return Array.from(map.values());
    }, [propOptions2, treeOptions2]);

    const optionsFiltered = React.useMemo(() => {
        const current = String(row?.id ?? '');
        return allOptions.filter(o => o.value !== current);
    }, [allOptions, row?.id]);
    const optionsFiltered2 = React.useMemo(() => {
        const current = String(row?.id ?? '');
        return allOptions2.filter(o => o.value !== current);
    }, [allOptions2, row?.id]);

    // отображение значений полей
    const renderValue = React.useCallback((col, value, fullRow) => {
        if (col.field === 'acceptStage') {
            const stage = value ?? fullRow?.accept?.[0]?.stage;
            return stage ? (ACCEPT_STAGE_LABEL?.[stage] ?? String(stage)) : '—';
        }
        if (col.field === 'sources') {
            const raw = fullRow?.sources;
            const codes = Array.isArray(raw)
                ? raw.map((x) => (typeof x === 'string' ? x : x?.value)).filter(Boolean)
                : typeof raw === 'string' ? [raw] : [];
            return codes.length ? codes.join(', ') : '—';
        }
        if (col.type === 'singleSelect') {
            if (col.field === 'curatorId') return curators?.find((x) => x.id === value)?.name ?? '—';
            if (col.field === 'departmentNameId') return departments?.find((x) => x.id === value)?.name ?? '—';
            if (col.field === 'departmentHeadId') return head?.find((x) => x.id === value)?.name ?? '—';
            if (col.field === 'customerId') return customersMiudol?.find((x) => x.id === value)?.name ?? '—';
            if (col.field === 'customerCAId') return customersCa?.find((x) => x.id === value)?.name ?? '—';
            if (col.field === 'execution') return ExecutionFrequencyMap?.[value] ?? '—';
            if (col.field === 'complexity') return COMPLEXITY_LABEL?.[value] ?? '—';
        }
        if (col.field === 'dtiIds') {
            const toId = (v) => (v && typeof v === 'object' && 'id' in v ? v.id : v);
            const ids = Array.isArray(value) ? value.map(toId) : [];
            const labels = ids.map((id) => dti?.find((x) => x.id === id)?.value).filter(Boolean);
            if (!labels.length) return '—';
            return (
                <Stack component="ul" spacing={0.25} sx={{pl: 2, m: 0}}>
                    {labels.map((lab, i) => (<Box component="li" key={i} sx={{ml: 1}}>{lab}</Box>))}
                </Stack>
            );
        }
        if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
        if (value == null || value === '') return '—';
        return String(value);
    }, [curators, departments, head, dti, customersMiudol, customersCa, ExecutionFrequencyMap, COMPLEXITY_LABEL]);

    const viewCols = React.useMemo(() => {
        const exclude = new Set(['__rowNum__', '__actions__']);
        return (columns || []).filter((c) => !exclude.has(c.field));
    }, [columns]);

    const sectionsEls = React.useMemo(() => {
        if (!viewCols?.length) return null;
        const used = new Set();
        const sections = [];

        Object.entries(SECTION_FIELDS).forEach(([title, fields]) => {
            const present = fields.map((f) => viewCols.find(c => c.field === f)).filter(Boolean);
            if (!present.length) return;
            sections.push(
                <Section key={`sect-${title}`} title={title}>
                    {present.map((col) => {
                        used.add(col.field);
                        const value = row?.[col.field];
                        const label = <LabelWithInfo text={col.headerName ?? col.field} hint={HINTS[col.field]}/>;
                        return <FieldRow key={col.field} label={label}>{renderValue(col, value, row)}</FieldRow>;
                    })}
                </Section>
            );
        });

        const rest = viewCols.filter((c) => !used.has(c.field));
        if (rest.length) {
            sections.push(
                <Section key="sect-extra" title="Другое">
                    {rest.map((col) => {
                        const value = row?.[col.field];
                        const label = <LabelWithInfo text={col.headerName ?? col.field} hint={HINTS[col.field]}/>;
                        return <FieldRow key={col.field} label={label}>{renderValue(col, value, row)}</FieldRow>;
                    })}
                </Section>
            );
        }
        return sections;
    }, [viewCols, row, renderValue]);

    const handleDialogClose = (event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose?.(event, reason);
    };

    React.useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'ArrowLeft' && canPrev) {
                e.preventDefault();
                onPrev?.();
            }
            if (e.key === 'ArrowRight' && canNext) {
                e.preventDefault();
                onNext?.();
            }
        };
        window.addEventListener('keydown', onKeyDown, {capture: true});
        return () => window.removeEventListener('keydown', onKeyDown, {capture: true});
    }, [open, canPrev, canNext, onPrev, onNext]);

    // единый нейтральный визуал Chip
    const commonIdChipProps = {
        size: 'small',
        variant: 'outlined',
        icon: <LinkIcon/>,
        color: 'default',
        sx: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontWeight: 800,
            letterSpacing: '.02em',
            borderColor: (t) => t.palette.divider,
            color: (t) => t.palette.text.primary,
            '& .MuiChip-icon': {color: 'inherit'},
            '& .MuiChip-deleteIcon': {color: (t) => t.palette.text.secondary},
        },
    };

    const hopTo = React.useCallback((id) => {
        if (!id) return;
        window.getSelection?.().removeAllRanges?.();
        onOpenById?.(id);
    }, [onOpenById]);

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            disableEscapeKeyDown
            fullWidth
            maxWidth="xl"
            slotProps={{backdrop: {sx: {backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)'}}}}
            PaperProps={{
                sx: (t) => ({
                    position: 'relative',
                    m: {xs: '3vh 8px', sm: '5vh auto'},
                    width: 'calc(100% - 16px)',
                    maxWidth: 1200,
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    bgcolor: t.palette.background.paper,
                    border: `1px solid ${t.palette.divider}`,
                    boxShadow: 6,
                }),
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={(t) => ({
                    px: 2,
                    py: 1,
                    borderBottom: `1px solid ${t.palette.divider}`,
                    bgcolor: t.palette.background.default,
                })}
            >
                {/* Навигация ← → */}
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Предыдущая (←)">
            <span>
                <IconButton
                    size="small"
                    onClick={onPrev}
                    disabled={!canPrev}
                >
                    <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
            </span>
                    </Tooltip>
                    <Tooltip title="Следующая (→)">
            <span>
                <IconButton
                    size="small"
                    onClick={onNext}
                    disabled={!canNext}
                >
                    <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
            </span>
                    </Tooltip>
                </Stack>

                {/* ID по центру */}
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={(t) => ({
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 999,
                        border: `1px solid ${t.palette.divider}`,
                        bgcolor: t.palette.background.paper,
                    })}
                >
                    <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                        ID
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                    >
                        {row?.id ?? '—'}
                    </Typography>
                    <Tooltip title="Скопировать ID">
            <span>
                <IconButton
                    size="small"
                    onClick={() =>
                        navigator.clipboard?.writeText(String(row?.id ?? ''))
                    }
                    disabled={row?.id == null}
                >
                    <ContentCopyOutlinedIcon fontSize="inherit" />
                </IconButton>
            </span>
                    </Tooltip>
                </Stack>

                {/* Крестик */}
                <IconButton
                    onClick={() => onClose?.()}
                    aria-label="close"
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </Stack>


            {/* Связи ID */}
            <Stack
                elevation={0}
                variant="outlined"
                sx={(t) => ({
                    px: 3,
                    py: 1,
                    borderBottom: `1px solid ${t.palette.divider}`,
                    bgcolor: t.palette.background.default,
                })}
            >
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                >
                    {/* Родитель */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flex={1}
                        minWidth={0}
                    >
                        <ArrowCircleUpIcon fontSize="small" />
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'text.secondary' }}
                        >
                            Родитель
                        </Typography>

                        {parentIdView ? (
                            <Tooltip title="Открыть карточку родителя">
                                <Chip
                                    {...commonIdChipProps}
                                    clickable
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        hopTo(parentIdView);
                                    }}
                                    label={formatId(parentIdView)}
                                    onDelete={
                                        canPickParent
                                            ? async () => {
                                                const relId = getParentRelationId(row);
                                                if (!relId) return;
                                                await dispatch(deleteTreeThunk(relId));
                                                await setParentSafe(null);
                                            }
                                            : undefined
                                    }
                                    sx={{ ...commonIdChipProps.sx, cursor: 'pointer' }}
                                />
                            </Tooltip>
                        ) : (
                            <Chip
                                label="не задан"
                                size="small"
                                variant="outlined"
                                color="default"
                            />
                        )}

                        {canPickParent && !parentIdView && (
                            <ParentPicker
                                trigger={
                                    <Button
                                        size="small"
                                        startIcon={<AddCircleOutlineIcon />}
                                        sx={{ ml: 'auto' }}
                                    >
                                        Выбрать
                                    </Button>
                                }
                                options={optionsFiltered}
                                currentId={row?.id}
                                loading={treeStatus === 'loading'}
                                onSave={async (val) => {
                                    await setParentSafe(val ?? null);
                                    await dispatch(
                                        saveParentLink({
                                            dataId: Number(row.id),
                                            parentId: val == null ? null : Number(val),
                                        })
                                    );
                                }}
                            />
                        )}
                    </Stack>

                    {/* Дочерние */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flex={2}
                        minWidth={0}
                        sx={{ flexWrap: 'wrap' }}
                    >
                        <ArrowCircleDownIcon fontSize="small" />
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'text.secondary' }}
                        >
                            Дочерние
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            flexWrap="wrap"
                        >
                            {(childrenIdsView ?? []).length ? (
                                childrenIdsView.map((cid) => {
                                    const isSelf = String(cid) === String(row?.id);
                                    const deletable = canAddChild && !isSelf;
                                    return (
                                        <Tooltip
                                            key={String(cid)}
                                            title="Открыть карточку дочерней функции"
                                        >
                                            <Chip
                                                {...commonIdChipProps}
                                                clickable
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    hopTo(cid);
                                                }}
                                                label={formatId(cid)}
                                                onDelete={
                                                    deletable
                                                        ? async () => {
                                                            const relId = getChildRelationId(
                                                                row,
                                                                cid
                                                            );
                                                            if (!relId) return;
                                                            await dispatch(
                                                                deleteTreeThunk(relId)
                                                            );
                                                            await removeChildSafe(cid);
                                                        }
                                                        : undefined
                                                }
                                                sx={{
                                                    ...commonIdChipProps.sx,
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })
                            ) : (
                                <Chip
                                    label="нет"
                                    size="small"
                                    variant="outlined"
                                    color="default"
                                />
                            )}
                        </Stack>

                        {canAddChild && (
                            <ChildPicker
                                trigger={
                                    <Button
                                        size="small"
                                        startIcon={<AddCircleOutlineIcon />}
                                        sx={{ ml: 'auto' }}
                                    >
                                        Добавить
                                    </Button>
                                }
                                options={optionsFiltered2}
                                currentId={row?.id}
                                existingChildren={childrenIdsView || []}
                                loading={treeStatus === 'loading'}
                                onSave={async (val) => {
                                    if (!val) return;
                                    await addChildSafe(val);
                                    await dispatch(
                                        saveAddChildLink({
                                            dataId: Number(row.id),
                                            childId: Number(val),
                                        })
                                    );
                                }}
                            />
                        )}
                    </Stack>
                </Stack>
            </Stack>


            {/* Контент */}
            <Box
                sx={(t) => ({
                    p: { xs: 2, sm: 3 },
                    maxHeight: 'calc(100vh - 16vh)',
                    overflow: 'auto',
                    boxSizing: 'border-box',
                    bgcolor:
                        t.palette.mode === 'light'
                            ? '#f8fafc'
                            : t.palette.background.default,
                })}
            >
                <Box>{sectionsEls}</Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    {row && (
                        <AcceptCell
                            row={row}
                            history={row?.accept || []}
                            onSave={onAcceptSave}
                        />
                    )}
                </Box>
            </Box>

        </Dialog>
    );
};

/* ---------- pickers ---------- */
function ParentPicker({trigger, options, currentId, loading, onSave}) {
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState(null);
    React.useEffect(() => {
        if (!open) setDraft(null);
    }, [open]);

    const disabled = !draft || draft.value === String(currentId);

    return (
        <>
            <Box component="span" onClick={() => setOpen(true)}>{trigger}</Box>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <Box sx={{p: 2, width: 360}}>
                    <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 700}}>
                        Выбрать родителя для ID {formatId(currentId)}
                    </Typography>
                    <Autocomplete
                        options={options}
                        value={draft}
                        onChange={(_, v) => setDraft(v)}
                        getOptionLabel={(opt) => opt?.label ?? ''}
                        isOptionEqualToValue={(o, v) => (o?.value ?? '') === (v?.value ?? '')}
                        loading={loading}
                        renderInput={(params) => <TextField {...params} label="ID родителя"/>}
                        clearOnEscape
                        sx={{mt: 1}}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{mt: 2}}>
                        <Button onClick={() => setOpen(false)}>Отмена</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                onSave(draft?.value ?? null);
                                setOpen(false);
                            }}
                            disabled={disabled}
                        >
                            Сохранить
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}

function ChildPicker({trigger, options, currentId, existingChildren, loading, onSave}) {
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState(null);
    React.useEffect(() => {
        if (!open) setDraft(null);
    }, [open]);

    const disabled = !draft
        || draft.value === String(currentId)
        || (existingChildren || []).map(String).includes(draft.value);

    return (
        <>
            <Box component="span" onClick={() => setOpen(true)}>{trigger}</Box>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <Box sx={{p: 2, width: 360}}>
                    <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 700}}>
                        Добавить дочерний для ID {formatId(currentId)}
                    </Typography>
                    <Autocomplete
                        options={options}
                        value={draft}
                        onChange={(_, v) => setDraft(v)}
                        getOptionLabel={(opt) => opt?.label ?? ''}
                        isOptionEqualToValue={(o, v) => (o?.value ?? '') === (v?.value ?? '')}
                        loading={loading}
                        renderInput={(params) => <TextField {...params} label="ID дочерний"/>}
                        clearOnEscape
                        sx={{mt: 1}}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{mt: 2}}>
                        <Button onClick={() => setOpen(false)}>Отмена</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                onSave(draft?.value);
                                setOpen(false);
                            }}
                            disabled={disabled}
                        >
                            Добавить
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}

export default RowViewDialog;
