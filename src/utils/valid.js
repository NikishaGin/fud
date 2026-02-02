// утилиты валидации/санитизации текста
export const collapseSpaces = (s) => s.replace(/\s+/g, ' ').trim();
export const isOnlyDashesOrUnderscores = (s) => /^[-_]+$/.test(s);

export const sanitizeTextOrNull = (raw) => {
    if (raw == null) return null;
    const v = collapseSpaces(String(raw));
    if (v.length === 0) return null;
    if (isOnlyDashesOrUnderscores(v)) return null;
    return v;
};
