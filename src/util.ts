import { GRAPH_MAX_X, GRAPH_MAX_Y } from "./graph/vars";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./vars";
import { PhaserRegion, PhaserPosition, SimPosition } from "./types";

/**
 * Converts simulation coordinates to Phaser region coordinates
 * @param x - X coordinate in simulation space
 * @param y - Y coordinate in simulation space
 * @param width - Width in simulation space
 * @param height - Height in simulation space
 * @returns Phaser region coordinates
 * @throws Error if input values are invalid
 */
export function getPhaserRegionOf(x: number, y: number, width: number, height: number): PhaserRegion {
    if (width <= 0 || height <= 0) {
        throw new Error("width and height must be positive numbers");
    }
    
    const position = getPhaserPositionOf(x, y);
    return {
        ...position,
        width: width * (CANVAS_WIDTH / GRAPH_MAX_X),
        height: height * (CANVAS_HEIGHT / GRAPH_MAX_Y),
    };
}

/**
 * Converts simulation coordinates to Phaser position coordinates
 * @param x - X coordinate in simulation space
 * @param y - Y coordinate in simulation space
 * @returns Phaser position coordinates
 */
export function getPhaserPositionOf(x: number, y: number): PhaserPosition {
    return {
        x: x * (CANVAS_WIDTH / GRAPH_MAX_X),
        y: y * (CANVAS_HEIGHT / GRAPH_MAX_Y)
    };
}

/**
 * Converts Phaser coordinates to simulation position coordinates
 * @param x - X coordinate in Phaser space
 * @param y - Y coordinate in Phaser space
 * @returns Simulation position coordinates
 */
export function getSimPositionOf(x: number, y: number): SimPosition {
    return {
        x: x * (GRAPH_MAX_X / CANVAS_WIDTH),
        y: y * (GRAPH_MAX_Y / CANVAS_HEIGHT)
    };
}


