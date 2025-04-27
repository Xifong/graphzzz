/**
 * Selects a random element from an array
 * @param array - Array to select from
 * @returns Random element from the array
 * @throws Error if the array is empty
 */
export function randomFrom<T>(array: T[]): T {
    if (array.length == 0) {
        throw new Error("can't get random value from array of length 0");
    }
    return array[Math.floor(Math.random() * array.length)];
}
