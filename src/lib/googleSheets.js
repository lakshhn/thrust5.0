/**
 * Live Google Sheets Integration for Thrust 5.0
 * Active Spreadsheet ID: 1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw
 */

export const SPREADSHEET_ID = "1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw"

// Published Google Apps Script Web App URL for 2-Way Sync
export const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbx4BqFWe5Y0pA7uxAi4J3IZ7dQtKoxJzMNb-NataUoPIfbpzQ8XtOYuunh5F4MejerHXQ/exec"

export const ENDPOINTS = [
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/pub?output=csv`
]

/**
 * Robust CSV parser that handles quotes and line breaks
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return []
  
  const lines = csvText.split(/\r\n|\n/)
  const result = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const row = []
    let insideQuote = false
    let entry = ''
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c]
      if (char === '"' && line[c + 1] === '"') {
        entry += '"'
        c++
      } else if (char === '"') {
        insideQuote = !insideQuote
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim())
        entry = ''
      } else {
        entry += char
      }
    }
    row.push(entry.trim())
    result.push(row)
  }
  return result
}

function cleanCell(val) {
  if (val === undefined || val === null) return ''
  let str = String(val).trim()
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.substring(1, str.length - 1).trim()
  }
  return str
}

/**
 * Fetch live data from Google Sheet with automatic fallback endpoints
 */
export async function fetchGoogleSheetData() {
  let text = null

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'text/csv' }
      })
      if (res.ok) {
        const raw = await res.text()
        if (raw && raw.length > 10 && !raw.includes('<!DOCTYPE html>')) {
          text = raw
          break
        }
      }
    } catch (e) {
      // Try next fallback endpoint
    }
  }

  if (!text) return []

  const rows = parseCSV(text)
  if (!rows || rows.length < 2) return []

  // Analyze Header Row (Row 0)
  const headers = rows[0].map(h => cleanCell(h).toLowerCase())
  
  let colTeamName = headers.findIndex(h => h.includes('team name') || h === 'team' || h === 'name')
  if (colTeamName === -1) colTeamName = 1

  let colTeamCode = headers.findIndex(h => h.includes('code') || h.includes('team code') || h.includes('id'))
  let colR1       = headers.findIndex(h => h.includes('r1') || h.includes('round 1') || h.includes('flight 1'))
  let colR2       = headers.findIndex(h => h.includes('r2') || h.includes('round 2') || h.includes('flight 2'))
  let colR3       = headers.findIndex(h => h.includes('r3') || h.includes('round 3') || h.includes('flight 3'))
  let colDesign   = headers.findIndex(h => h.includes('design') || h.includes('des'))
  let colDQ       = headers.findIndex(h => h.includes('dq') || h.includes('disqualified') || h.includes('status'))

  const parsedTeams = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length <= colTeamName) continue

    const teamName = cleanCell(row[colTeamName])
    if (!teamName || teamName.toLowerCase() === 'team name') continue

    const teamCode = colTeamCode !== -1 && cleanCell(row[colTeamCode])
      ? cleanCell(row[colTeamCode]).toUpperCase()
      : `T-${String(r).padStart(2, '0')}`

    const r1Val = colR1 !== -1 ? parseFloat(cleanCell(row[colR1])) || 0 : 0
    const r2Val = colR2 !== -1 ? parseFloat(cleanCell(row[colR2])) || 0 : 0
    const r3Val = colR3 !== -1 ? parseFloat(cleanCell(row[colR3])) || 0 : 0
    const desVal = colDesign !== -1 ? parseFloat(cleanCell(row[colDesign])) || 0 : 0
    const isDQ = colDQ !== -1 ? (cleanCell(row[colDQ]).toLowerCase().includes('yes') || cleanCell(row[colDQ]).toLowerCase().includes('dq') || cleanCell(row[colDQ]).toLowerCase().includes('disqualified')) : false

    parsedTeams.push({
      id: `sheet-team-${r}-${teamName.replace(/[^a-zA-Z0-9]/g, '')}`,
      name: teamName,
      code: teamCode,
      round_1: r1Val,
      round_2: r2Val,
      round_3: r3Val,
      design: desVal,
      disqualified: isDQ,
      source: 'googlesheet'
    })
  }

  return parsedTeams
}

/**
 * Post admin updates back to Google Sheet Web App
 */
export async function syncAdminUpdateToGoogleSheet(action, payload) {
  if (!APPS_SCRIPT_WEBAPP_URL || APPS_SCRIPT_WEBAPP_URL.includes('placeholder')) {
    console.log('[GoogleSheetSync] Local admin override active (Apps Script WebApp URL not set).')
    return false
  }

  try {
    await fetch(APPS_SCRIPT_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    })
    return true
  } catch (err) {
    console.warn('[GoogleSheetSync Error]:', err)
    return false
  }
}
