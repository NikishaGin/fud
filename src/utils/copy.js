// utils/copy.js
export async function safeCopyToClipboard(text) {
    // 1) Пытаемся через async Clipboard API
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(String(text ?? ''));
            return true;
        }
    } catch (e) {
        // продолжим фоллбеком
    }

    // 2) Фоллбек через execCommand('copy')
    try {
        const el = document.createElement('textarea');
        el.value = String(text ?? '');
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);

        const selection = document.getSelection();
        const prevRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        el.select();
        el.setSelectionRange(0, el.value.length);

        const ok = document.execCommand('copy');

        // восстановить выделение
        if (prevRange && selection) {
            selection.removeAllRanges();
            selection.addRange(prevRange);
        }

        document.body.removeChild(el);
        return ok;
    } catch {
        return false;
    }
}
