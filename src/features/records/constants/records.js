// src/features/records/constants/records.js
export const ExecutionFrequencyMap = {
    DAILY: 'Ежедневно',
    WEEKLY: 'Еженедельно',
    MONTHLY: 'Ежемесячно',
    QUARTERLY: 'Ежеквартально',
    ANNUALLY: 'Ежегодно',
    TEN_DAYS: '1 раз в 10 дней',
    TWO_WEEKS: '1 раз в 2 недели',
    TWO_MONTHS: '1 раз в 2 месяца',
    HALF_YEAR: '1 раз в полугодие',
    AS_PER_FNS_ORDER: 'В соответствии со сроками, указанными в поручении ФНС России',
};

export const COMPLEXITY_LABEL = { SIMPLE: 'Низкая', MIDDLE: 'Средняя', HARD: 'Высокая' };
export const OWNER_LABEL = {
    MIUDOL_SUPPORT: 'МИУДОЛ (обеспечивающие)',
    MIUDOL_FROFILE: 'МИУДОЛ (профильные)',
    MIUDOL: 'МИУДОЛ',
    URZ: 'УРЗ',
    UOPB: 'УОПБ'
};
export const EFFECTIVENESS_LABEL = {REMOVE: 'Убрать' , KEEP: 'Оставить', OPTIMIZE: 'Оптимизировать'}

// то, что раньше было в компоненте
export const NON_EDITABLE_FIELDS = new Set(['__rowNum__']);
