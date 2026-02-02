// Общие дефолты для всех колонок
export const DEFAULT_COL_PROPS = {
    sortable: false,
    editable: true,
    resizable: true,
    flex: 1,        // адаптивная ширина по умолчанию
    minWidth: 180,  // минимальная ширина по умолчанию
};

// Индивидуальные настройки по полям
// Если хочешь ЖЁСТКУЮ фиксированную ширину колонки — укажи `width` и добавь `flex: undefined`
export const COL_META = {
    // Исполнитель
    sources: {minWidth: 250},
    curatorId:     { minWidth: 305 },
    departmentNameId:  { minWidth: 190 },
    departmentHeadId:  { minWidth: 300 },
    // Идентификация
    functionBlock:   { minWidth: 200, flex: 2 },
    function:        { minWidth: 260, flex: 2 },
    functionDetails: { minWidth: 320, flex: 2 },  // длинный текст — пусть «тянется» сильнее
    // Значимость
    dtiIds:             { minWidth: 275 },
    customerId:        { minWidth: 270 },
    howCustomerUses:   { minWidth: 200 },
    whyCustomerUses:   { minWidth: 220 },
    // Атрибуты
    complexity:      { minWidth: 180, },
    reason:          { minWidth: 180 },
    execution:       { minWidth: 295 }, // фикс ширина
    artifact:        { minWidth: 375, flex: 2 },
	estimationII:    { minWidth: 280, flex: 2 },
    effectiveness: { minWidth: 270 },
    action: { minWidth: 185 },
    comment: { minWidth: 190 },
};

// Утилита: применить дефолты + метаданные поля.
// Если задан width и НЕ задан flex — обнулим flex, чтобы width реально работал.
export function applyColMeta(field) {
    const meta = COL_META[field] ?? {};
    const base = { ...DEFAULT_COL_PROPS, ...meta };
    if ('width' in meta && !('flex' in meta)) {
        base.flex = undefined;
    }
    return base;
}
