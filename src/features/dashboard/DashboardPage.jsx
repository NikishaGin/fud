// src/features/dashboard/DashboardPage.jsx
import * as React from 'react';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';
import {getDashboard} from "../records/api.js";

/* ================= MOCKS: данные для 9 пончиков ================= */
const PAL = {
    ok:   '#5BD29C', // заполнено / согласовано
    warn: '#7E83A0', // не заполнено / не отправлено
    error: '#ff0000',
    info: '#5B77FF', // на рассмотрении / отправлено
    bad:  '#F39B7F', // отклонено
};


function DonutMini({ title, center, slices }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>

            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <PieChart
                    width={260}
                    height={260}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    slotProps={{ legend: { hidden: true } }}
                    series={[{
                        data: slices.map(s => ({
                            id: s.id,
                            value: s.percent,
                            label: s.label,
                            color: s.color,
                            count: s.count,
                        })),
                        innerRadius: 70,
                        outerRadius: 120,
                        startAngle: -90, endAngle: 270,
                        paddingAngle: 1.2, cornerRadius: 5,
                        // показываем % на дуге только если >= 1%
                        arcLabel: ({ value }) => (value >= 1 ? `${Math.round(value)}%` : ''),
                        arcLabelMinAngle: 18,
                        valueFormatter: ({ value }) => `${(value ?? 0).toFixed(2)}%`,
                    }]}
                    colors={slices.map(s => s.color)}
                    sx={{
                        '& .MuiChartsArc-root': (t) => ({
                            stroke: t.palette.background.paper,
                            strokeWidth: 2,
                        }),
                        '& .MuiChartsLegend-root': { display: 'none !important' },
                    }}
                />

                {/* центр пончика: заголовок + число */}
                <Box
                    sx={{
                        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none',
                    }}
                >
                    <Stack sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                        <Typography fontSize={13} color="text.secondary">{center.top}</Typography>
                        <Typography color="primary" fontWeight={900} fontSize={28}>{center.value}</Typography>
                    </Stack>
                </Box>
            </Box>

            {/* мини-легенда: название статуса — count (percent) */}
            <Stack spacing={0.75} sx={{ mt: 1 }}>
                {slices.map(s => (
                    <Stack key={s.id} direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                            {s.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>{s.count}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, ml: 0.5 }}>({(s.percent ?? 0).toFixed(2)} %)</Typography>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}

function SectionOfThree({ title, comment, items }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={900}>{title}</Typography>
            {comment && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                    {comment}
                </Typography>
            )}
            <Grid container spacing={2}>
                {items.map((it) => (
                    <Grid key={it.key} item xs={12} md={4}>
                        <DonutMini title={it.title} center={it.center} slices={it.slices} />
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}

/* ================= 9 пончиков по ТЗ ================= */
function NineDonutsPanel() {
    const [stats, setStats] = React.useState({});

    React.useEffect(() => {
        try {
            getDashboard().then((res) => setStats(res || {}))
        } catch (error) {
            console.log(error);
        }
    }, [])


    // 1) Полнота заполнения обязательных полей (2 части)
    const completeness = ['URZ', 'UOPB', 'MIUDOL'].map((code) => {
        const countFilledRows = stats?.countFilledRows?.[code];

        return {
            key: code,
            title: { URZ: 'УРЗ', UOPB: 'УОПБ', MIUDOL: 'МИУДОЛ' }[code],
            center: { top: 'Всего функций', value: countFilledRows?.TOTAL?.count },
            slices: [
                { label: 'Заполнено', ...countFilledRows?.FILLED, color: PAL.ok },
                { label: 'Не заполнено', ...countFilledRows?.UNFILLED, color: PAL.warn },
            ],
        };
    });


    // 2) Согласование 1-й линии (3 части)
    const approvalL1 = ['URZ', 'UOPB', 'MIUDOL'].map((code) => {
        const functionMatchingFirstLine = stats?.functionMatchingFirstLine?.[code];
        const curatorAcronym = code === 'MIUDOL' ? 'ЗНИ' : 'ЗНУ';
        const chiefAcronym = code === 'MIUDOL' ? 'НИ' : 'НУ';

        return {
            key: code,
            title: { URZ: 'УРЗ', UOPB: 'УОПБ', MIUDOL: 'МИУДОЛ' }[code],
            center: { top: 'Всего функций', value: functionMatchingFirstLine?.TOTAL },
            slices: [
                { label: `На рассмотрении (${curatorAcronym})`, ...functionMatchingFirstLine?.ACCEPT_CURATOR, color: PAL.bad },
                { label: `На согласовании (${chiefAcronym})`, ...functionMatchingFirstLine?.ACCEPT_CHIEF, color: PAL.info },
                { label: 'Согласовано', ...functionMatchingFirstLine?.APPROVED, color: PAL.ok },
                { label: 'Отклонено', ...functionMatchingFirstLine?.REJECTED, color: PAL.error },
                { label: 'Не отправлено', ...functionMatchingFirstLine?.NOT_SENT, color: PAL.warn },
            ],
        };
    });


    // 3) Согласование 2-й линии (особые правила)
    const approvalL2 = ['URZ', 'UOPB', 'MIUDOL'].map((code) => {
        const functionMatchingSecondLine = stats?.functionMatchingSecondLine?.[code];

        return {
            key: code,
            title: { URZ: 'УРЗ', UOPB: 'УОПБ', MIUDOL: 'МИУДОЛ' }[code],
            center: {
                top: code === 'MIUDOL' ? 'Всего функций' : 'Отправлено всего',
                value: functionMatchingSecondLine?.TOTAL?.count
            },
            slices: code !== 'MIUDOL'
                ? [
                    { label: 'На рассмотрении', ...functionMatchingSecondLine?.ACCEPT, color: PAL.info },
                    { label: 'Согласовано', ...functionMatchingSecondLine?.APPROVED, color: PAL.ok },
                    { label: 'Отклонено', ...functionMatchingSecondLine?.REJECTED, color: PAL.error },
                    { label: 'Не отправлено', ...functionMatchingSecondLine?.NOT_SENT, color: PAL.warn },
                ]
                : [
                    { label: 'Отправлено на согласование', ...functionMatchingSecondLine?.SENT, color: PAL.info },
                    { label: 'Согласовано (сотрудниками ЦА)', ...functionMatchingSecondLine?.APPROVED, color: PAL.ok },
                    { label: 'Отклонено (сотрудниками ЦА)', ...functionMatchingSecondLine?.REJECTED, color: PAL.error },
                    { label: 'Не отправлено на согласование', ...functionMatchingSecondLine?.NOT_SENT, color: PAL.warn },
                ],
        };
    })

    const countFunctions = stats?.countFunctions;

    return (
        <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={7}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                letterSpacing: 0.2,
                            }}
                        >
                            Состояние описания и согласования функций: УРЗ-УОПБ-МИУДОЛ
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                        >
                            {/* KPI #1 */}
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                                    color: 'text.primary',
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': {
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    },
                                }}
                            >
                                <Typography
                                    component="span"
                                    fontWeight={500}
                                    fontSize={16}
                                    sx={{ letterSpacing: 0.2 }}
                                >
                                    УРЗ — <Typography component="span" fontWeight={600}>{countFunctions?.URZ}</Typography>
                                </Typography>
                            </Box>

                            {/* KPI #2 */}
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                                    color: 'text.primary',
                                    '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                }}
                            >
                                <Typography component="span" fontWeight={500} fontSize={16}>
                                    УОПБ — <Typography component="span" fontWeight={600}>{countFunctions?.UOPB}</Typography>
                                </Typography>
                            </Box>

                            {/* KPI #3 */}
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                                    color: 'text.primary',
                                    '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                }}
                            >
                                <Typography component="span" fontWeight={500} fontSize={16}>
                                    МИУДОЛ — <Typography component="span" fontWeight={600}>{countFunctions?.MIUDOL}</Typography>
                                </Typography>
                            </Box>
                            {/* KPI #4 */}
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                                    color: 'text.primary',
                                    '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                }}
                            >
                                <Typography component="span" fontWeight={500} fontSize={16}>
                                    Всего — <Typography component="span" fontWeight={600}>{countFunctions?.COMMON}</Typography>
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <SectionOfThree
                title="Полнота заполнения обязательных полей"
                comment="Если хоть одно обязательное поле не заполнено, функция считается невалидной."
                items={completeness}
            />

            <SectionOfThree
                title="Согласование функций 1-ой линии"
                comment="Начальник отдела согласовывает со своим начальником СП ЦА или МИУДОЛ."
                items={approvalL1}
            />

            <SectionOfThree
                title="Согласование функций 2-ой линии"
                comment="МИУДОЛ согласовывает свои функции с бенефициаром (сотрудник ЦА)."
                items={approvalL2}
            />
        </Stack>
    );
}

/* ================= Страница ================= */
export default function DashboardPage() {
    return (
        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
            <NineDonutsPanel />
        </Box>
    );
}
