import React from "react";
import { debounceCallback, range } from "./util";

export interface IVirtualOptionsState {
    index: number;
    range: Array<number>;
    topPaddingHeight: number;
    bottomPaddingHeight: number;
    renderItemsLength: number;
}

export interface IVirtualOptions<T> {
    parentRef: React.RefObject<T | null>;
    size: number;
    onChangeRange?(range: Array<number>, from: number, to: number): void;
    debounce?: number;
    overscan?: number;
    rowHeight: number;
}

export function useVirtual<T extends HTMLElement>(
    options: IVirtualOptions<T>,
): IVirtualOptionsState {
    const {
        parentRef,
        overscan = 4,
        size,
        debounce,
        rowHeight,
        onChangeRange,
    } = options;
    const [state, setState] = React.useState<IVirtualOptionsState>({
        bottomPaddingHeight: 0,
        topPaddingHeight: 0,
        index: 0,
        range: [],
        renderItemsLength: size,
    });

    React.useEffect(() => {
        const toleranceHeight = rowHeight * overscan;
        const fullHeight = rowHeight * size;
        let scrollAreaHeight = 0;
        let renderItemsLength = 0;
        let currentFrom = 0,
            currentTo = 0;

        // debounce works
        const finalChangeHandler = onChangeRange || (() => void 0);
        const changeHandler = debounce
            ? debounceCallback(debounce, finalChangeHandler)
            : finalChangeHandler;

        const updateFn = (scrollTop: number = parentRef.current!.scrollTop) => {
            let topPx = Math.max(scrollTop - toleranceHeight, 0);
            const index = Math.floor(topPx / rowHeight);
            const topPaddingHeight = Math.max(index * rowHeight, 0);
            const bottomPaddingHeight = Math.max(
                fullHeight - topPaddingHeight - renderItemsLength * rowHeight,
                0,
            );

            const indexFrom = Math.max(index - overscan, 0);
            const indexTo = Math.min(index + renderItemsLength + overscan, size);
            const finalRange = range(indexFrom, indexTo);

            setState({
                index: indexFrom,
                topPaddingHeight,
                bottomPaddingHeight,
                renderItemsLength,
                range: finalRange,
            });

            if (currentFrom !== indexFrom || currentTo !== indexTo) {
                changeHandler(finalRange, indexFrom, indexTo);
                currentFrom = indexFrom;
                currentTo = indexTo;
            }

            return {
                index,
                topPaddingHeight,
                bottomPaddingHeight,
            };
        };

        const handler = (e: Event) => {
            updateFn(parentRef.current!.scrollTop);
        };

        const resizeObserver = new ResizeObserver((entries) => {
            scrollAreaHeight = entries[0].target.clientHeight;
        });

        if (parentRef.current) {
            scrollAreaHeight = parentRef.current.clientHeight;
            renderItemsLength =
                Math.ceil(scrollAreaHeight / rowHeight) + overscan * 2;

            resizeObserver.observe(parentRef.current);
            parentRef.current.addEventListener("scroll", handler);
            updateFn();
        }

        return () => {
            if (parentRef.current) {
                parentRef.current.removeEventListener("scroll", handler);
                resizeObserver.unobserve(parentRef.current);
            }
        };
    }, [parentRef.current, rowHeight, size, onChangeRange]);

    return state;
}
