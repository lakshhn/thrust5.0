/**
 * ============================================================
 * Thrust 5.0 — Google Sheets Live Integration
 * ============================================================
 * READ  path: Apps Script doGet?action=GET → JSON (fast, authoritative)
 *             Falls back to public CSV export if Apps Script unavailable.
 * WRITE path: Apps Script doGet?action=ADD_TEAM|UPDATE_SCORE|... (GET params)
 *             Using GET (not POST) avoids ALL CORS pre-flight issues.
 * ============================================================
 */

export const SPREADSHEET_ID = "1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw"

/**
 * Paste your Apps Script Web App URL here after deploying.
 * Deploy settings: Execute as → Me | Who has access → Anyone
 */
export const APPS_SCRIPT_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbx4BqFWe5Y0pA7uxAi4J3IZ7dQtKoxJzMNb-NataUoPIfbpzQ8XtOYuunh5F4MejerHXQ/exec"

// CSV fallback endpoints (read-only, no auth needed)
const CSV_ENDPOINTS = [
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/pub?output=csv`,
]

// ─── In-memory cache (prevents redundant fetches during same poll cycle) ──
const CACHE_TTL_MS = 8_000
let _cache = { data: null, ts: 0 }

// ─────────────────────────────────────────────────────────────────────────
// PRIMARY READ: Fetch from Apps Script → JSON
// ─────────────────────────────────────────────────────────────────────────
async function fetchViaAppsScript() {
  if (!APPS_SCRIPT_WEBAPP_URL || APPS_SCRIPT_WEBAPP_URL.includes("placeholder")) {
    throw new Error("Apps Script URL not configured")
  }
  // Append cache-busting ts so Google doesn't serve a stale cached response
  const url = `${APPS_SCRIPT_WEBAPP_URL}?action=GET&ts=${Date.now()}`
  const res = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.status !== "ok" || !Array.isArray(json.teams)) {
    throw new Error(`Apps Script error: ${json.error || "bad response"}`)
  }
  return json.teams.map(normalizeTeamFromJSON)
}

// ─────────────────────────────────────────────────────────────────────────
// FALLBACK READ: Public CSV export
// ─────────────────────────────────────────────────────────────────────────
async function fetchViaCSV() {
  for (const base of CSV_ENDPOINTS) {
    try {
      const url = base.includes("?") ? `${base}&t=${Date.now()}` : `${base}?t=${Date.now()}`
      const res = await fetch(url, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined,
      })
      if (!res.ok) continue
      const raw = await res.text()
      if (raw && raw.length > 20 && !raw.includes("<!DOCTYPE html>")) {
        return parseCSVtoTeams(raw)
      }
    } catch (_) {
      // next endpoint
    }
  }
  throw new Error("All CSV endpoints failed")
}

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC: fetchGoogleSheetData
// ─────────────────────────────────────────────────────────────────────────
/**
 * Returns array of normalised team objects. Caches for 8s to prevent
 * multiple in-flight requests during the same poll cycle.
 * @param {boolean} forceRefresh - Bypass cache
 */
export async function fetchGoogleSheetData(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && _cache.data && (now - _cache.ts) < CACHE_TTL_MS) {
    return _cache.data
  }

  let teams = null
  try {
    teams = await fetchViaAppsScript()
  } catch (appsScriptErr) {
    console.warn("[Sheets] Apps Script unavailable, falling back to CSV:", appsScriptErr.message)
    try {
      teams = await fetchViaCSV()
    } catch (_) {
      // Return stale cache rather than empty — better UX during network blip
      if (_cache.data) {
        console.warn("[Sheets] All sources failed — serving stale cache")
        return _cache.data
      }
      return []
    }
  }

  _cache = { data: teams, ts: Date.now() }
  return teams
}

/** Invalidate cache so next read always fetches fresh data */
export function invalidateCache() {
  _cache = { data: null, ts: 0 }
}

// ─────────────────────────────────────────────────────────────────────────
// WRITE: Send admin mutations to Apps Script via GET params
// Using GET (not POST) avoids CORS pre-flight entirely — works reliably.
// ─────────────────────────────────────────────────────────────────────────
/**
 * @param {string} action  - ADD_TEAM | UPDATE_SCORE | UPDATE_NAME | DELETE_TEAM
 * @param {object} payload - Fields for the action
 * @returns {Promise<boolean>} true if sheet confirmed the write
 */
export async function syncAdminUpdateToGoogleSheet(action, payload) {
  if (!APPS_SCRIPT_WEBAPP_URL || APPS_SCRIPT_WEBAPP_URL.includes("placeholder")) {
    console.warn("[SheetSync] Apps Script URL not configured — skipping")
    return false
  }

  // Encode everything as URL params — plain GET, no CORS issue
  const params = new URLSearchParams({ action })
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v))
  })
  const url = `${APPS_SCRIPT_WEBAPP_URL}?${params.toString()}`

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
    })
    if (!res.ok) {
      console.warn("[SheetSync] HTTP error:", res.status)
      return false
    }
    const json = await res.json()
    const ok = json.status === "ok" || json.status === "duplicate"
    if (!ok) console.warn("[SheetSync] Apps Script returned:", json)

    // Always invalidate cache so next leaderboard poll gets fresh data
    invalidateCache()
    return ok
  } catch (err) {
    console.warn("[SheetSync] Network error:", err.message)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Normalize team from Apps Script JSON response
// ─────────────────────────────────────────────────────────────────────────
function normalizeTeamFromJSON(t, idx) {
  // Apps Script already sends isDQ as a boolean
  const isDQ = t.disqualified === true || t.disqualified === "true" || t.disqualified === "YES"
  const r1   = Number(t.round_1) || 0
  const r2   = Number(t.round_2) || 0
  const r3   = Number(t.round_3) || 0
  const des  = Number(t.design)  || 0
  const total = isDQ ? 0 : r1 + r2 + r3 + des

  const rawCode = (t.code || "").toString().trim()
  const code = rawCode || `T-${String(idx + 1).padStart(2, "0")}`

  return {
    // Stable ID: prefer code-based so re-fetches don't create duplicate entries
    id:           `gs-${code.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
    name:         (t.name || "").toString().trim(),
    code:         code.toUpperCase(),
    round_1:      r1,
    round_2:      r2,
    round_3:      r3,
    design:       des,
    disqualified: isDQ,
    total,
    source:       "googlesheet",
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CSV parser helpers
// ─────────────────────────────────────────────────────────────────────────
function parseCSVRow(line) {
  const row = []
  let insideQuote = false
  let entry = ""
  for (let c = 0; c < line.length; c++) {
    const char = line[c]
    if (char === '"' && line[c + 1] === '"') { entry += '"'; c++ }
    else if (char === '"') { insideQuote = !insideQuote }
    else if (char === "," && !insideQuote) { row.push(entry.trim()); entry = "" }
    else { entry += char }
  }
  row.push(entry.trim())
  return row
}

function cleanCell(val) {
  if (val === undefined || val === null) return ""
  let s = String(val).trim()
  // Strip surrounding quotes that Google Sheets CSV sometimes adds
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).trim()
  return s
}

/**
 * Find a column index by trying exact match first, then substring.
 * Prevents "code" from accidentally matching "team code" before "code" does.
 */
function findCol(headers, candidates) {
  // Pass 1: exact match
  for (const c of candidates) {
    const cl = c.toLowerCase()
    const idx = headers.findIndex(h => h === cl)
    if (idx !== -1) return idx
  }
  // Pass 2: substring match
  for (const c of candidates) {
    const cl = c.toLowerCase()
    const idx = headers.findIndex(h => h.includes(cl))
    if (idx !== -1) return idx
  }
  return null
}

function parseCSVtoTeams(csvText) {
  const lines = csvText.split(/\r\n|\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const rawHeaders = parseCSVRow(lines[0]).map(h => cleanCell(h).toLowerCase())

  // Detect columns using the fixed findCol (exact-first, then substring)
  const colCode   = findCol(rawHeaders, ["team code", "code", "team id", "id"])
  const colName   = findCol(rawHeaders, ["team name", "name"])
  const colR1     = findCol(rawHeaders, ["round 1", "round1", "r1", "flight 1"])
  const colR2     = findCol(rawHeaders, ["round 2", "round2", "r2", "flight 2"])
  const colR3     = findCol(rawHeaders, ["round 3", "round3", "r3", "flight 3"])
  const colDesign = findCol(rawHeaders, ["design marks", "design", "des"])
  const colDQ     = findCol(rawHeaders, ["disqualified", "dq"])
  const colTotal  = findCol(rawHeaders, ["total marks", "total score", "total"])

  // If no name column found, assume column index 1 (second column) as a safe fallback
  const nameIdx = colName ?? 1

  const teams = []
  for (let i = 1; i < lines.length; i++) {
    const row  = parseCSVRow(lines[i])
    const name = cleanCell(row[nameIdx])
    if (!name || name.toLowerCase() === "team name") continue
    // Skip header-like rows
    if (name.toLowerCase() === "name") continue

    const r1  = colR1     !== null ? (parseFloat(cleanCell(row[colR1]))     || 0) : 0
    const r2  = colR2     !== null ? (parseFloat(cleanCell(row[colR2]))     || 0) : 0
    const r3  = colR3     !== null ? (parseFloat(cleanCell(row[colR3]))     || 0) : 0
    const des = colDesign !== null ? (parseFloat(cleanCell(row[colDesign])) || 0) : 0

    const dqRaw = colDQ !== null ? cleanCell(row[colDQ]).toUpperCase() : ""
    const isDQ  = dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED"

    const total = isDQ ? 0 : r1 + r2 + r3 + des

    const rawCode = colCode !== null ? cleanCell(row[colCode]) : ""
    const code = rawCode ? rawCode.toUpperCase() : `T-${String(i).padStart(2, "0")}`

    teams.push({
      id:           `gs-${code.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
      name,
      code,
      round_1:      r1,
      round_2:      r2,
      round_3:      r3,
      design:       des,
      disqualified: isDQ,
      total,
      source:       "googlesheet",
    })
  }
  return teams
}
