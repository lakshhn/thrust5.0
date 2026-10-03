/**
 * ============================================================
 * THRUST 5.0 LEADERBOARD — Google Apps Script Backend
 * ============================================================
 * Spreadsheet ID: 1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw
 *
 * SETUP (one-time):
 *   1. Open leaderboard Google Sheet → Extensions → Apps Script
 *   2. Paste this ENTIRE file, save (Ctrl+S)
 *   3. Run "setupSheet" ONCE to create / validate headers
 *   4. Add Trigger: onEdit → spreadsheet → On edit
 *   5. Deploy → New deployment → Web App
 *        Execute as: Me  |  Who has access: Anyone
 *   6. Copy the deployed URL → paste into src/lib/googleSheets.js
 *      as APPS_SCRIPT_WEBAPP_URL
 *
 * ALL reads and writes go through doGet (no CORS pre-flight issues):
 *   ?action=GET           → return all teams as JSON
 *   ?action=ADD_TEAM      → add a team row
 *   ?action=UPDATE_SCORE  → update scores / DQ for a team
 *   ?action=UPDATE_NAME   → rename a team
 *   ?action=DELETE_TEAM   → delete a team row
 *
 * COLUMN LAYOUT (auto-created by setupSheet, columns detected by name):
 *   A: Team Code  B: Team Name  C: Round 1  D: Round 2
 *   E: Round 3    F: Design     G: DQ       H: Total (auto-computed)
 * ============================================================
 */

var SPREADSHEET_ID = "1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw";
var SHEET_NAME     = "Leaderboard";

// Standard headers for a fresh sheet (setupSheet writes these)
var STANDARD_HEADERS = ["Team Code", "Team Name", "Round 1", "Round 2", "Round 3", "Design", "DQ", "Total"];

// ─────────────────────────────────────────────────────────────
// Sheet access
// ─────────────────────────────────────────────────────────────
function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // Try first sheet as fallback
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

// ─────────────────────────────────────────────────────────────
// Dynamic column detection — reads actual header row each time.
// Returns an object: { code, name, r1, r2, r3, design, dq, total }
// with 0-based column indices. Missing columns get -1.
// ─────────────────────────────────────────────────────────────
function detectColumns(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return null;

  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  function findIdx(candidates) {
    for (var i = 0; i < headerRow.length; i++) {
      var h = (headerRow[i] || "").toString().toLowerCase().trim();
      for (var j = 0; j < candidates.length; j++) {
        var c = candidates[j].toLowerCase();
        // Exact match first, then substring
        if (h === c) return i;
      }
    }
    // Second pass: substring
    for (var i = 0; i < headerRow.length; i++) {
      var h = (headerRow[i] || "").toString().toLowerCase().trim();
      for (var j = 0; j < candidates.length; j++) {
        var c = candidates[j].toLowerCase();
        if (h.indexOf(c) !== -1) return i;
      }
    }
    return -1;
  }

  return {
    code:   findIdx(["team code", "code", "team id", "id"]),
    name:   findIdx(["team name", "name"]),
    r1:     findIdx(["round 1", "round1", "r1", "flight 1"]),
    r2:     findIdx(["round 2", "round2", "r2", "flight 2"]),
    r3:     findIdx(["round 3", "round3", "r3", "flight 3"]),
    design: findIdx(["design", "design marks", "des"]),
    dq:     findIdx(["dq", "disqualified"]),
    total:  findIdx(["total", "total marks", "total score"])
  };
}

// ─────────────────────────────────────────────────────────────
// Compute total for a row
// ─────────────────────────────────────────────────────────────
function calcTotal(r1, r2, r3, design, isDQ) {
  if (isDQ) return 0;
  return (Number(r1) || 0) + (Number(r2) || 0) + (Number(r3) || 0) + (Number(design) || 0);
}

// ─────────────────────────────────────────────────────────────
// Normalize team name for dedup comparison
// ─────────────────────────────────────────────────────────────
function normName(name) {
  return (name || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ─────────────────────────────────────────────────────────────
// Find a team's row number (1-based) by name. Returns -1 if not found.
// ─────────────────────────────────────────────────────────────
function findTeamRow(sheet, cols, teamName) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || cols.name === -1) return -1;
  var norm = normName(teamName);
  var names = sheet.getRange(2, cols.name + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) {
    if (normName(names[i][0]) === norm) return i + 2;
  }
  return -1;
}

// ─────────────────────────────────────────────────────────────
// setupSheet — run ONCE to initialise headers + freeze + style
// ─────────────────────────────────────────────────────────────
function setupSheet() {
  var sheet = getSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(STANDARD_HEADERS);
  } else {
    // Write missing headers without overwriting existing data
    var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), STANDARD_HEADERS.length)).getValues()[0];
    for (var i = 0; i < STANDARD_HEADERS.length; i++) {
      if (!existing[i] || existing[i].toString().trim() === "") {
        sheet.getRange(1, i + 1).setValue(STANDARD_HEADERS[i]);
      }
    }
  }
  // Style header row
  var hRange = sheet.getRange(1, 1, 1, STANDARD_HEADERS.length);
  hRange.setBackground("#0D1117");
  hRange.setFontColor("#29ABE2");
  hRange.setFontWeight("bold");
  hRange.setFontSize(10);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, STANDARD_HEADERS.length);
  Logger.log("setupSheet complete on: " + sheet.getName());
}

// ─────────────────────────────────────────────────────────────
// onEdit — auto-recalculate Total whenever scores change in sheet
// MUST be installed as a Trigger (spreadsheet → On edit)
// ─────────────────────────────────────────────────────────────
function onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    // Only apply to our leaderboard sheet
    if (sheet.getName() !== SHEET_NAME) return;

    var row = e.range.getRow();
    if (row < 2) return; // skip header

    var cols = detectColumns(sheet);
    if (!cols) return;

    var editedCol = e.range.getColumn() - 1; // convert to 0-based
    // Only recalculate if a score or DQ column changed
    var scoreOrDQ = [cols.r1, cols.r2, cols.r3, cols.design, cols.dq];
    var isRelevant = false;
    for (var i = 0; i < scoreOrDQ.length; i++) {
      if (scoreOrDQ[i] !== -1 && editedCol === scoreOrDQ[i]) { isRelevant = true; break; }
    }
    if (!isRelevant) return;

    // Re-read the full row
    var lastCol = sheet.getLastColumn();
    var rowVals = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    var r1     = cols.r1     !== -1 ? (Number(rowVals[cols.r1])     || 0) : 0;
    var r2     = cols.r2     !== -1 ? (Number(rowVals[cols.r2])     || 0) : 0;
    var r3     = cols.r3     !== -1 ? (Number(rowVals[cols.r3])     || 0) : 0;
    var design = cols.design !== -1 ? (Number(rowVals[cols.design]) || 0) : 0;
    var dqRaw  = cols.dq    !== -1 ? (rowVals[cols.dq] || "").toString().toUpperCase() : "NO";
    var isDQ   = (dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED");

    var total  = calcTotal(r1, r2, r3, design, isDQ);

    if (cols.total !== -1) {
      sheet.getRange(row, cols.total + 1).setValue(total);
    }
  } catch (err) {
    // Never break sheet editing
  }
}

// ─────────────────────────────────────────────────────────────
// doGet — handles ALL requests (reads and writes)
// This avoids CORS pre-flight issues that plague doPost.
// All admin actions are sent as GET params from the website.
// ─────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    var action = "GET";
    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action.toString().toUpperCase();
    }

    var sheet = getSheet();

    if (action === "GET" || action === "") {
      return handleGet(sheet, e);
    }
    if (action === "ADD_TEAM")     return handleAddTeam(sheet, e.parameter);
    if (action === "UPDATE_SCORE") return handleUpdateScore(sheet, e.parameter);
    if (action === "UPDATE_NAME")  return handleUpdateName(sheet, e.parameter);
    if (action === "DELETE_TEAM")  return handleDeleteTeam(sheet, e.parameter);

    return jsonOut({ status: "error", error: "Unknown action: " + action });
  } catch (err) {
    return jsonOut({ status: "error", error: err.toString() });
  }
}

// doPost — kept as backup, proxies to doGet handler
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (_) {}
    }
    if (!data.action && e && e.parameter) {
      data = e.parameter;
    }

    // Fake a parameter object and delegate to doGet logic
    var fakeE = { parameter: data };
    return doGet(fakeE);
  } catch (err) {
    return jsonOut({ status: "error", error: err.toString() });
  }
}

// ─────────────────────────────────────────────────────────────
// GET: Return all teams as JSON
// ─────────────────────────────────────────────────────────────
function handleGet(sheet, e) {
  var lastRow = sheet.getLastRow();
  var teams   = [];

  if (lastRow >= 2) {
    var cols    = detectColumns(sheet);
    var lastCol = sheet.getLastColumn();
    var data    = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var i = 0; i < data.length; i++) {
      var row  = data[i];
      // Must have a name
      var nameCol = (cols && cols.name !== -1) ? cols.name : 1;
      var name = (row[nameCol] || "").toString().trim();
      if (!name) continue;

      var r1     = (cols && cols.r1     !== -1) ? (Number(row[cols.r1])     || 0) : 0;
      var r2     = (cols && cols.r2     !== -1) ? (Number(row[cols.r2])     || 0) : 0;
      var r3     = (cols && cols.r3     !== -1) ? (Number(row[cols.r3])     || 0) : 0;
      var design = (cols && cols.design !== -1) ? (Number(row[cols.design]) || 0) : 0;
      var dqRaw  = (cols && cols.dq    !== -1) ? (row[cols.dq] || "").toString().toUpperCase() : "NO";
      var isDQ   = (dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED");
      var code   = (cols && cols.code  !== -1 && row[cols.code])
                     ? row[cols.code].toString().trim().toUpperCase()
                     : ("T-" + String(i + 1).padStart(2, "0"));

      var total  = calcTotal(r1, r2, r3, design, isDQ);

      // Keep sheet's Total column in sync (write back computed value)
      if (cols && cols.total !== -1) {
        var sheetTotal = Number(row[cols.total]) || 0;
        if (sheetTotal !== total) {
          sheet.getRange(i + 2, cols.total + 1).setValue(total);
        }
      }

      teams.push({
        code:         code,
        name:         name,
        round_1:      r1,
        round_2:      r2,
        round_3:      r3,
        design:       design,
        disqualified: isDQ,
        total:        total
      });
    }
  }

  var out = JSON.stringify({ status: "ok", teams: teams, ts: new Date().getTime() });

  // JSONP support
  if (e && e.parameter && e.parameter.callback) {
    return ContentService
      .createTextOutput(e.parameter.callback + "(" + out + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
// ADD_TEAM
// ─────────────────────────────────────────────────────────────
function handleAddTeam(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var name = (params.name || "").toString().trim();
    var code = (params.code || "").toString().trim().toUpperCase();
    if (!name) return jsonOut({ status: "error", error: "name required" });

    var cols = detectColumns(sheet);
    if (!cols) {
      // Sheet not set up — call setup first
      setupSheet();
      cols = detectColumns(sheet);
    }

    // Dedup
    if (findTeamRow(sheet, cols, name) !== -1) {
      return jsonOut({ status: "duplicate", message: "Team already exists: " + name });
    }

    var lastRow   = sheet.getLastRow();
    var autoCode  = code || ("T-" + String(lastRow).padStart(2, "0"));
    var lastCol   = Math.max(sheet.getLastColumn(), STANDARD_HEADERS.length);
    var newRow    = new Array(lastCol).fill("");

    if (cols.code   !== -1) newRow[cols.code]   = autoCode;
    if (cols.name   !== -1) newRow[cols.name]   = name;
    if (cols.r1     !== -1) newRow[cols.r1]     = 0;
    if (cols.r2     !== -1) newRow[cols.r2]     = 0;
    if (cols.r3     !== -1) newRow[cols.r3]     = 0;
    if (cols.design !== -1) newRow[cols.design] = 0;
    if (cols.dq     !== -1) newRow[cols.dq]     = "NO";
    if (cols.total  !== -1) newRow[cols.total]  = 0;

    sheet.appendRow(newRow);
    return jsonOut({ status: "ok", action: "ADD_TEAM", name: name, code: autoCode });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE_SCORE — update any score field and recompute Total
// params: name, category (round_1|round_2|round_3|design), value
//         also accepts: disqualified (YES/NO)
// ─────────────────────────────────────────────────────────────
function handleUpdateScore(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var name = (params.name || "").toString().trim();
    if (!name) return jsonOut({ status: "error", error: "name required" });

    var cols = detectColumns(sheet);
    if (!cols) return jsonOut({ status: "error", error: "Sheet columns not detected" });

    var row  = findTeamRow(sheet, cols, name);
    if (row === -1) return jsonOut({ status: "notfound", name: name });

    var lastCol = sheet.getLastColumn();
    var rowVals = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    // Read current values
    var r1     = cols.r1     !== -1 ? (Number(rowVals[cols.r1])     || 0) : 0;
    var r2     = cols.r2     !== -1 ? (Number(rowVals[cols.r2])     || 0) : 0;
    var r3     = cols.r3     !== -1 ? (Number(rowVals[cols.r3])     || 0) : 0;
    var design = cols.design !== -1 ? (Number(rowVals[cols.design]) || 0) : 0;
    var dqRaw  = cols.dq    !== -1 ? (rowVals[cols.dq] || "NO").toString().toUpperCase() : "NO";
    var isDQ   = (dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED");

    // Apply category-based score update
    var cat = (params.category || "").toString().toLowerCase();
    var val = Number(params.value) || 0;
    if (cat === "round_1" && cols.r1     !== -1) { r1     = val; sheet.getRange(row, cols.r1     + 1).setValue(val); }
    if (cat === "round_2" && cols.r2     !== -1) { r2     = val; sheet.getRange(row, cols.r2     + 1).setValue(val); }
    if (cat === "round_3" && cols.r3     !== -1) { r3     = val; sheet.getRange(row, cols.r3     + 1).setValue(val); }
    if (cat === "design"  && cols.design !== -1) { design = val; sheet.getRange(row, cols.design + 1).setValue(val); }

    // DQ flag
    if (params.disqualified !== undefined && cols.dq !== -1) {
      var dqStr = params.disqualified.toString().toUpperCase();
      isDQ = (dqStr === "YES" || dqStr === "TRUE");
      sheet.getRange(row, cols.dq + 1).setValue(isDQ ? "YES" : "NO");
    }

    // Recompute and write Total
    var total = calcTotal(r1, r2, r3, design, isDQ);
    if (cols.total !== -1) sheet.getRange(row, cols.total + 1).setValue(total);

    return jsonOut({ status: "ok", action: "UPDATE_SCORE", name: name, total: total });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE_NAME
// ─────────────────────────────────────────────────────────────
function handleUpdateName(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var oldName = (params.oldName || "").toString().trim();
    var newName = (params.newName || "").toString().trim();
    if (!oldName || !newName) return jsonOut({ status: "error", error: "oldName and newName required" });

    var cols = detectColumns(sheet);
    if (!cols || cols.name === -1) return jsonOut({ status: "error", error: "Name column not detected" });

    var row = findTeamRow(sheet, cols, oldName);
    if (row === -1) return jsonOut({ status: "notfound", name: oldName });

    // Dedup check
    var existingRow = findTeamRow(sheet, cols, newName);
    if (existingRow !== -1 && existingRow !== row) {
      return jsonOut({ status: "duplicate", message: "A team named '" + newName + "' already exists" });
    }

    sheet.getRange(row, cols.name + 1).setValue(newName);
    return jsonOut({ status: "ok", action: "UPDATE_NAME", oldName: oldName, newName: newName });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE_TEAM
// ─────────────────────────────────────────────────────────────
function handleDeleteTeam(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var name = (params.name || "").toString().trim();
    if (!name) return jsonOut({ status: "error", error: "name required" });

    var cols = detectColumns(sheet);
    if (!cols) return jsonOut({ status: "error", error: "Columns not detected" });

    var row = findTeamRow(sheet, cols, name);
    if (row === -1) return jsonOut({ status: "notfound", name: name });

    sheet.deleteRow(row);
    return jsonOut({ status: "ok", action: "DELETE_TEAM", name: name });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: JSON output
// ─────────────────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
