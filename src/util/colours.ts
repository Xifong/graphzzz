const PALETTE = {
    // Main colours
    BLUE: 0x2196F3,
    TEAL: 0x009688,
    GREEN: 0x4CAF50,
    ORANGE: 0xFF9800,
    RED: 0xF44336,
    PURPLE: 0x9C27B0,
    INDIGO: 0x3F51B5,

    // Accent colours for variety
    PINK: 0xE91E63,
    CYAN: 0x00BCD4,
    DEEP_PURPLE: 0x673AB7,
    LIGHT_BLUE: 0x03A9F4,
    DEEP_ORANGE: 0xFF5722,
} as const;

const COLOURS = Object.values(PALETTE);

/**
 * Returns a random colour from our predefined palette
 * @param exclude Optional array of colours to exclude from selection
 * @returns A colour value in hexadecimal format (0xRRGGBB)
 */
export function getRandomEntityColour(exclude: number[] = []): number {
    const availableColours = COLOURS.filter(colour => !exclude.includes(colour));

    // fallback to first colour if all are excluded
    if (availableColours.length === 0) {
        return COLOURS[0];
    }

    const randomIndex = Math.floor(Math.random() * availableColours.length);
    return availableColours[randomIndex];
}

/**
 * Returns a sequence of distinct colours from our palette
 * @param count Number of colours needed
 * @returns Array of colour values in hexadecimal format (0xRRGGBB)
 */
export function getDistinctEntityColours(count: number): number[] {
    const colours = [...COLOURS];
    const result: number[] = [];

    // use all available colours
    for (let i = 0; i < Math.min(count, colours.length); i++) {
        const randomIndex = Math.floor(Math.random() * colours.length);
        result.push(colours[randomIndex]);
        colours.splice(randomIndex, 1);
    }

    // start reusing colours
    while (result.length < count) {
        result.push(COLOURS[result.length % COLOURS.length]);
    }

    return result;
}
