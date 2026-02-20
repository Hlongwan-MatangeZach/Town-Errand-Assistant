export function clampIndex(i: number, len: number) {
    'worklet';
    if (len <= 0) return 0;
    if (i < 0) return len - 1;
    if (i >= len) return 0;
    return i;
}

export function shadeHex(input: string, percent: number) {
    // percent: -30 to +30 typically. Supports #RRGGBB only.
    if (typeof input !== 'string') return input;
    const hex = input.trim();
    if (!/^#([0-9a-fA-F]{6})$/.test(hex)) return input;

    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;

    const p = percent / 100;
    const adj = (c: number) => {
        const v = Math.round(c + (p >= 0 ? (255 - c) * p : c * p));
        return Math.max(0, Math.min(255, v));
    };

    const rr = adj(r).toString(16).padStart(2, '0');
    const gg = adj(g).toString(16).padStart(2, '0');
    const bb = adj(b).toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}`;
}
