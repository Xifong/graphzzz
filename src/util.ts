import { GRAPH_MAX_X, GRAPH_MAX_Y } from "./graph/vars";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./vars";

export function translateRegion(x: number, y: number, width: number, height: number): PhaserRegion {
    return {
        ...translatePos(x, y),
        width: width * (CANVAS_WIDTH / GRAPH_MAX_X),
        height: height * (CANVAS_HEIGHT / GRAPH_MAX_Y),
    }
}

export function translatePos(x: number, y: number): PhaserPosition {
    return {
        x: x * (CANVAS_WIDTH / GRAPH_MAX_X),
        y: y * (CANVAS_HEIGHT / GRAPH_MAX_Y)
    }
}

