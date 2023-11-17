export function range(from: number, to: number): Array<number> {
    const length = Math.max(to - from, 0);
    const res = new Array(length);
    for (let i= 0; i<length; i++) {
        res[i] = from + i;
    }
    return res;
}

export function debounceCallback<T extends Function>(ts: number, callback: T) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: any[]) => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        timer = setTimeout(() => {
            callback.apply(null, args);
            timer = null;
        }, ts);
    };
}
