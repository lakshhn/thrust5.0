/**
 * ============================================================
 * Thrust 5.0 — Google Sheets Live Integration
 * ============================================================
 * Dual-Engine Fetch:
 *   - Engine A: Apps Script Web App (JSON)
 *   - Engine B: Google Sheets Public CSV Export (Instant, Reliable)
 *
 * Scoring: Total = Round 1 + Round 2 + Round 3 + Design - Penalty.
 * ============================================================
 */

export const SPREADSHEET_ID = "1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw"

export const APPS_SCRIPT_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbx4BqFWe5Y0pA7uxAi4J3IZ7dQtKoxJzMNb-NataUoPIfbpzQ8XtOYuunh5F4MejerHXQ/exec"

// Public CSV export endpoints (direct to Google Sheets, zero Apps Script dependency)
const CSV_ENDPOINTS = [
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/pub?output=csv`,
]

// In-memory cache for fast UI updates (TTL: 8 seconds)
const CACHE_TTL_MS = 8_000
let _cache = { data: null, ts: 0 }

// ─────────────────────────────────────────────────────────────────────────
// Engine A: Apps Script JSON
// ─────────────────────────────────────────────────────────────────────────
async function fetchViaAppsScript() {
  if (!APPS_SCRIPT_WEBAPP_URL || APPS_SCRIPT_WEBAPP_URL.includes("placeholder")) {
    throw new Error("Apps Script URL not set")
  }
  const url = `${APPS_SCRIPT_WEBAPP_URL}?action=GET&ts=${Date.now()}`
  const res = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.status !== "ok" || !Array.isArray(json.teams)) {
    throw new Error("Invalid Apps Script format")
  }
  return json.teams.map(normalizeTeamFromJSON)
}

// ─────────────────────────────────────────────────────────────────────────
// Engine B: Direct Google Sheets CSV (Real-Time Fallback)
// ─────────────────────────────────────────────────────────────────────────
async function fetchViaCSV() {
  for (const base of CSV_ENDPOINTS) {
    try {
      const url = base.includes("?") ? `${base}&t=${Date.now()}` : `${base}?t=${Date.now()}`
      const res = await fetch(url, {
        headers: { Accept: "text/csv" },
        signal: AbortSignal.timeout ? AbortSignal.timeout(7000) : undefined,
      })
      if (!res.ok) continue
      const raw = await res.text()
      if (raw && raw.length > 20 && !raw.includes("<!DOCTYPE html>")) {
        const teams = parseCSVtoTeams(raw)
        if (teams && teams.length > 0) return teams
      }
    } catch (_) {}
  }
  throw new Error("All CSV endpoints failed")
}

// ─────────────────────────────────────────────────────────────────────────
// Public Fetcher: Guaranteed Non-Empty Results
// ─────────────────────────────────────────────────────────────────────────
export async function fetchGoogleSheetData(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && _cache.data && _cache.data.length > 0 && (now - _cache.ts) < CACHE_TTL_MS) {
    return _cache.data
  }

  let teams = []

  // 1. Try Apps Script
  try {
    const asTeams = await fetchViaAppsScript()
    if (asTeams && asTeams.length > 0) {
      teams = asTeams
    }
  } catch (_) {}

  // 2. If Apps Script returned 0 teams or failed, fallback to CSV immediately
  if (!teams || teams.length === 0) {
    try {
      const csvTeams = await fetchViaCSV()
      if (csvTeams && csvTeams.length > 0) {
        teams = csvTeams
      }
    } catch (_) {}
  }

  // 3. Fallback to stale cache if network hiccup
  if ((!teams || teams.length === 0) && _cache.data && _cache.data.length > 0) {
    return _cache.data
  }

  if (teams && teams.length > 0) {
    _cache = { data: teams, ts: Date.now() }
  }

  return teams || []
}

export function invalidateCache() {
  _cache = { data: null, ts: 0 }
}

// ─────────────────────────────────────────────────────────────────────────
// Admin Mutations -> Apps Script via GET
// ─────────────────────────────────────────────────────────────────────────
export async function syncAdminUpdateToGoogleSheet(action, payload) {
  if (!APPS_SCRIPT_WEBAPP_URL || APPS_SCRIPT_WEBAPP_URL.includes("placeholder")) {
    console.warn("[SheetSync] Apps Script URL not configured")
    return false
  }

  const params = new URLSearchParams({ action })
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v))
  })
  const url = `${APPS_SCRIPT_WEBAPP_URL}?${params.toString()}`

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined,
    })
    if (!res.ok) return false
    const json = await res.json()
    const ok = json.status === "ok" || json.status === "duplicate"

    invalidateCache()
    return ok
  } catch (err) {
    console.warn("[SheetSync] Network write error:", err.message)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Normalization Helpers
// ─────────────────────────────────────────────────────────────────────────
function normalizeTeamFromJSON(t, idx) {
  const dqStr = (t.disqualified || "").toString().toUpperCase()
  const isDQ = dqStr === "YES" || dqStr === "TRUE" || dqStr === "DQ" || dqStr === "DISQUALIFIED" || dqStr.indexOf("YES") !== -1
  const r1      = Number(t.round_1) || 0
  const r2      = Number(t.round_2) || 0
  const r3      = Number(t.round_3) || 0
  const des     = Number(t.design)  || 0
  const penalty = Number(t.penalty) || 0

  const calculatedTotal = Math.max(0, r1 + r2 + r3 + des - penalty)
  const rawTotal = Number(t.total)
  const total = isDQ ? 0 : (!isNaN(rawTotal) && rawTotal > 0 && calculatedTotal === 0 ? rawTotal : calculatedTotal)

  const rawCode = (t.code || "").toString().trim()
  const code = rawCode || `T-${String(idx + 1).padStart(2, "0")}`

  return {
    id:           `gs-${code.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
    name:         (t.name || "").toString().trim(),
    code:         code.toUpperCase(),
    round_1:      r1,
    round_2:      r2,
    round_3:      r3,
    design:       des,
    penalty:      penalty,
    disqualified: isDQ,
    total,
    source:       "googlesheet",
  }
}

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
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).trim()
  return s
}

function findCol(headers, candidates) {
  // 1. Exact match
  for (const c of candidates) {
    const cl = c.toLowerCase()
    const idx = headers.findIndex(h => h === cl)
    if (idx !== -1) return idx
  }
  // 2. Substring match
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

  const colCode    = findCol(rawHeaders, ["team code", "code", "team id", "id"])
  const colName    = findCol(rawHeaders, ["team name", "name"])
  const colR1      = findCol(rawHeaders, ["r1", "round 1", "round1", "flight 1"])
  const colR2      = findCol(rawHeaders, ["r2", "round 2", "round2", "flight 2"])
  const colR3      = findCol(rawHeaders, ["r3", "round 3", "round3", "flight 3"])
  const colDesign  = findCol(rawHeaders, ["design", "design marks", "des"])
  const colPenalty = findCol(rawHeaders, ["penalty", "pen", "deduction", "deductions"])
  const colDQ      = findCol(rawHeaders, ["disqualified", "dq"])
  const colTotal   = findCol(rawHeaders, ["total", "total marks", "total score"])

  const nameIdx = colName ?? 1

  const teams = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i])
    const name = cleanCell(row[nameIdx])
    if (!name || name.toLowerCase() === "team name") continue

    const r1      = colR1      !== null ? (parseFloat(cleanCell(row[colR1]))      || 0) : 0
    const r2      = colR2      !== null ? (parseFloat(cleanCell(row[colR2]))      || 0) : 0
    const r3      = colR3      !== null ? (parseFloat(cleanCell(row[colR3]))      || 0) : 0
    const des     = colDesign  !== null ? (parseFloat(cleanCell(row[colDesign]))  || 0) : 0
    const penalty = colPenalty !== null ? (parseFloat(cleanCell(row[colPenalty])) || 0) : 0

    const dqRaw = colDQ !== null ? cleanCell(row[colDQ]).toUpperCase() : ""
    const isDQ  = dqRaw === "YES" || dqRaw === "TRUE" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED" || dqRaw.indexOf("YES") !== -1

    const calculatedTotal = Math.max(0, r1 + r2 + r3 + des - penalty)
    const rawTotal = colTotal !== null ? parseFloat(cleanCell(row[colTotal])) : NaN
    const total = isDQ ? 0 : (!isNaN(rawTotal) && rawTotal > 0 && calculatedTotal === 0 ? rawTotal : calculatedTotal)

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
      penalty:      penalty,
      disqualified: isDQ,
      total,
      source:       "googlesheet",
    })
  }
  return teams
}
