/**
 * Schedule coordination and time utility functions.
 * Extracted for testability and consistency across the app.
 */

/**
 * Calculates the top position for an element in the schedule based on minutes.
 * @param minutes Minutes from the start of the day (0 to 1439).
 * @param slotHeight Height for a 30-minute slot.
 * @param offset Vertical offset (e.g., to align with horizontal lines).
 * @returns The 'top' pixel value.
 */
export function calculateTopPosition(minutes: number, slotHeight: number, offset: number): number {
    return (minutes / 30) * slotHeight + offset;
}

/**
 * Converts a slot index (0-47) to a time string format like 'HH:mm'.
 * @param slotIndex Index from 0 to 47.
 * @returns Formatted time string.
 */
export function slotIndexToTimeStr(slotIndex: number): string {
    const hour = Math.floor(slotIndex / 2);
    const minutes = (slotIndex % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Checks if a slot index represents a half-hour mark (e.g., :30).
 * @param slotIndex Index from 0 to 47.
 * @returns True if it's :30.
 */
export function isHalfHourSlot(slotIndex: number): boolean {
    return (slotIndex % 2) === 1;
}
