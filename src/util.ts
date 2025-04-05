import { GRAPH_MAX_X, GRAPH_MAX_Y } from "./graph/vars";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./vars";

export function getPhaserRegionOf(x: number, y: number, width: number, height: number): PhaserRegion {
    return {
        ...getPhaserPositionOf(x, y),
        width: width * (CANVAS_WIDTH / GRAPH_MAX_X),
        height: height * (CANVAS_HEIGHT / GRAPH_MAX_Y),
    }
}

export function getPhaserPositionOf(x: number, y: number): PhaserPosition {
    return {
        x: x * (CANVAS_WIDTH / GRAPH_MAX_X),
        y: y * (CANVAS_HEIGHT / GRAPH_MAX_Y)
    }
}

export function getSimPositionOf(x: number, y: number): SimPosition {
    return {
        x: x * (GRAPH_MAX_X / CANVAS_WIDTH),
        y: y * (GRAPH_MAX_Y / CANVAS_HEIGHT)
    }
}


