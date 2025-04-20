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

export function distanceBetween(pointA: { x: number, y: number }, pointB: { x: number, y: number }): number {
    return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
}

export function getPhaserDuration(pointA: PhaserPosition, simSpeed: number, pointB: PhaserPosition): number {
    const simPointA = getSimPositionOf(pointA.x, pointA.y);
    const simPointB = getSimPositionOf(pointB.x, pointB.y);

    const simDistance = distanceBetween(simPointA, simPointB);

    // * 4 so that a speed of 100 translates to 25 simdist/s
    // 25 simdist/s means traversing a graph in roughly 1 minute
    return (simDistance * 4) / simSpeed;
}

export function randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}
