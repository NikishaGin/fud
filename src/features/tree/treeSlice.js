// src/features/tree/treeSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {getTreeByHead} from "../records/api.js";


export const fetchTreeByHead = createAsyncThunk(
    'tree/fetchTreeByHead',
    async (departmentHeadId) => {
        const tree = await getTreeByHead(departmentHeadId);
        console.log('tree', tree)
        return tree;
    }
);

const initialState = {
    data: [], // исходный ответ бэка
    statistics: {
        count: 0,
        countChildren: 0,
        countPairs: 0,
        countWithoutPairs: 0,
    },
    status: 'idle',         // idle|loading|succeeded|failed
    error: null,
    currentHeadId: null,    // для информации/повторных запросов
};

const treeSlice = createSlice({
    name: 'tree',
    initialState,
    reducers: {
        resetTree(state) {
            state.data = [];
            state.statistics = {
                count: 0,
                countChildren: 0,
                countPairs: 0,
                countWithoutPairs: 0,
            };
            state.status = 'idle';
            state.error = null;
            state.currentHeadId = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTreeByHead.pending, (state, { meta }) => {
                state.status = 'loading';
                state.error = null;
                state.currentHeadId = meta.arg ?? null;
                state.statistics = {
                    count: 0,
                    countChildren: 0,
                    countPairs: 0,
                    countWithoutPairs: 0,
                };
            })
            .addCase(fetchTreeByHead.fulfilled, (state, { payload }) => {
                state.status = 'succeeded';

                // если бэкенд отдаёт { tree, statistics }
                state.data = payload.tree || [];

                state.statistics = {
                    count: payload.statistics?.count ?? 0,
                    countChildren: payload.statistics?.countChildren ?? 0,
                    countPairs: payload.statistics?.countPairs ?? 0,
                    countWithoutPairs: payload.statistics?.countWithoutPairs ?? 0,
                };
            })

            .addCase(fetchTreeByHead.rejected, (state, { error }) => {
                state.status = 'failed';
                state.error = error?.message || 'Failed to load tree';
                state.data = [];
                state.statistics = {
                    count: 0,
                    countChildren: 0,
                    countPairs: 0,
                    countWithoutPairs: 0,
                };
            });
    }
});

export const { resetTree } = treeSlice.actions;
export default treeSlice.reducer;

// ===== селекторы
const selectSelf = (s) => s.tree;
export const selectTreeData       = createSelector(selectSelf, s => s.data);
export const selectTreeStatus     = createSelector(selectSelf, s => s.status);
export const selectTreeError      = createSelector(selectSelf, s => s.error);
export const selectTreeHeadId     = createSelector(selectSelf, s => s.currentHeadId);
export const selectTreeStatistics = createSelector(selectSelf, s => s.statistics);




// ===== нормализация бэка в граф (и children, и parents) =====
const makeGraphFromTree = (tree) => {
    const nodes = [];
    const edges = [];

    const seenNodes = new Set();
    const seenEdges = new Set();

    const baseNodeStyle = {
        padding: 0,
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
    };

    const pushNode = (n) => {
        const id = String(n?.id);
        if (!id || seenNodes.has(id)) return;

        seenNodes.add(id);
        nodes.push({
            id,
            data: {
                id,
                title: n.function || `ID ${id}`,
                block: n.functionBlock || '',
                head: n.departmentHead?.name || '',
                sources: (Array.isArray(n.sources) ? n.sources : [])
                    .map((s) => s?.value)
                    .filter(Boolean),
            },
            position: { x: 0, y: 0 }, // координаты расставит layoutGraph
            type: 'default',
            // ВАЖНО: глушим дефолтный "белый прямоугольник" React Flow
            style: baseNodeStyle,
        });
    };

    const addEdge = (sourceId, targetId) => {
        if (!sourceId || !targetId) return;
        const s = String(sourceId);
        const t = String(targetId);
        const key = `${s}->${t}`;
        if (seenEdges.has(key)) return;
        seenEdges.add(key);
        edges.push({ id: key, source: s, target: t });
    };

    const walk = (node) => {
        if (!node) return;

        pushNode(node);
        const selfId = String(node.id);

        // дети (как раньше)
        const childrenArr = Array.isArray(node.children) ? node.children : [];
        childrenArr.forEach((item) => {
            const child = item?.child ?? item;
            if (!child) return;
            pushNode(child);
            addEdge(selfId, child.id); // parent → child
            walk(child);
        });

        // родители (новый кейс)
        const parentsArr = Array.isArray(node.parents) ? node.parents : [];
        parentsArr.forEach((item) => {
            const parent = item?.parent ?? item;
            if (!parent) return;
            pushNode(parent);
            addEdge(parent.id, selfId); // parent → child
            walk(parent);
        });
    };

    (Array.isArray(tree) ? tree : []).forEach(walk);

    return { nodes, edges };
};





// селектор: отдаёт исходные nodes/edges (без координат)
export const selectFlowGraphRaw = createSelector(
    (s) => s.tree.data,
    (data) => makeGraphFromTree(data)
);


// src/features/tree/treeSlice.js (вместо текущего layoutGraph)

// ==== простой вертикальный автолэйаут без ELK ====

// src/features/tree/treeSlice.js

// Размеры для расчёта лэйаута
const NODE_WIDTH = 260;   // примерно ширина карточки (220 + паддинги/бордер)
const H_GAP = 40;         // горизонтальный зазор между поддеревьями
const V_GAP = 320;        // вертикальный зазор (родитель → дети)
const ROOT_GAP = 120;     // отступ между несколькими корнями

export const layoutGraph = async ({ nodes, edges }) => {
    // parent / children
    const parentOf = new Map();
    const childrenOf = new Map();

    edges.forEach((e) => {
        const s = String(e.source);
        const t = String(e.target);

        parentOf.set(t, s);
        if (!childrenOf.has(s)) childrenOf.set(s, []);
        childrenOf.get(s).push(t);
    });

    const allIds = nodes.map((n) => String(n.id));
    const roots = allIds.filter((id) => !parentOf.has(id)); // корни — без родителя

    // ширина поддерева по id
    const subtreeWidth = new Map();

    const computeWidth = (id) => {
        if (subtreeWidth.has(id)) return subtreeWidth.get(id);

        const kids = childrenOf.get(id) || [];
        if (!kids.length) {
            // лист: минимум ширина одной карточки
            subtreeWidth.set(id, NODE_WIDTH);
            return NODE_WIDTH;
        }

        // есть дети → ширина = сумма ширин поддеревьев + зазоры
        let totalChildrenWidth = 0;
        kids.forEach((childId, idx) => {
            const w = computeWidth(childId);
            totalChildrenWidth += w;
            if (idx > 0) totalChildrenWidth += H_GAP;
        });

        const width = Math.max(NODE_WIDTH, totalChildrenWidth);
        subtreeWidth.set(id, width);
        return width;
    };

    roots.forEach(computeWidth);

    const posById = new Map();

    // рекурсивно расставляем узлы
    const assignPositions = (id, leftX, topY) => {
        const width = subtreeWidth.get(id) || NODE_WIDTH;

        // центрируем карточку внутри своего поддерева
        const nodeX = leftX + (width - NODE_WIDTH) / 2;
        const nodeY = topY;
        posById.set(id, { x: nodeX, y: nodeY });

        const kids = childrenOf.get(id) || [];
        if (!kids.length) return;

        // стартовая X-координата для первого ребёнка
        let currentLeft = leftX;

        kids.forEach((childId, index) => {
            const childWidth = subtreeWidth.get(childId) || NODE_WIDTH;

            // позиция поддерева ребёнка
            assignPositions(childId, currentLeft, topY + V_GAP);

            // смещаемся вправо на ширину поддерева + зазор
            currentLeft += childWidth + H_GAP;
        });
    };

    // раскладываем корни рядом
    let currentRootLeft = 0;
    roots.forEach((rootId, idx) => {
        const width = subtreeWidth.get(rootId) || NODE_WIDTH;
        assignPositions(rootId, currentRootLeft, 0);
        currentRootLeft += width + ROOT_GAP;
    });

    return {
        nodes: nodes.map((n) => ({
            ...n,
            position: posById.get(String(n.id)) ?? { x: 0, y: 0 },
            sourcePosition: 'bottom',
            targetPosition: 'top',
        })),
        edges,
    };
};






