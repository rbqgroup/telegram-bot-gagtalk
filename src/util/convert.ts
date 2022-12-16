export function toInt(str: string) {
    const i = parseInt(str);
    if (Number.isNaN(i)) throw new Error(`Cannot convert "${str}" to int.`);
    return i;
}

export function shortTimeSpanToMilliseconds(str: string) {
    if (str == null || str === '') {
        return null;
    }
    if (str === '0') {
        return 0;
    }
    if (!/^(\d+[smhd])+$/.test(str)) {
        throw 'Incorrect time format.';
    }
    let time = 0;
    const matches = str.matchAll(/(\d+)([smhd])/g);
    for (const match of matches) {
        const num = parseInt(match[1]);
        const scale = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000,
        }[match[2] as 's' | 'm' | 'h' | 'd'];
        time += num * scale;
    }
    return time;
}
