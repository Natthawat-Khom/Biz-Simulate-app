/**
 * Generates a random 6-digit numeric Room Code.
 * @returns {string} 6-digit room code string
 */
export function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates last 4 digits PIN from stdId.
 * @param {string|number} stdId 
 * @returns {string} 4-digit PIN string
 */
export function generateStudentPin(stdId) {
  if (!stdId) return "0000";
  const str = String(stdId).trim();
  const digits = str.replace(/\D/g, ""); // Extract numbers
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  return digits.padStart(4, "0");
}
