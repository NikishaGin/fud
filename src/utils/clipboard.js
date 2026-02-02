// src/utils/clipboard.ts
export async function safeCopyToClipboard() {
    // 1) Нативный API (работает только в secure context + не вырублен политиками)
    try {
        if (window.isSecureContext && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {
        // игнор, пойдём по fallback
    }

    // 2) Надёжный fallback через скрытую textarea + execCommand('copy')
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);

        // В некоторых политиках нужен «жест пользователя» — в onMouseDown это будет работать стабильнее
        ta.select();
        ta.setSelectionRange(0, ta.value.length);

        const ok = document.execCommand('copy'); // true/false
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}
