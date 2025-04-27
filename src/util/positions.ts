import { GRAPH_MAX_X, GRAPH_MAX_Y } from "../graph/vars";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../vars";
import { PhaserRegion, PhaserPosition, SimPosition } from "../types";

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

/**
 * Calculates the Euclidean distance between two points
 * @param pointA - First point with x and y coordinates
 * @param pointB - Second point with x and y coordinates
 * @returns Distance between the points
 */
export function distanceBetween(pointA: { x: number, y: number }, pointB: { x: number, y: number }): number {
    return Math.sqrt((pointB.x - pointA.x) ** 2 + (pointB.y - pointA.y) ** 2);
}

/**
 * Calculates the duration for movement between two points based on simulation speed
 * @param pointA - Starting position in Phaser coordinates
 * @param simSpeed - Speed in simulation units
 * @param pointB - Ending position in Phaser coordinates
 * @returns Duration in milliseconds
 */
export function getPhaserDuration(pointA: PhaserPosition, simSpeed: number, pointB: PhaserPosition): number {
    const simPointA = getSimPositionOf(pointA.x, pointA.y);
    const simPointB = getSimPositionOf(pointB.x, pointB.y);

    const simDistance = distanceBetween(simPointA, simPointB);

    // *1.25 so that a speed of 100 translates to 80 simdist/s
    // 80 simdist/s means traversing a graph in roughly 30s
    // assuming traversal takes roughly 2500 sim dist
    return (simDistance * 1.25) / simSpeed;
}

export function getPositionBetween(startPoint: PhaserPosition, distance: number, endPoint: PhaserPosition): PhaserPosition {
    const percentage = distance / distanceBetween(startPoint, endPoint);

    return {
        x: startPoint.x + (endPoint.x - startPoint.x) * percentage,
        y: startPoint.y + (endPoint.y - startPoint.y) * percentage
    };
}

