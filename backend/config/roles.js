/**
 * Central roles configuration — ordered lowest → highest privilege.
 * Index position IS the hierarchy rank, so comparisons are O(1).
 * To add a new role: insert it at the correct position. No other file changes needed.
 */
const ROLES = [
  "student",            // 0
  "classRepresentative",// 1
  "labAssistant",       // 2
  "technician",         // 3
  "teacher",            // 4
  "supervisor",         // 5
  "warden",             // 6
  "chiefWarden",        // 7
  "director",           // 8
  "admin",              // 9  – highest
];

/**
 * Map of role → numeric rank for O(1) hierarchy comparison.
 * Usage: ROLE_RANK["supervisor"] > ROLE_RANK["student"]  // true
 */
const ROLE_RANK = Object.fromEntries(ROLES.map((r, i) => [r, i]));

module.exports = { ROLES, ROLE_RANK };
