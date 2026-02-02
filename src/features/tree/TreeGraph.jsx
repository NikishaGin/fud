// src/features/tree/TreeGraph.jsx
import * as React from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Panel,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Chip, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { layoutGraph } from './treeSlice';
import { Handle, Position } from 'reactflow';
// ===== Кастомный узел (карточка функции) =====



function NodeCard({ data }) {
    const { id, title, block, head, sources, onOpen } = data;

    return (
        <Box
            sx={(t) => ({
                p: 1.5,
                width: 260,                 // ← карточка чуть шире
                borderRadius: 2,
                border: '1px solid',
                borderColor: t.palette.divider,
                backgroundColor: t.palette.background.paper,
                boxShadow: '0 4px 12px rgba(15,23,42,0.10)',
                color: t.palette.text.primary,
                cursor: 'default',
                position: 'relative',      // для Handle
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                '&:hover': {
                    boxShadow: '0 6px 16px rgba(15,23,42,0.18)',
                },
            })}
        >
            {/* входящий handle (родитель → этот узел) */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: '#64748b', width: 8, height: 8 }}
            />

            {/* исходящий handle (этот узел → дети) */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: '#dc2626', width: 8, height: 8 }}
            />

            {/* Верхняя строка: ID + источники */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box
                    sx={(t) => ({
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                        fontSize: 12,
                        fontWeight: 800,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 999,
                        border: '1px solid',
                        borderColor: t.palette.primary.main,
                        color: t.palette.primary.main,
                        backgroundColor: alpha(t.palette.primary.main, 0.05),
                    })}
                >
                    ID&nbsp;{id}
                </Box>

                {!!(sources && sources.length) && (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                        {sources.map((s, i) => (
                            <Chip
                                key={i}
                                size="small"
                                label={s}
                                variant="filled"
                                sx={(t) => ({
                                    height: 20,
                                    '& .MuiChip-label': { px: 0.75, fontSize: 11 },
                                    backgroundColor: alpha(t.palette.info.main, 0.12),
                                    color: t.palette.info.main,
                                })}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>

            {/* Блок (подзаголовок) */}
            <Typography
                variant="caption"
                sx={{
                    mt: 0.25,
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {block || 'Без блока'}
            </Typography>

            {/* Основной текст функции (2–3 строки, дальше обрезаем) */}
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,   // максимум 3 строки
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {title || 'Без названия'}
            </Typography>

            {/* Низ карточки: начальник + кнопка "открыть" */}
            <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={head || 'Без начальника'}
                    sx={{
                        maxWidth: 170,
                        '& .MuiChip-label': {
                            px: 0.75,
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        },
                    }}
                />

                <Tooltip title="Открыть в таблице">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen?.(id);
                        }}
                    >
                        <OpenInNewIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
}


const nodeTypes = { default: NodeCard };


const EDGE_COLORS = [
    '#f97316', // оранжевый
    '#22c55e', // зелёный
    '#38bdf8', // голубой
    '#a855f7', // фиолетовый
    '#eab308', // жёлтый
    '#ec4899', // розовый
];

// ===== Основной компонент графа =====
export default function TreeGraph({ graph, onOpenById }) {
    // подмешиваем onOpen в data каждого узла
    const attachOpen = React.useMemo(
        () => ({
            nodes: (graph?.nodes || []).map((n) => ({
                ...n,
                data: { ...n.data, onOpen: onOpenById },
            })),
            edges: graph?.edges || [],
        }),
        [graph, onOpenById]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(attachOpen.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(attachOpen.edges);

    // навешиваем стиль/стрелку на каждый edge: свой цвет на КАЖДОГО РОДИТЕЛЯ
    const decoratedEdges = React.useMemo(() => {
        const colorBySource = new Map();
        let colorIndex = 0;

        return (edges || []).map((e) => {
            const sourceId = String(e.source);

            let color = colorBySource.get(sourceId);
            if (!color) {
                color = EDGE_COLORS[colorIndex % EDGE_COLORS.length];
                colorBySource.set(sourceId, color);
                colorIndex += 1;
            }

            return {
                ...e,
                type: 'smoothstep',
                style: { strokeWidth: 2, stroke: color },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color,
                },
            };
        });
    }, [edges]);

    // автолэйаут при изменении graph
    React.useEffect(() => {
        let alive = true;
        (async () => {
            const { nodes: laidNodes, edges: laidEdges } = await layoutGraph(attachOpen);
            if (!alive) return;
            setNodes(laidNodes);
            setEdges(laidEdges);
        })();
        return () => {
            alive = false;
        };
    }, [attachOpen, setNodes, setEdges]);

    return (
        <Box
            sx={(t) => ({
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor:
                    t.palette.mode === 'light'
                        ? '#0f172a'
                        : t.palette.background.default,
            })}
        >
            <ReactFlow
                nodes={nodes}
                edges={decoratedEdges}
                nodeTypes={nodeTypes}
                // ===== Зум =====
                minZoom={0.2}                 // насколько можно отдалить вручную
                maxZoom={1.5}                 // максимум для приближения
                // ✅ начальный зум и сдвиг
                defaultViewport={{ zoom: 0.6, x: 0, y: 0 }}  // 0.5 — это уже "отдалённо"

                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                panOnScroll
                panOnDrag
                zoomOnScroll
                zoomOnPinch
                proOptions={{ hideAttribution: true }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeOrigin={[0, 0]}
            >
                <Background gap={24} size={0.7} color="#1e293b" />
                <MiniMap pannable zoomable nodeStrokeColor="#64748b" nodeColor="#1e293b" />
                <Controls position="bottom-right" />
                <Panel position="top-left">
                    <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, py: 0.5 }}>
                        Узлов: {nodes.length} · Связей: {edges.length}
                    </Typography>
                </Panel>
            </ReactFlow>
        </Box>
    );
}

