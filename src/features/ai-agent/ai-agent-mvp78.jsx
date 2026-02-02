import { marked } from "marked";
import DOMPurify from "dompurify";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    CircularProgress,
    Tabs,
    Tab,
    Collapse,
    Tooltip,
    Button,
    Fab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { alpha } from '@mui/material/styles';

import {
    Chart as ChartJS,
    BarElement,
    ArcElement,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

import * as XLSX from 'xlsx';
import { store } from '../../app/store.js';

ChartJS.register(
    BarElement,
    ArcElement,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    ChartTooltip,
    Legend,
);

const WS_URL = 'ws://127.0.0.1:3002';

// ================== STATUS CHIP ==================

export const statusChipStyle = (theme, status) => {
    const color =
        status === 'PROCESSING_OPENAI_USER_MESSAGE'
            ? theme.palette.info.main
            : status === 'PROCESSING_DATABASE_OPENAI_SQL'
                ? theme.palette.warning.main
                : status === 'PROCESSING_OPENAI_SQL_RESULT'
                    ? theme.palette.primary.light
                    : status === 'IDLE'
                        ? theme.palette.success.main
                        : status === 'DELETED'
                            ? theme.palette.grey[500]
                            : null;

    if (!color) {
        return {
            bgcolor: theme.palette.action.hover,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
        };
    }

    return {
        bgcolor: alpha(color, 0.12),
        color,
        borderColor: alpha(color, 0.35),
    };
};

const STATUS_LABELS = {
    PROCESSING_OPENAI_USER_MESSAGE: 'LLM: анализирует запрос',
    PROCESSING_DATABASE_OPENAI_SQL: 'БД: выполняет SQL',
    PROCESSING_OPENAI_SQL_RESULT: 'LLM: формирует ответ',
    IDLE: 'Готов',
    DELETED: 'Удалён',
};

function DialogStatusChip({ status }) {
    if (!status) return null;

    const label = STATUS_LABELS[status] ?? status;

    return (
        <Box
            sx={(theme) => ({
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                lineHeight: 1.6,
                transition: 'all .2s cubic-bezier(0.4,0,0.2,1)',
                ...statusChipStyle(theme, status),
            })}
        >
            {label}
        </Box>
    );
}


let cachedStore = null;

async function getStore() {
    if (!cachedStore) {
        cachedStore = (await import('../../app/store.js')).store;
    }
    return cachedStore;
}



// =============== UTILS ===============

function convertToCSV(rows) {
    if (!Array.isArray(rows) || !rows.length) return '';
    const cols = Object.keys(rows[0]);
    const header = cols.join(',');
    const body = rows
        .map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))
        .join('\n');
    return header + '\n' + body;
}

function downloadXlsx(filename, rows) {
    if (!Array.isArray(rows) || !rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ===== SQL / JSON highlighting =====

function highlightSql(sql) {
    if (!sql) return '';
    let escaped = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;');

    const keywords = [
        'select',
        'from',
        'where',
        'and',
        'or',
        'join',
        'left',
        'right',
        'inner',
        'outer',
        'on',
        'group',
        'by',
        'order',
        'limit',
        'insert',
        'into',
        'values',
        'update',
        'set',
        'delete',
        'as',
    ];

    const re = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'gi');
    escaped = escaped.replace(re, '<span class="sql-keyword">$1</span>');

    return escaped;
}

function highlightJsonPretty(json) {
    if (!json) return '';

    let out = json.replace(/&/g, '&amp;').replace(/</g, '&lt;');

    out = out.replace(
        /"([^"]+)"\s*:/g,
        '<span class="json-key">"$1"</span>:',
    );

    out = out.replace(
        /:\s*"([^"]*)"/g,
        ': <span class="json-string">"$1"</span>',
    );

    out = out.replace(
        /:\s*([0-9\.\-]+)/g,
        ': <span class="json-number">$1</span>',
    );

    out = out.replace(
        /:\s*(null|true|false)/g,
        ': <span class="json-null">$1</span>',
    );

    return out;
}

// =============== MICRO LINE SWITCH ===============

export function MicroLineSwitch({
                                    value,
                                    onChange,
                                    options,
                                    width = 50,
                                    dot = 10,
                                }) {
    const idx = options.findIndex((o) => o.id === value);
    const count = options.length;

    const lineY = 10;
    const spacing = count > 1 ? width / (count - 1) : 0;

    return (
        <Box
            sx={{
                position: 'absolute',
                top: -6,
                right: 12,
                height: 32,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Box sx={{ position: 'relative', width, height: 32 }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: lineY,
                        left: 0,
                        width,
                        height: 2,
                        background: 'rgba(255,255,255,0.35)',
                    }}
                />

                {options.map((o, i) => (
                    <Box
                        key={o.id}
                        sx={{
                            position: 'absolute',
                            top: lineY - 3,
                            left: i * spacing - 1,
                            width: 2,
                            height: 6,
                            background: 'rgba(255,255,255,0.6)',
                        }}
                    />
                ))}

                <Box
                    sx={{
                        position: 'absolute',
                        top: lineY - dot / 2 + 1,
                        left: idx * spacing - dot / 2,
                        width: dot,
                        height: dot,
                        borderRadius: '50%',
                        background: '#38BDF8',
                        boxShadow: '0 0 6px rgba(56,189,248,0.45)',
                        transition: 'left .18s cubic-bezier(.25,1,.3,1)',
                        cursor: 'pointer',
                    }}
                />

                {options.map((o, i) => (
                    <Box
                        key={o.id}
                        onClick={() => onChange(o.id)}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: i * spacing - spacing / 2,
                            width: spacing,
                            height: 32,
                            cursor: 'pointer',
                        }}
                    />
                ))}

                {options.map((o, i) => (
                    <Typography
                        key={o.id}
                        onClick={() => onChange(o.id)}
                        sx={{
                            position: 'absolute',
                            top: lineY + 8,
                            left: i * spacing - 15,
                            width: 30,
                            textAlign: 'center',
                            color: i === idx ? '#E6EDF7' : '#9CA3AF',
                            fontSize: 10,
                            cursor: 'pointer',
                        }}
                    >
                        {o.label}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
}

// =============== COPY BUTTON ===============

export function CopyButtonTg({ text }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text ?? '');
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // ignore
        }
    };

    return (
        <Tooltip title={copied ? 'Скопировано!' : 'Скопировать'}>
            <IconButton
                onClick={copy}
                size="small"
                sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#9CA3AF',
                    backdropFilter: 'blur(6px)',
                    transition: 'all .18s ease',
                    '&:hover': {
                        background: 'rgba(255,255,255,0.14)',
                        color: '#F9FAFB',
                        boxShadow: '0 0 6px rgba(255,255,255,0.25)',
                        transform: 'scale(1.05)',
                    },
                    '&:active': {
                        transform: 'scale(0.92)',
                    },
                }}
            >
                <ContentCopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
        </Tooltip>
    );
}

// =============== TABLE / JSON VIEWS ===============

function CompactTable({ rows }) {
    if (!Array.isArray(rows) || !rows.length) return null;
    const cols = Object.keys(rows[0]);

    return (
        <Box
            sx={{
                border: '1px solid #1F2937',
                borderRadius: 1,
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: 240,
            }}
        >
            <table
                style={{
                    width: 'max-content',
                    minWidth: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                    color: '#E6EDF7',
                    tableLayout: 'fixed',
                }}
            >
                <thead>
                <tr>
                    {cols.map((c) => (
                        <th
                            key={c}
                            style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 5,
                                background: '#1E293B',
                                borderBottom: '1px solid #1F2937',
                                borderRight: '1px solid #1F2937',
                                padding: '4px 6px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {c}
                        </th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        {cols.map((c) => (
                            <td
                                key={c}
                                style={{
                                    borderBottom: '1px solid #1F2937',
                                    borderRight: '1px solid #1F2937',
                                    padding: '3px 6px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {String(r[c] ?? '')}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </Box>
    );
}

function DownloadButton({ onClick }) {
    return (
        <IconButton
            size="small"
            onClick={onClick}
            sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                color: '#9CA3AF',
                backdropFilter: 'blur(6px)',
                transition: 'all .18s ease',
                '&:hover': {
                    background: 'rgba(255,255,255,0.14)',
                    color: '#F9FAFB',
                    boxShadow: '0 0 6px rgba(255,255,255,0.25)',
                    transform: 'scale(1.05)',
                },
                '&:active': {
                    transform: 'scale(0.92)',
                },
            }}
        >
            ⬇
        </IconButton>
    );
}

function ResultActions({ type, result, renderedResult }) {
    const rows = Array.isArray(result) ? result : [];
    const csv = rows.length ? convertToCSV(rows) : '';

    const copy = async () => {
        if (type === 'table' || type === 'csv') {
            await navigator.clipboard.writeText(csv);
        } else {
            await navigator.clipboard.writeText(renderedResult ?? '');
        }
    };

    const download = () => {
        if (type === 'table' || type === 'csv') {
            downloadXlsx('result.xlsx', rows);
        } else {
            const text = renderedResult ?? '';
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'result.txt';
            link.click();
        }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 2,
                right: 6,
                display: 'flex',
                gap: 0.8,
                zIndex: 100,
            }}
        >
            <Tooltip title="Скопировать">
                <IconButton
                    onClick={copy}
                    size="small"
                    sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#9CA3AF',
                        backdropFilter: 'blur(6px)',
                        transition: 'all .18s ease',
                        '&:hover': {
                            background: 'rgba(255,255,255,0.14)',
                            color: '#F9FAFB',
                            boxShadow: '0 0 6px rgba(255,255,255,0.25)',
                            transform: 'scale(1.05)',
                        },
                        '&:active': {
                            transform: 'scale(0.92)',
                        },
                    }}
                >
                    <ContentCopyIcon sx={{ fontSize: 13 }} />
                </IconButton>
            </Tooltip>

            <DownloadButton onClick={download} />
        </Box>
    );
}

function JsonView({ renderedResult }) {
    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Paper
                sx={{
                    p: 1,
                    background: '#020617',
                    border: '1px solid #1F2937',
                    color: '#9CB5D1',
                    height: '100%',
                    overflow: 'auto',
                    fontFamily: 'Fira Code, monospace',
                    fontSize: 11,
                }}
            >
                <pre
                    style={{ margin: 0, whiteSpace: 'pre' }}
                    dangerouslySetInnerHTML={{ __html: highlightJsonPretty(renderedResult) }}
                />
            </Paper>

            <ResultActions type="json" result={null} renderedResult={renderedResult} />
        </Box>
    );
}

function TableView({ rows }) {
    if (!Array.isArray(rows) || !rows.length) {
        return (
            <Box
                sx={{
                    mt: 1,
                    p: 1,
                    border: '1px solid #1F2937',
                    borderRadius: 1,
                    background: '#020617',
                    color: '#9CB5D1',
                }}
            >
                Нет табличных данных
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Box
                sx={{
                    height: '100%',
                    maxHeight: 260,
                    overflow: 'auto',
                    border: '1px solid #1F2937',
                    borderRadius: 1,
                }}
            >
                <CompactTable rows={rows} />
            </Box>

            <ResultActions type="table" result={rows} renderedResult={null} />
        </Box>
    );
}

function CsvView({ rows }) {
    const csv = convertToCSV(rows);

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Paper
                sx={{
                    p: 1,
                    background: '#020617',
                    border: '1px solid #1F2937',
                    color: '#9CB5D1',
                    height: '100%',
                    maxHeight: 260,
                    overflow: 'auto',
                    fontFamily: 'Fira Code, monospace',
                    fontSize: 11,
                }}
            >
                <pre style={{ margin: 0, whiteSpace: 'pre' }}>{csv}</pre>
            </Paper>

            <ResultActions type="csv" result={rows} renderedResult={csv} />
        </Box>
    );
}

// =============== CHART VIEW (Chart.js) ===============

const CHART_COLORS = [
    'rgba(59,130,246,0.8)',
    'rgba(16,185,129,0.8)',
    'rgba(239,68,68,0.8)',
    'rgba(234,179,8,0.8)',
    'rgba(96,165,250,0.8)',
    'rgba(52,211,153,0.8)',
    'rgba(248,113,113,0.8)',
    'rgba(250,204,21,0.8)',
];

function buildChartData(rows, chartHint) {
    if (!Array.isArray(rows) || !rows.length || !chartHint) return null;

    const { xField, yField, groupField } = chartHint;

    if (!xField || !yField) return null;

    const xValues = rows.map((r) => String(r[xField] ?? ''));

    const parseY = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    if (!groupField) {
        const data = rows.map((r) => parseY(r[yField]));
        return {
            labels: xValues,
            datasets: [
                {
                    label: yField,
                    data,
                },
            ],
        };
    }

    const groups = new Map();
    for (const row of rows) {
        const g = String(row[groupField] ?? '—');
        const x = String(row[xField] ?? '');
        const y = parseY(row[yField]);

        if (!groups.has(g)) groups.set(g, new Map());
        const byX = groups.get(g);
        byX.set(x, (byX.get(x) ?? 0) + y);
    }

    const uniqueX = Array.from(new Set(xValues));
    const datasets = Array.from(groups.entries()).map(([g, byX]) => ({
        label: g,
        data: uniqueX.map((x) => byX.get(x) ?? 0),
    }));

    return {
        labels: uniqueX,
        datasets,
    };
}

function applyChartColors(data, type) {
    if (!data) return data;
    const palette = CHART_COLORS;
    if (type === 'pie') {
        return {
            ...data,
            datasets: data.datasets.map((ds) => ({
                ...ds,
                backgroundColor: data.labels.map(
                    (_, i) => palette[i % palette.length],
                ),
                borderColor: '#020617',
                borderWidth: 1,
            })),
        };
    }

    return {
        ...data,
        datasets: data.datasets.map((ds, idx) => {
            const color = palette[idx % palette.length];
            return {
                ...ds,
                backgroundColor: color,
                borderColor: color.replace('0.8', '1'),
                borderWidth: 1,
            };
        }),
    };
}

function ChartView({ rows, chartHint }) {
    if (!chartHint) return null;
    const { type = 'bar', comment } = chartHint;

    let chartData = buildChartData(rows, chartHint);
    if (!chartData) {
        return (
            <Box
                sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '1px dashed #1F2937',
                    color: '#9CA3AF',
                    fontSize: 11,
                }}
            >
                Недостаточно данных для построения диаграммы.
            </Box>
        );
    }

    chartData = applyChartColors(chartData, type);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true },
        },
        scales:
            type === 'pie'
                ? {}
                : {
                    x: {
                        ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 },
                    },
                    y: {
                        beginAtZero: true,
                    },
                },
    };

    let ChartComponent = Bar;
    if (type === 'pie') ChartComponent = Pie;
    else if (type === 'line') ChartComponent = Line;

    return (
        <Box
            sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                border: '1px solid #1F2937',
                background: '#020617',
                height: 260,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
            }}
        >
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ChartComponent data={chartData} options={commonOptions} />
            </Box>

            {comment && (
                <Typography
                    variant="caption"
                    sx={{ mt: 0.5, color: '#9CA3AF', fontSize: 10 }}
                >
                    {comment}
                </Typography>
            )}
        </Box>
    );
}

// =============== SQL TABS ===============

function SqlTabs({ queries }) {
    const keys = Object.keys(queries);
    const [tab, setTab] = useState(0);
    const [view, setView] = useState('table'); // table | csv | json

    const currentKey = keys[tab] ?? keys[0];
    const current = currentKey ? queries[currentKey] : null;

    if (!current) return null;

    const result = current.result;

    let prettyJson;
    try {
        prettyJson = JSON.stringify(result, null, 2);
    } catch {
        prettyJson = String(result ?? '');
    }

    if (prettyJson.length > 4000) {
        prettyJson = prettyJson.slice(0, 4000) + '\n…';
    }

    const renderedResult = prettyJson;

    return (
        <Box
            sx={{
                mt: 1,
                overflow: 'visible',
            }}
        >
            <Tabs
                value={tab}
                onChange={(e, v) => setTab(v)}
                textColor="primary"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    minHeight: 32,
                    '& .MuiTab-root': {
                        minHeight: 32,
                        textTransform: 'none',
                        fontSize: 12,
                        color: '#B8C4D9',
                    },
                    '& .Mui-selected': {
                        color: '#E6EDF7 !important',
                    },
                }}
            >
                {keys.map((k) => {
                    const q = queries[k];
                    const label = q?.title || k;
                    return <Tab label={label} key={k} />;
                })}
            </Tabs>

            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    SQL:
                </Typography>

                <Paper
                    sx={{
                        mt: 0.5,
                        p: 1,
                        background: '#020617',
                        border: '1px solid #1F2937',
                        color: '#9CB5D1',
                        maxHeight: 180,
                        overflowY: 'auto',
                        overflowX: 'auto',
                        fontFamily: 'Fira Code, monospace',
                        fontSize: 11,
                        position: 'relative',
                        '& .sql-keyword': {
                            color: '#38BDF8',
                            fontWeight: 600,
                        },
                    }}
                >
                    <CopyButtonTg text={current.sql} />
                    <pre
                        style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                        }}
                        dangerouslySetInnerHTML={{
                            __html: highlightSql(current.sql),
                        }}
                    />
                </Paper>
            </Box>

            <Box sx={{ position: 'relative', mt: 1.5, mb: 1.2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Результат:
                </Typography>

                <MicroLineSwitch
                    value={view}
                    onChange={setView}
                    options={[
                        { id: 'table', label: 'table' },
                        { id: 'csv', label: 'csv' },
                        { id: 'json', label: 'json' },
                    ]}
                />
            </Box>

            <Box
                sx={{
                    maxHeight: 260,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    borderRadius: 1,
                }}
            >
                {view === 'json' && <JsonView renderedResult={renderedResult} />}
                {view === 'table' && <TableView rows={result} />}
                {view === 'csv' && <CsvView rows={result} />}
            </Box>
        </Box>
    );
}

// =============== MESSAGE BUBBLE ===============

function MessageBubble({ msg, onRegenerate, regenTargetId }) {
    const [open, setOpen] = useState(false);
    const isUser = msg.isUserMessage;
    const hasQueries = msg.queries && Object.keys(msg.queries).length > 0;

    const [copiedMsg, setCopiedMsg] = useState(false);

    const finalTables = useMemo(() => {
        if (!hasQueries) return [];
        const entries = Object.values(msg.queries);
        const finals = entries.filter(
            (q) =>
                q &&
                q.isFinal &&
                q.status === 'OK' &&
                Array.isArray(q.result) &&
                q.result.length > 0,
        );
        return finals.slice(0, 2); // максимум 2 финальные секции
    }, [msg, hasQueries]);

    const copyMessageText = async () => {
        try {
            await navigator.clipboard.writeText(msg.message ?? '');
            setCopiedMsg(true);
            setTimeout(() => setCopiedMsg(false), 1200);
        } catch {}
    };

    return (
        <Box
            sx={{
                position: 'relative',
                maxWidth: '90%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
            }}
        >
            <Paper
                sx={{
                    position: 'relative',
                    p: 1.3,
                    background: isUser ? '#1E293B' : '#0F172A',
                    border: '1px solid #1F2937',
                    borderRadius: '10px',
                    color: '#E6EDF7',
                }}
            >
                <Typography
                    variant="body2"
                    sx={{ mb: 0.75 }}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(msg.message ?? "")),
                    }}
                />

                {finalTables.length > 0 && (
                    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {finalTables.map((q, idx) => (
                            <Box key={idx}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, color: '#9CB5D1' }}
                                >
                                    Итоговая таблица: {q.title}
                                </Typography>

                                <Box sx={{ mt: 0.75, position: 'relative' }}>
                                    <CompactTable rows={q.result} />
                                    <ResultActions
                                        type="table"
                                        result={q.result}
                                        renderedResult={null}
                                    />
                                </Box>

                                {q.chartHint && (
                                    <ChartView rows={q.result} chartHint={q.chartHint} />
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                {hasQueries && (
                    <Box sx={{ mt: 1 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                color: '#9CA3AF',
                                '&:hover': { color: '#E2E8F0' },
                            }}
                            onClick={() => setOpen((v) => !v)}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 600, userSelect: 'none' }}>
                                {open ? 'Скрыть SQL-детали' : 'Показать SQL-детали'}
                            </Typography>
                            {open ? (
                                <ExpandLessIcon sx={{ fontSize: 16 }} />
                            ) : (
                                <ExpandMoreIcon sx={{ fontSize: 16 }} />
                            )}
                        </Box>

                        <Collapse in={open}>
                            <Box sx={{ mt: 1.2, borderRadius: 2 }}>
                                <SqlTabs queries={msg.queries} />
                            </Box>
                        </Collapse>
                    </Box>
                )}
            </Paper>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 0.7,
                    pr: 0.2,
                    gap: 0.5,
                }}
            >
                {isUser && regenTargetId && (
                    <Tooltip title="Перегенерировать">
                        <IconButton
                            size="small"
                            onClick={() => onRegenerate(regenTargetId)}
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#9CA3AF',
                                backdropFilter: 'blur(4px)',
                                '&:hover': {
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#F9FAFB',
                                },
                            }}
                        >
                            <ReplayIcon sx={{ fontSize: 14, backgroundColor: 'none' }} />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title={copiedMsg ? 'Скопировано!' : 'Копировать'}>
                    <IconButton
                        onClick={copyMessageText}
                        size="small"
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#9CA3AF',
                            backdropFilter: 'blur(6px)',
                            transition: 'all .18s ease',
                            '&:hover': {
                                background: 'rgba(255,255,255,0.14)',
                                color: '#F9FAFB',
                                boxShadow: '0 0 6px rgba(255,255,255,0.25)',
                                transform: 'scale(1.05)',
                            },
                            '&:active': {
                                transform: 'scale(0.92)',
                            },
                        }}
                    >
                        <ContentCopyIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

// =============== DIALOG BODY ===============

function DialogBody({ dialogUid, messages, onSendMessage, onRegenerate, isProcessing, onStop }) {
    const [input, setInput] = useState('');

    const scrollRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const send = () => {
        const text = input.trim();
        if (!text || !dialogUid || isProcessing) return;
        setInput('');
        setAutoScroll(true);
        queueMicrotask(() => {
            const el = scrollRef.current;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        });
        onSendMessage && onSendMessage(text);
    };

    const loading = !messages;

    useEffect(() => {
        if (!messages || !messages.length) return;
        if (!autoScroll) return;
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages, autoScroll]);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const nearBottom = distanceFromBottom < 40; // порог в пикселях

        // если юзер ушёл вверх – выключаем автоскролл
        // если вернулся к низу – включаем снова
        setAutoScroll(nearBottom);
    };

    const lastAiByUser = useMemo(() => {
        const map = new Map();
        if (!messages) return map;
        for (const m of messages) {
            if (!m.isUserMessage && m.parentId) {
                const cur = map.get(m.parentId);
                if (!cur || (m.version ?? 0) > (cur.version ?? 0)) {
                    map.set(m.parentId, m);
                }
            }
        }
        return map;
    }, [messages]);

    const lastMessage = messages && messages.length ? messages[messages.length - 1] : null;

    return (
        <>
            <style>
                {`
        .json-key {
            color: #38BDF8;
            font-weight: 600;
        }
        .json-string {
            color: #86EFAC;
        }
        .json-number {
            color: #FBBF24;
        }
        .json-null {
            color: #9CA3AF;
            font-style: italic;
        }
        .sql-keyword {
            color: #38BDF8;
            font-weight: 600;
        }
            `}
            </style>

            <Box
                ref={scrollRef}
                onScroll={handleScroll}
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    p: 2,
                }}
            >
                {loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 4,
                        }}
                    >
                        <CircularProgress size={26} />
                    </Box>
                )}

                {!loading &&
                    messages
                        .slice()
                        .sort((a, b) => a.id - b.id)
                        .map((m) => (
                            <MessageBubble
                                key={m.id}
                                msg={m}
                                onRegenerate={onRegenerate}
                                regenTargetId={
                                    m.isUserMessage
                                        ? lastAiByUser.get(m.id)?.id ?? null
                                        : null
                                }
                            />
                        ))}

                {!loading && isProcessing && lastMessage && lastMessage.isUserMessage && (
                    <Box
                        sx={{
                            mt: 0.5,
                            alignSelf: 'flex-start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            pl: 0.5,
                        }}
                    >
                        <CircularProgress size={14} />
                        <Typography variant="caption" sx={{ color: '#B8C4D9' }}>
                            Думает над последним запросом…
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box
                sx={{
                    p: 1.25,
                    borderTop: '1px solid #1F2937',
                    background: '#0B1220',
                    display: 'flex',
                    gap: 1,
                }}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Сформулируйте задачу по функциям / данным…"
                    disabled={isProcessing}
                    style={{
                        flexGrow: 1,
                        padding: '10px 14px',
                        background: isProcessing ? '#020617' : '#0F172A',
                        borderRadius: 8,
                        border: '1px solid #1F2937',
                        color: '#E6EDF7',
                        fontSize: 14,
                        outline: 'none',
                        opacity: isProcessing ? 0.7 : 1,
                    }}
                />

                {isProcessing ? (
                    <BrightPrimaryButtonStable
                        onClick={onStop}
                        sx={{
                            background: 'linear-gradient(135deg,#DC2626,#F97316)',
                        }}
                    >
                        Остановить
                    </BrightPrimaryButtonStable>
                ) : (
                    <BrightPrimaryButtonStable onClick={send}>
                        Отправить
                    </BrightPrimaryButtonStable>
                )}
            </Box>
        </>
    );
}

// =============== HEADER BUTTONS ===============

export function BrightPrimaryButtonStable({ children, sx = {}, ...props }) {
    return (
        <Button
            variant="contained"
            {...props}
            sx={{
                borderRadius: 999,
                px: 2.2,
                py: 1.1,
                minWidth: 80,
                fontWeight: 600,
                fontSize: 14,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563EB, #38BDF8)',
                boxShadow: '0 0 12px rgba(56,189,248,0.25)',
                transition: 'background .18s ease, box-shadow .18s ease',
                '&:hover': {
                    background: 'linear-gradient(135deg, #1E40AF, #0EA5E9)',
                    boxShadow: '0 0 18px rgba(56,189,248,0.45)',
                },
                '&:active': {
                    background: 'linear-gradient(135deg,#1D4ED8,#0284C7)',
                    boxShadow: '0 0 8px rgba(56,189,248,0.35)',
                },
                ...sx,
            }}
        >
            {children}
        </Button>
    );
}

export function BrightCircleButtonStable({ icon, onClick, sx = {}, ...props }) {
    return (
        <IconButton
            onClick={onClick}
            sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid rgba(56,189,248,0.35)',
                background: 'rgba(56,189,248,0.10)',
                color: '#38BDF8',
                transition: 'all .18s cubic-bezier(.22,1,.36,1)',
                filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.45))',
                '&:hover': {
                    background: 'rgba(56,189,248,0.20)',
                    boxShadow: '0 0 14px rgba(56,189,248,0.40)',
                },
                '&:active': {
                    transform: 'scale(0.92)',
                },
                ...sx,
            }}
            {...props}
        >
            {icon}
        </IconButton>
    );
}

// =============== MAIN PANEL (WS-логика) ===============

export function AiDialogView({ onClose }) {
    const minWidth = 420;
    const SNAP = 40;

    const [width, setWidth] = useState(420);
    const [snapped, setSnapped] = useState(false);
    const [visible, setVisible] = useState(true);

    const [dialogs, setDialogs] = useState([]);
    const [activeUid, setActiveUid] = useState(null);
    const [activeStatus, setActiveStatus] = useState(null);
    const [messagesByDialog, setMessagesByDialog] = useState({});
    const [processingByDialog, setProcessingByDialog] = useState({});

    const [wsStatus, setWsStatus] = useState('connecting'); // connecting | open | closed

    const wsRef = useRef(null);

    const getViewportWidth = () =>
        window.innerWidth || document.documentElement.clientWidth || 1920;

    const activeUidRef = useRef(null);
    useEffect(() => {
        activeUidRef.current = activeUid;
    }, [activeUid]);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        setWsStatus('connecting');

        ws.onopen = () => {
            setWsStatus('open');
            getStore().then(store =>
                ws.send(JSON.stringify({
                    type: 'list-dialogs',
                    userId: store.getState().user.userId
                }))
            );
        };

        ws.onmessage = (event) => {
            let msg;
            try {
                msg = JSON.parse(event.data);
            } catch (e) {
                console.error('[WS] parse error', e);
                return;
            }

            switch (msg.type) {
                case 'dialog-list': {
                    const list = msg.list || [];
                    setDialogs(list);
                    if (!activeUid && list.length > 0) {
                        const firstUid = list[0].uid;
                        setActiveUid(firstUid);
                        ws.send(
                            JSON.stringify({
                                type: 'get-dialog',
                                uid: firstUid,
                            }),
                        );
                    }
                    break;
                }

                case 'delete-messages': {
                    const { dialogUid, ids } = msg;
                    if (!dialogUid || !Array.isArray(ids) || !ids.length) break;

                    setMessagesByDialog((prev) => {
                        const existing = prev[dialogUid] || [];
                        const next = existing.filter((m) => !ids.includes(m.id));
                        return { ...prev, [dialogUid]: next };
                    });
                    break;
                }

                case 'dialog-created': {
                    const { dialog } = msg;
                    if (!dialog) break;
                    const entry = {
                        uid: dialog.uid,
                        title: dialog.title ?? 'Диалог',
                        status: dialog.status,
                        lastMessage:
                            dialog.messages?.[dialog.messages.length - 1]?.message ?? '',
                        unreadCount: 0,
                    };
                    setDialogs((prev) => [entry, ...prev]);
                    setMessagesByDialog((prev) => ({
                        ...prev,
                        [dialog.uid]: dialog.messages ?? [],
                    }));
                    setActiveUid(dialog.uid);
                    setActiveStatus(dialog.status);
                    setProcessingByDialog((prev) => ({
                        ...prev,
                        [dialog.uid]: false,
                    }));
                    break;
                }

                case 'dialog': {
                    const { dialog, notFound, uid } = msg;
                    if (notFound) {
                        setMessagesByDialog((prev) => ({
                            ...prev,
                            [uid]: [],
                        }));
                        break;
                    }
                    if (!dialog) break;

                    setMessagesByDialog((prev) => ({
                        ...prev,
                        [dialog.uid]: dialog.messages ?? [],
                    }));
                    setActiveStatus(dialog.status);
                    break;
                }

                case 'message': {
                    const { dialogUid, message } = msg;
                    if (!dialogUid || !message) break;

                    setMessagesByDialog((prev) => {
                        const existing = prev[dialogUid] || [];
                        const idx = existing.findIndex((m) => m.id === message.id);
                        let next;
                        if (idx >= 0) {
                            next = [...existing];
                            next[idx] = { ...existing[idx], ...message };
                        } else {
                            next = [...existing, message];
                        }
                        next.sort((a, b) => a.id - b.id);
                        return { ...prev, [dialogUid]: next };
                    });

                    setDialogs((prev) =>
                        prev.map((d) =>
                            d.uid === dialogUid
                                ? {
                                    ...d,
                                    lastMessage: message.message ?? d.lastMessage,
                                }
                                : d,
                        ),
                    );
                    break;
                }

                case 'update-message': {
                    const { dialogUid, id, patch } = msg;
                    if (!dialogUid || !id) break;

                    setMessagesByDialog((prev) => {
                        const existing = prev[dialogUid] || [];
                        const idx = existing.findIndex((m) => m.id === id);
                        if (idx < 0) return prev;
                        const updated = {
                            ...existing[idx],
                            ...patch,
                        };
                        const next = [...existing];
                        next[idx] = updated;
                        return { ...prev, [dialogUid]: next };
                    });
                    break;
                }

                case 'status': {
                    const { dialogUid, status } = msg;
                    if (!dialogUid) break;

                    if (dialogUid === activeUid) {
                        setActiveStatus(status);
                    }

                    setDialogs((prev) =>
                        prev.map((d) =>
                            d.uid === dialogUid ? { ...d, status } : d,
                        ),
                    );

                    setProcessingByDialog((prev) => ({
                        ...prev,
                        [dialogUid]: status !== 'IDLE',
                    }));

                    break;
                }

                case 'stopped': {
                    const { uid } = msg;
                    setProcessingByDialog((prev) => ({
                        ...prev,
                        [uid]: false,
                    }));
                    break;
                }

                case 'dialog-deleted': {
                    const { uid } = msg;

                    setDialogs((prev) => {
                        const idx = prev.findIndex((d) => d.uid === uid);
                        const rest = prev.filter((d) => d.uid !== uid);

                        const isActiveDeleted = activeUidRef.current === uid;

                        if (isActiveDeleted) {
                            let next = null;

                            if (idx < rest.length) {
                                next = rest[idx]?.uid ?? null;
                            }

                            if (!next && rest.length > 0) {
                                next = rest[rest.length - 1].uid;
                            }

                            setActiveUid(next);
                            setActiveStatus(null);

                            if (next) {
                                sendWs({ type: 'get-dialog', uid: next });
                            }
                        }

                        return rest;
                    });

                    setMessagesByDialog((prev) => {
                        const cp = { ...prev };
                        delete cp[uid];
                        return cp;
                    });

                    setProcessingByDialog((prev) => {
                        const cp = { ...prev };
                        delete cp[uid];
                        return cp;
                    });

                    break;
                }

                case 'error': {
                    console.error('[WS error]', msg.message);
                    break;
                }

                default:
                    break;
            }
        };

        ws.onerror = () => {
            setWsStatus('closed');
        };

        ws.onclose = () => {
            wsRef.current = null;
            setWsStatus('closed');
        };

        return () => {
            ws.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendWs = (payload) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify(payload));
    };

    if (!visible) return null;

    const handleClosePanel = () => {
        setVisible(false);
        onClose && onClose();
    };

    const startResize = (e) => {
        e.preventDefault();
        const vw = getViewportWidth();
        const maxWidth = vw - 8;

        const startLeft = vw - 4 - width;
        const grabOffset = e.clientX - startLeft;

        const move = (ev) => {
            const vw2 = getViewportWidth();
            const minLeft = 4;
            const maxLeft = vw2 - 4 - minWidth;

            let newLeft = ev.clientX - grabOffset;
            if (newLeft < minLeft) newLeft = minLeft;
            if (newLeft > maxLeft) newLeft = maxLeft;

            if (newLeft < SNAP) {
                newLeft = minLeft;
                if (!snapped) setSnapped(true);
            } else {
                if (snapped) setSnapped(false);
            }

            const newWidth = vw2 - 4 - newLeft;
            const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            setWidth(clampedWidth);
        };

        const cleanup = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', cleanup);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', cleanup);
    };

    const toggleMax = () => {
        const vw = getViewportWidth();
        const maxWidth = vw - 8;
        if (snapped) {
            setSnapped(false);
            setWidth(minWidth);
            return;
        }
        setSnapped(true);
        setWidth(maxWidth);
    };

    getStore().then(store =>
        sendWs({
            type: 'delete-dialog',
            userId: store.getState().user.userId
        })
    );

    const createNewDialog = () => {
        sendWs({
            type: 'delete-dialog',
            userId: store.getState().user.userId
        });
        const ws = wsRef.current;
        getStore().then(store =>
            ws.send(JSON.stringify({
                type: 'create-dialog',
                userId: store.getState().user.userId
            }))
        );
    };

    const vw = getViewportWidth();
    const leftPos = snapped ? 0 : vw - 4 - width;

    const activeMessages = activeUid ? messagesByDialog[activeUid] || [] : [];

    const isProcessing = !!(activeUid && processingByDialog[activeUid]);

    return (
        <>
            <div
                onMouseDown={startResize}
                style={{
                    position: 'fixed',
                    top: 110,
                    bottom: 62,
                    left: leftPos,
                    width: 6,
                    cursor: 'ew-resize',
                    zIndex: 4001,
                    background: 'rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                        'rgba(255,255,255,0.12)')
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                        'rgba(255,255,255,0.05)')
                }
            />

            <Box
                sx={{
                    position: 'fixed',
                    top: snapped ? 0 : 4,
                    right: snapped ? 0 : 4,
                    width: snapped ? '100vw' : width,
                    height: '100%',
                    paddingBottom: '4px',
                    transition: `
                        width .15s cubic-bezier(0.2,0.9,0.3,1),
                        height .15s cubic-bezier(0.2,0.9,0.3,1),
                        top .15s ease,
                        right .15s ease
                    `,
                    background: 'rgba(15,23,42,0.96)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: snapped
                        ? 'none'
                        : '0 16px 40px rgba(0,0,0,0.7)',
                    zIndex: 3000,
                    color: '#E6EDF7',
                    border: 'none',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        border: '1px solid #1F2937',
                        borderRadius: snapped ? 0 : '10px',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />

                <Box
                    sx={{
                        p: 1.5,
                        borderBottom: '1px solid #1F2937',
                        background: '#0B1220',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <ChatBubbleOutlineIcon sx={{ color: '#E6EDF7' }} />
                        <Typography
                            variant="subtitle1"
                            sx={{ flexGrow: 1, fontWeight: 600 }}
                        >
                            ИИ-агент
                        </Typography>

                        {activeStatus && <DialogStatusChip status={activeStatus} />}

                        <IconButton
                            onClick={toggleMax}
                            sx={{ color: '#E5E7EB' }}
                        >
                            {snapped ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleClosePanel}
                            sx={{ color: '#E5E7EB' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {wsStatus === 'closed' && (
                        <Box
                            sx={{
                                mt: 0.5,
                                p: 1,
                                borderRadius: 2,
                                background: '#7f1d1d',
                                color: '#fee2e2',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                            }}
                        >
                            <span>Нет подключения к AI-серверу.</span>
                        </Box>
                    )}

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 0.5,
                            alignItems: 'center',
                            mt: 0.5,
                        }}
                    >
                        <BrightCircleButtonStable
                            icon="+"
                            onClick={createNewDialog}
                        />

                        {dialogs.map((d) => {
                            const a = d.uid === activeUid;
                            return (
                                <Box
                                    key={d.uid}
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 999,
                                        border: '1px solid #1F2937',
                                        background: a ? '#1E293B' : 'transparent',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => {
                                        setActiveUid(d.uid);
                                        sendWs({
                                            type: 'get-dialog',
                                            uid: d.uid,
                                        });
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#E6EDF7',
                                            maxWidth: 180,
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {d.title}
                                    </Typography>

                                    {!!d.unreadCount && (
                                        <Box
                                            sx={{
                                                minWidth: 16,
                                                height: 16,
                                                borderRadius: 999,
                                                background: '#2563EB',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                fontSize: 10,
                                            }}
                                        >
                                            {d.unreadCount}
                                        </Box>
                                    )}

                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseDialog(d.uid);
                                        }}
                                        sx={{
                                            ml: 0.25,
                                            color: '#9CA3AF',
                                            '&:hover': {
                                                color: '#F9FAFB',
                                            },
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {activeUid ? (
                    <DialogBody
                        dialogUid={activeUid}
                        messages={activeMessages}
                        isProcessing={isProcessing}
                        onStop={() => sendWs({ type: 'stop', uid: activeUid })}
                        onSendMessage={(text) => {
                            sendWs({
                                type: 'user-message',
                                uid: activeUid,
                                text,
                            });
                            setProcessingByDialog((prev) => ({
                                ...prev,
                                [activeUid]: true,
                            }));
                        }}
                        onRegenerate={(messageId) =>
                            sendWs({
                                type: 'regenerate',
                                uid: activeUid,
                                messageId,
                            })
                        }
                    />
                ) : (
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6B7280',
                            fontSize: 14,
                        }}
                    >
                        Нет активных диалогов
                    </Box>
                )}
            </Box>
        </>
    );
}

// =============== WIDGET / BUTTON ===============

export function AiAgentWidget() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {!open && (
                <Fab
                    color="primary"
                    onClick={() => setOpen(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 64,
                        right: 28,
                        zIndex: 3000,
                        width: 50,
                        height: 50,
                        background:
                            'linear-gradient(135deg,#2563EB,#38BDF8)',
                        boxShadow: '0 0 20px rgba(0,0,0,0.45)',
                        '&:hover': {
                            boxShadow: '0 0 28px rgba(0,0,0,0.6)',
                        },
                    }}
                >
                    <SmartToyIcon sx={{ fontSize: 32 }} />
                </Fab>
            )}

            {open && <AiDialogView onClose={() => setOpen(false)} />}
        </>
    );
}

export function AiAgentButton({ onOpen }) {
    return (
        <Button
            size="small"
            variant="outlined"
            startIcon={<SmartToyIcon sx={{ fontSize: 18 }} />}
            sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                    transform: 'scale(1.05)',
                    background:
                        'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(56,189,248,0.15))',
                    borderColor: 'primary.dark',
                    boxShadow: '0 0 10px rgba(56,189,248,0.35)',
                },
                '&:active': {
                    transform: 'scale(0.97)',
                },
            }}
            onClick={onOpen}
        >
            ИИ-агент
        </Button>
    );
}
