// src/features/records/recordsSlice.js
import {createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit'
import {
    getRecords,
    patchRecord,
    getCurators,
    getDepartments,
    getDti,
    getHeads,
    getCustomersMiudol,
    getCustomersCa, createRecord, deleteRecord, createTree, deleteTree, getTreeParents, getTreeChildren
} from './api'
import {pushToast} from '../ui/uiSlice'
import {applyColMeta} from './columnsMeta'
import {getLatestStage} from "../../utils/acceptFilter.js";

// ---------- Заголовки и порядок (без изменений) ----------
export const FIELD_LABELS = {
    // Исполнитель
    sources: 'Исполнитель функции',
    curatorId: 'Курирующий НУ/ЗНУ НИ/ЗНИ',
    departmentNameId: 'Отдел',
    departmentHeadId: 'ФИО начальника (ио) Отдела',
    // Идентификация
    functionBlock: 'Блок функции',
    function: 'Функция',
    functionDetails: 'Детализация функции',
    // Значимость
    dtiIds: 'Проект Стратегии Д (DTI)',
    customerId: 'Кто заказчик функции',
    howCustomerUses: 'Как использует',
    whyCustomerUses: 'Зачем использует?',
    // Атрибуты
    complexity: 'Сложность',
    reason: 'Основание',
    execution: 'Периодичность выполнения',
    artifact: 'Артефакт: вид + реквизиты последнего',
    estimationII: 'Оценка ИИ (живой ПСОФ)',
    // Не обязательнные поля
    effectiveness: 'Эффективность функции',
    action: 'Что сделать?',
    comment: 'Комментарий'
}

const FIELD_ORDER = [
    // Исполнитель
    'sources',
    'curatorId',
    'departmentNameId',
    'departmentHeadId',
    // Идентификация
    'functionBlock',
    'function',
    'functionDetails',
    // Значимость
    'dtiIds',
    'customerId',
    'howCustomerUses',
    'whyCustomerUses',
    // Атрибуты
    'complexity',
    'reason',
    'execution',
    'artifact',
    'estimationII',
    // Не обязательнные поля
    'effectiveness',
    'action',
    'comment'
]

const HIDDEN_FIELDS = new Set(['createdAt', 'updatedAt'])
const APPEND_UNKNOWN_FIELDS = false

// ---------- Санки данных таблицы ----------
export const fetchRecords = createAsyncThunk('records/fetch', async () => {
    const {data} = await getRecords()
    return Array.isArray(data) ? data : []
})


export const patchRow = createAsyncThunk(
    'records/patchRow',
    async ({id, changes}, {dispatch}) => {
        const {data} = await patchRecord(id, changes)
        dispatch(pushToast({type: 'success', message: 'Сохранено'}))
        return data // сервер вернёт обновлённую запись
    }
)

export const fetchCurators = createAsyncThunk(
    'records/fetchCurators',
    async () => {
        const rows = await getCurators()
        return rows
            .filter(r => r && r.id != null && r.name != null)
            .map(r => ({id: r.id, name: r.name}))
    }
)

export const fetchDti = createAsyncThunk(
    'records/fetchDti',
    async () => {
        const rows = await getDti()
        return rows
            .filter(r => r && r.id != null && r.value != null)
            .map(r => ({id: r.id, value: r.value}))
    }
)

export const fetchDepartments = createAsyncThunk(
    'records/fetchDepartments',
    async () => {
        const rows = await getDepartments()
        return rows
            .filter(r => r && r.id != null && r.name != null)
            .map(r => ({id: r.id, name: r.name}))
    }
)

export const fetchHead = createAsyncThunk(
    'records/fetchHead',
    async () => {
        const rows = await getHeads()
        return rows
            .filter(r => r && r.id != null && r.name != null)
            .map(r => ({id: r.id, name: r.name}))
    }
)

export const fetchCustomersMiudol = createAsyncThunk(
    'records/fetchCustomersMiudol',
    async () => {
        const rows = await getCustomersMiudol()
        return rows
    }
)

export const fetchCustomersCa = createAsyncThunk(
    'records/fetchCustomersCa',
    async () => {
        const rows = await getCustomersCa()
        console.log('fetchCustomersCa', rows)
        return rows
    }
)

export const addRecord = createAsyncThunk(
    'records/add',
    async (payload) => {
        const created = await createRecord(payload);
        return created;
    }
);

export const deleteRecordThunk = createAsyncThunk(
    'records/delete',
    async (id) => {
        await deleteRecord(id);
        return id; // вернём id, чтобы удалить из стора
    }
);

export const fetchTreeParents = createAsyncThunk(
    'records/fetchTreeParents',
    async () => {
        const rows = await getTreeParents();
        return (Array.isArray(rows) ? rows : [])
            .filter(r => r && r.value != null && r.label != null)
            .map(r => ({ value: String(r.value), label: String(r.label) }));
    }
);


export const fetchTreeChildren = createAsyncThunk(
    'records/fetchTreeChildren',
    async () => {
        const rows = await getTreeChildren();
        return (Array.isArray(rows) ? rows : [])
            .filter(r => r && r.value != null && r.label != null)
            .map(r => ({ value: String(r.value), label: String(r.label) }));
    }
);


export const saveParentLink = createAsyncThunk(
    'records/saveParentLink',
    async ({ dataId, parentId }) => {
        const answer = await createTree(dataId, { parentId });
        return { dataId, ...answer };
    }
);

export const saveAddChildLink = createAsyncThunk(
    'records/saveAddChildLink',
    async ({ dataId, childId }) => {
        const answer = await createTree(dataId, { childId });
        return { dataId, ...answer };
    }
);


export const deleteTreeThunk = createAsyncThunk(
    'records/deleteTreeThunk',
    async (id) => {
        await deleteTree(id);
        return id;
    }
);



// ---------- Стор ----------
const newVar = {
    columns: [],
    entities: {},
    ids: [],
    filters: {},
    status: 'idle',
    error: null,
    pendingMap: {},

    curators: [],
    curatorsStatus: 'idle',
    curatorsError: null,

    department: [],
    departmentStatus: 'idle',
    departmentError: null,

    head: [],
    headStatus: 'idle',
    headError: null,

    dti: [],
    dtiStatus: 'idle',
    dtiError: null,

    customersMiudol: [],
    customersMiudolStatus: 'idle',
    customersMiudolError: null,

    customersCa: [],
    customersCaStatus: 'idle',
    customersCaError: null,

    tree: [],
    treeStatus: 'idle',
    treeError: null,

    tree2: [],
    treeStatus2: 'idle',
    treeError2: null,
};
const initialState = newVar

const recordsSlice = createSlice({
    name: 'records',
    initialState,
    reducers: {
        setFilter(state, {payload}) {
            const {field, values} = payload
            state.filters[field] = values
        },
    },
    extraReducers: builder => {
        builder
            // таблица
            .addCase(fetchRecords.fulfilled, (state, {payload}) => {
                state.status = 'succeeded'
                state.entities = {}
                state.ids = []
                payload.forEach(row => {
                    state.entities[row.id] = row;
                    state.ids.push(row.id)
                })

                if (state.columns.length === 0 && payload[0]) {
                    const present = Object.keys(payload[0]).filter(k => !HIDDEN_FIELDS.has(k))
                    const ordered = FIELD_ORDER.filter(f => present.includes(f))
                    const rest = APPEND_UNKNOWN_FIELDS
                        ? present.filter(f => f !== 'id' && !ordered.includes(f)).sort((a, b) => a.localeCompare(b, 'ru'))
                        : []
                    const finalOrder = [...ordered, ...rest]

                    state.columns = finalOrder.map((field) => ({
                        field,
                        headerName: FIELD_LABELS[field] ?? field,
                        ...applyColMeta(field),
                    }))
                    state.filters = Object.fromEntries(state.columns.map(c => [c.field, null]))
                }
            })
            .addCase(fetchRecords.rejected, (state, {error}) => {
                state.status = 'failed'
                state.error = error.message
            })

            .addCase(patchRow.pending, (state, {meta}) => {
                state.pendingMap[`row::${meta.arg.id}`] = true
            })
            .addCase(patchRow.fulfilled, (state, {payload, meta}) => {
                state.pendingMap[`row::${meta.arg.id}`] = false  // вместо delete
                if (payload?.id != null) {
                    state.entities[payload.id] = {...state.entities[payload.id], ...payload}
                }
            })
            .addCase(patchRow.rejected, (state, {meta}) => {
                state.pendingMap[`row::${meta.arg.id}`] = false  // вместо delete
            })

            .addCase(fetchCurators.pending, (state) => {
                state.curatorsStatus = 'loading'
                state.curatorsError = null
            })
            .addCase(fetchCurators.fulfilled, (state, {payload}) => {
                state.curatorsStatus = 'succeeded'
                state.curators = payload // [{id,name}]
            })
            .addCase(fetchCurators.rejected, (state, {error}) => {
                state.curatorsStatus = 'failed'
                state.curatorsError = error.message
            })

            .addCase(fetchDepartments.pending, (state) => {
                state.departmentStatus = 'loading'
                state.departmentError = null
            })
            .addCase(fetchDepartments.fulfilled, (state, {payload}) => {
                state.departmentStatus = 'succeeded'
                state.department = payload // [{id,name}]
            })
            .addCase(fetchDepartments.rejected, (state, {error}) => {
                state.departmentStatus = 'failed'
                state.departmentError = error.message
            })

            .addCase(fetchHead.pending, (state) => {
                state.headStatus = 'loading'
                state.headError = null
            })
            .addCase(fetchHead.fulfilled, (state, {payload}) => {
                state.headStatus = 'succeeded'
                state.head = payload // [{id,name}]
            })
            .addCase(fetchHead.rejected, (state, {error}) => {
                state.headStatus = 'failed'
                state.headError = error.message
            })

            .addCase(fetchDti.pending, (state) => {
                state.dtiStatus = 'loading'
                state.dtiError = null
            })
            .addCase(fetchDti.fulfilled, (state, {payload}) => {
                state.dtiStatus = 'succeeded'
                state.dti = payload // [{id,name}]
            })
            .addCase(fetchDti.rejected, (state, {error}) => {
                state.dtiStatus = 'failed'
                state.dtiError = error.message
            })

            .addCase(fetchCustomersMiudol.pending, (state) => {
                state.customersMiudolStatus = 'loading'
                state.customersMiudolError = null
            })
            .addCase(fetchCustomersMiudol.fulfilled, (state, {payload}) => {
                state.customersMiudolStatus = 'succeeded'
                state.customersMiudol = payload
            })
            .addCase(fetchCustomersMiudol.rejected, (state, {error}) => {
                state.customersMiudolStatus = 'failed'
                state.customersMiudolError = error.message
            })

            .addCase(fetchCustomersCa.pending, (state) => {
                state.customersCaStatus = 'loading'
                state.customersCaError = null
            })
            .addCase(fetchCustomersCa.fulfilled, (state, {payload}) => {
                state.customersCaStatus = 'succeeded'
                state.customersCa = payload
            })
            .addCase(fetchCustomersCa.rejected, (state, {error}) => {
                state.customersCaStatus = 'failed'
                state.customersCaError = error.message
            })

        builder
            .addCase(addRecord.pending, (state) => {
                state.error = null;
                state.pendingMap['add'] = true;
            })
            .addCase(addRecord.fulfilled, (state, {payload}) => {
                if (!payload || payload.id == null) return;

                // апсерт сущности
                state.entities[payload.id] = {
                    ...(state.entities[payload.id] || {}),
                    ...payload,
                };

                // удалить id из текущего порядка (если уже есть)
                const i = state.ids.indexOf(payload.id);
                if (i !== -1) state.ids.splice(i, 1);

                // вставить в начало
                state.ids.unshift(payload.id);
            })

            .addCase(addRecord.rejected, (state, {error}) => {
                state.pendingMap['add'] = false;
                state.error = error?.message || 'Failed to add';
            })

            // ---- Удаление ----
            .addCase(deleteRecordThunk.pending, (state, {meta}) => {
                state.pendingMap[`del::${meta.arg}`] = true;
            })
            .addCase(deleteRecordThunk.fulfilled, (state, {payload, meta}) => {
                state.pendingMap[`del::${meta.arg}`] = false;
                const id = payload ?? meta.arg;

                // убрать из entities
                delete state.entities[id];

                // убрать из ids
                const i = state.ids.indexOf(id);
                if (i !== -1) state.ids.splice(i, 1);
            })
            .addCase(deleteRecordThunk.rejected, (state, {meta, error}) => {
                state.pendingMap[`del::${meta.arg}`] = false;
                state.error = error?.message || 'Failed to delete';
            })


            .addCase(fetchTreeParents.pending, (state) => {
                state.treeStatus = 'loading';
                state.treeError = null;
            })
            .addCase(fetchTreeParents.fulfilled, (state, { payload }) => {
                state.treeStatus = 'succeeded';
                state.tree = payload; // [{value,label}]
            })
            .addCase(fetchTreeParents.rejected, (state, { error }) => {
                state.treeStatus = 'failed';
                state.treeError = error?.message || 'Failed to load tree';
                state.tree = [];
            })


            .addCase(fetchTreeChildren.pending, (state) => {
                state.treeStatus2 = 'loading';
                state.treeError2 = null;
            })
            .addCase(fetchTreeChildren.fulfilled, (state, { payload }) => {
                state.treeStatus2 = 'succeeded';
                state.tree2 = payload; // [{value,label}]
            })
            .addCase(fetchTreeChildren.rejected, (state, { error }) => {
                state.treeStatus2 = 'failed';
                state.treeError2 = error?.message || 'Failed to load tree';
                state.tree2 = [];
            })


            .addCase(saveParentLink.pending, (state, { meta }) => {
                state.pendingMap[`setParent::${meta.arg.dataId}`] = true;
            })
            .addCase(saveParentLink.fulfilled, (state, { payload }) => {
                const { dataId, parentId, id } = payload;

                const row = state.entities[dataId];
                if (row) {
                    // запомним старого родителя (для возможного «открепления»)
                    const prevParentId =
                        row.parentId ??
                        (Array.isArray(row.parents) && row.parents[0]?.parentId) ??
                        null;

                    // обновляем сам ряд
                    row.parentId = parentId ?? null;
                    row.parents = parentId != null ? [{ id, parentId }] : [];

                    // убираем из детей у старого родителя (не обязательно, но «красиво»)
                    if (prevParentId != null && prevParentId !== parentId) {
                        const prevParent = state.entities[prevParentId];
                        if (prevParent && Array.isArray(prevParent.childrenIds)) {
                            prevParent.childrenIds = prevParent.childrenIds.filter(
                                (cid) => String(cid) !== String(dataId)
                            );
                        }
                        if (prevParent && Array.isArray(prevParent.children)) {
                            prevParent.children = prevParent.children.filter(
                                (c) => String(c?.childId ?? c?.id) !== String(dataId)
                            );
                        }
                    }

                    // добавляем в список детей новому родителю
                    if (parentId != null) {
                        const newParent = state.entities[parentId];
                        if (newParent) {
                            const list = Array.isArray(newParent.childrenIds) ? newParent.childrenIds : [];
                            const asStr = list.map(String);
                            if (!asStr.includes(String(dataId))) list.push(dataId);
                            newParent.childrenIds = list;

                            if (Array.isArray(newParent.children)) {
                                const has = newParent.children.some(c => String(c?.childId ?? c?.id) === String(dataId));
                                if (!has) newParent.children.push({ childId: dataId });
                            }
                        }
                    }
                }

                state.pendingMap[`setParent::${dataId}`] = false;
            })
            .addCase(saveParentLink.rejected, (state, { meta, error }) => {
                state.pendingMap[`setParent::${meta.arg.dataId}`] = false;
                state.error = error?.message || 'Failed to set parent';
            })


            .addCase(saveAddChildLink.pending, (state, { meta }) => {
                state.pendingMap[`linkChild::${meta.arg.dataId}`] = true;
            })
            .addCase(saveAddChildLink.fulfilled, (state, { payload }) => {
                const { dataId, childId, id } = payload;

                // --- обновляем родителя ---
                const parentRow = state.entities[dataId];
                if (parentRow) {
                    // childrenIds: уникальный мердж
                    const list = Array.isArray(parentRow.childrenIds) ? parentRow.childrenIds : [];
                    const asStr = list.map(String);
                    if (!asStr.includes(String(childId))) list.push(childId);
                    parentRow.childrenIds = list;

                    // опционально поддержим parentRow.children [{childId}]
                    if (Array.isArray(parentRow.children)) {
                        const has = parentRow.children.some(c => String(c?.childId ?? c?.id) === String(childId));
                        if (!has) parentRow.children.push({ id, childId });
                    }
                }

                // --- зеркалим у ребёнка (чтоб карточка ребёнка сразу видела parent) ---
                const childRow = state.entities[childId];
                if (childRow) {
                    childRow.parentId = dataId;
                    // поддержим childRow.parents [{parentId}]
                    if (Array.isArray(childRow.parents)) {
                        const has = childRow.parents.some(p => String(p?.parentId) === String(dataId));
                        if (!has) childRow.parents.push({ parentId: dataId });
                    } else {
                        childRow.parents = [{ parentId: dataId }];
                    }
                }

                state.pendingMap[`linkChild::${dataId}`] = false;
            })
            .addCase(saveAddChildLink.rejected, (state, { meta, error }) => {
                state.pendingMap[`linkChild::${meta.arg.dataId}`] = false;
                state.error = error?.message || 'Failed to link child';
            })

            .addCase(deleteTreeThunk.pending, (state, { meta }) => {
                const relationId = meta.arg; // id связи
                state.pendingMap[`treeDel::${relationId}`] = true;
            })

            .addCase(deleteTreeThunk.fulfilled, (state, { payload, meta }) => {
                const relationId = payload ?? meta.arg;
                state.pendingMap[`treeDel::${relationId}`] = false;

                // Пройдёмся по всем строкам и удалим связь с таким relationId
                for (const rowId of state.ids) {
                    const row = state.entities[rowId];
                    if (!row) continue;

                    // 1) Родители: [{ id, parentId }] + "плоское" поле parentId
                    if (Array.isArray(row.parents) && row.parents.length) {
                        const before = row.parents.length;
                        row.parents = row.parents.filter(p => String(p?.id) !== String(relationId));
                        if (row.parents.length !== before) {
                            // Если этот relation был про родителя — обновим parentId (либо первый актуальный, либо null)
                            row.parentId = row.parents[0]?.parentId ?? null;
                        }
                    }

                    // 2) Дети: [{ id, childId }] + "плоское" поле childrenIds
                    if (Array.isArray(row.children) && row.children.length) {
                        const before = row.children.length;
                        row.children = row.children.filter(c => String(c?.id) !== String(relationId));
                        if (row.children.length !== before) {
                            // Пересоберём childrenIds из актуального children
                            row.childrenIds = row.children
                                .map(c => c?.childId)
                                .filter(v => v != null);
                        }
                    }
                }
            })

            .addCase(deleteTreeThunk.rejected, (state, { meta, error }) => {
                const relationId = meta.arg;
                state.pendingMap[`treeDel::${relationId}`] = false;
                state.error = error?.message || 'Failed to delete relation';
            })




    }
})

export const {setFilter} = recordsSlice.actions
export default recordsSlice.reducer

// ---------- Селекторы ----------
const selectSelf = s => s.records

export const selectRows = createSelector(selectSelf, s => s.ids.map(id => s.entities[id]))
export const selectColumns = createSelector(selectSelf, s => s.columns)
export const selectPendingMap = createSelector(selectSelf, s => s.pendingMap)
export const selectCurators = createSelector(selectSelf, s => s.curators)
export const selectDepartment = createSelector(selectSelf, s => s.department)
export const selectHead = createSelector(selectSelf, s => s.head)
export const selectDti = createSelector(selectSelf, s => s.dti)
export const selectCustomersMiudol = createSelector(selectSelf, s => s.customersMiudol)
export const selectCustomersCa = createSelector(selectSelf, s => s.customersCa)

export const selectTree = (s) => s.records.tree;
export const selectTreeStatus = (s) => s.records.treeStatus;
export const selectTree2 = (s) => s.records.tree2;
export const selectTreeStatus2 = (s) => s.records.treeStatus2;



const supportDepartmentIds = [16, 24, 26, 35, 36];
const supportFunctionIds = [680, 78, 104, 307, 316, 304];


export const makeSelectUniqueValues = (field) => createSelector(
    [selectRows],
    (rows) => {
        const s = new Set()
        rows.forEach(r => {
            if ((field === 'sources') && (r[field]?.some(({ value }) => value === 'MIUDOL'))) {
                const source = supportDepartmentIds.includes(r?.departmentNameId) || supportFunctionIds.includes(r?.id)
                    ? 'MIUDOL_SUPPORT'
                    : 'MIUDOL_FROFILE';
					
                s.add([{ value: source }]);
            } else
                s.add(r[field] ?? '—')
        })
        return Array.from(s)
    }
)

// recordsSlice.js

 
function normalizeForFilter(field, row) {
    const cell = row[field];

    if (cell == null) return ['—'];

    if (field === 'sources') {
        const toCode = (x) => (typeof x === 'string' ? x : x?.value);
        const codes = (Array.isArray(cell) ? cell : [cell]).map(toCode).filter(Boolean);
        if (codes.includes('MIUDOL')) {
            const source = supportDepartmentIds.includes(row?.departmentNameId) || supportFunctionIds.includes(row?.id)
                ? 'MIUDOL_SUPPORT'
                : 'MIUDOL_FROFILE';
				
            return [source]
        }
        return codes;
    }

    if (field === 'dtiIds') {
        const toId = (x) => (typeof x === 'object' ? x?.id : x);
        return (Array.isArray(cell) ? cell : [cell])
            .map(toId)
            .filter((id) => id != null);
    }

    return [cell]; // по умолчанию — одиночное значение
}


export const selectFilteredRows = createSelector(
    selectSelf, // твой стейт records
    (s) => {
        const {filters, ids, entities} = s;
        const active = Object.entries(filters).filter(([, set]) => set); // только активные (Set)

        if (active.length === 0) return ids.map((id) => entities[id]);

        return ids
            .map((id) => entities[id])
            .filter((row) => {
                for (const [field, set] of active) {

                    // ==== Спец-кейс: фильтр по "Акцепту" (стадия × customerId) ====
                    if (field === 'acceptStage') {
                        // const keys = rowAcceptKeys(row); // ["STAGE|12"] или ["STAGE|—"]
                        // const ok = keys.some(k => set.has(k));
                        const stage = getLatestStage(row);
                        const ok = set.has(stage);
                        if (!ok) return false;
                        continue; // к следующему активному фильтру
                    }

                    const tokens = normalizeForFilter(field, row); // <- нормализовали ячейку
                    // правило: строка проходит, если ХОТЯ БЫ ОДИН токен попал в Set
                    const ok = tokens.some((t) => set.has(t));
                    if (!ok) return false;
                }
                return true;
            });
    }
);



