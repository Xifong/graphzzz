/**
 * Represents a position in Phaser's coordinate system
 */
export type PhaserPosition = {
    x: number;
    y: number;
};

/**
 * Represents a region in Phaser's coordinate system
 */
export type PhaserRegion = PhaserPosition & {
    width: number;
    height: number;
};

/**
 * Represents a position in the simulation's coordinate system
 */
export type SimPosition = {
    x: number;
    y: number;
};
