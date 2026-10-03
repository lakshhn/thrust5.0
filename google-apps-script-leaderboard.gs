/**
 * ============================================================
 * THRUST 5.0 LEADERBOARD — Google Apps Script Backend
 * ============================================================
 * Spreadsheet ID: 1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw
 *
 * Scoring Formula:
 *   Total = Math.max(0, Round 1 + Round 2 + Round 3 + Design - Penalty)
 *   If Disqualified = "Yes" -> Total = 0
 *
 * Column Layout (dynamic, any order supported):
 *   Team Code | Team Name | R1 | R2 | R3 | Design | Penalty | Disqualified | Total
 * ============================================================
 */

var SPREADSHEET_ID = "1aLanZdwVvRVqP66ZTafFPQoCXhYyFofaNT_iReVqXaw";

var STANDARD_HEADERS = ["Team Code", "Team Name", "R1", "R2", "R3", "Design", "Penalty", "Disqualified", "Total"];

// ─────────────────────────────────────────────────────────────
// Dynamic Sheet Finder — finds the tab with your team data
// ─────────────────────────────────────────────────────────────
function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    if (s.getLastRow() > 1 && s.getLastColumn() >= 2) {
      var headerText = s.getRange(1, 1, 1, Math.min(s.getLastColumn(), 10))
                        .getValues()[0].join(" ").toLowerCase();
      if (headerText.indexOf("team") !== -1) {
        return s;
      }
    }
  }

  return ss.getSheetByName("Sheet1") || ss.getSheetByName("Leaderboard") || sheets[0];
}

// ─────────────────────────────────────────────────────────────
// Dynamic Column Detection
// ─────────────────────────────────────────────────────────────
function detectColumns(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return null;

  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  function findIdx(candidates) {
    for (var i = 0; i < headerRow.length; i++) {
      var h = (headerRow[i] || "").toString().toLowerCase().trim();
      for (var j = 0; j < candidates.length; j++) {
        if (h === candidates[j].toLowerCase()) return i;
      }
    }
    for (var i = 0; i < headerRow.length; i++) {
      var h = (headerRow[i] || "").toString().toLowerCase().trim();
      for (var j = 0; j < candidates.length; j++) {
        if (h.indexOf(candidates[j].toLowerCase()) !== -1) return i;
      }
    }
    return -1;
  }

  return {
    code:    findIdx(["team code", "code", "team id", "id"]),
    name:    findIdx(["team name", "name"]),
    r1:      findIdx(["r1", "round 1", "round1", "flight 1"]),
    r2:      findIdx(["r2", "round 2", "round2", "flight 2"]),
    r3:      findIdx(["r3", "round 3", "round3", "flight 3"]),
    design:  findIdx(["design", "design marks", "des"]),
    penalty: findIdx(["penalty", "pen", "deduction", "deductions"]),
    dq:      findIdx(["disqualified", "dq"]),
    total:   findIdx(["total", "total marks", "total score"])
  };
}

// ─────────────────────────────────────────────────────────────
// Calculation: Total = R1 + R2 + R3 + Design - Penalty
// ─────────────────────────────────────────────────────────────
function calcTotal(r1, r2, r3, design, penalty, isDQ) {
  if (isDQ) return 0;
  var sum = (Number(r1) || 0) + (Number(r2) || 0) + (Number(r3) || 0) + (Number(design) || 0);
  var pen = Number(penalty) || 0;
  return Math.max(0, sum - pen);
}

function normName(name) {
  return (name || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

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
// setupSheet — ensures Penalty and Total columns exist in sheet
// ─────────────────────────────────────────────────────────────
function setupSheet() {
  var sheet = getSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(STANDARD_HEADERS);
  } else {
    var cols = detectColumns(sheet);
    // If Penalty column is missing, add it before Disqualified or Total
    if (cols && cols.penalty === -1) {
      var insertAt = (cols.dq !== -1) ? cols.dq + 1 : sheet.getLastColumn() + 1;
      sheet.insertColumnBefore(insertAt);
      sheet.getRange(1, insertAt).setValue("Penalty");
      sheet.getRange(1, insertAt).setBackground("#0D1117").setFontColor("#FF4D4D").setFontWeight("bold");
    }

    cols = detectColumns(sheet);
    // If Total column is missing, append it
    if (cols && cols.total === -1) {
      var nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue("Total");
      sheet.getRange(1, nextCol).setBackground("#0D1117").setFontColor("#29ABE2").setFontWeight("bold");
    }
  }
  Logger.log("Configured sheet: " + sheet.getName());
}

// ─────────────────────────────────────────────────────────────
// onEdit Trigger — auto-calculates Total column whenever
// scores, penalties, or DQ are edited directly in the sheet
// ─────────────────────────────────────────────────────────────
function onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    var targetSheet = getSheet();
    if (sheet.getName() !== targetSheet.getName()) return;

    var row = e.range.getRow();
    if (row < 2) return;

    var cols = detectColumns(sheet);
    if (!cols) return;

    var editedCol = e.range.getColumn() - 1;
    var scoreCols = [cols.r1, cols.r2, cols.r3, cols.design, cols.penalty, cols.dq];
    var isRelevant = false;
    for (var i = 0; i < scoreCols.length; i++) {
      if (scoreCols[i] !== -1 && editedCol === scoreCols[i]) {
        isRelevant = true;
        break;
      }
    }
    if (!isRelevant) return;

    var lastCol = sheet.getLastColumn();
    var rowVals = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    var r1      = cols.r1      !== -1 ? (Number(rowVals[cols.r1])      || 0) : 0;
    var r2      = cols.r2      !== -1 ? (Number(rowVals[cols.r2])      || 0) : 0;
    var r3      = cols.r3      !== -1 ? (Number(rowVals[cols.r3])      || 0) : 0;
    var design  = cols.design  !== -1 ? (Number(rowVals[cols.design])  || 0) : 0;
    var penalty = cols.penalty !== -1 ? (Number(rowVals[cols.penalty]) || 0) : 0;
    var dqRaw   = cols.dq      !== -1 ? (rowVals[cols.dq] || "").toString().toUpperCase() : "NO";
    var isDQ    = (dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED" || dqRaw.indexOf("YES") !== -1);

    var total   = calcTotal(r1, r2, r3, design, penalty, isDQ);

    if (cols.total !== -1) {
      sheet.getRange(row, cols.total + 1).setValue(total);
    }
  } catch (err) {}
}

// ─────────────────────────────────────────────────────────────
// doGet — handles both READS and WRITES
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

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (_) {}
    }
    if (!data.action && e && e.parameter) data = e.parameter;
    return doGet({ parameter: data });
  } catch (err) {
    return jsonOut({ status: "error", error: err.toString() });
  }
}

// ─────────────────────────────────────────────────────────────
// READ: Return all teams
// ─────────────────────────────────────────────────────────────
function handleGet(sheet, e) {
  var lastRow = sheet.getLastRow();
  var teams   = [];

  if (lastRow >= 2) {
    var cols    = detectColumns(sheet);
    var lastCol = sheet.getLastColumn();
    var data    = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var nameCol = (cols && cols.name !== -1) ? cols.name : 1;
      var name = (row[nameCol] || "").toString().trim();
      if (!name || name.toLowerCase() === "team name") continue;

      var r1      = (cols && cols.r1      !== -1) ? (Number(row[cols.r1])      || 0) : 0;
      var r2      = (cols && cols.r2      !== -1) ? (Number(row[cols.r2])      || 0) : 0;
      var r3      = (cols && cols.r3      !== -1) ? (Number(row[cols.r3])      || 0) : 0;
      var design  = (cols && cols.design  !== -1) ? (Number(row[cols.design])  || 0) : 0;
      var penalty = (cols && cols.penalty !== -1) ? (Number(row[cols.penalty]) || 0) : 0;
      var dqRaw   = (cols && cols.dq      !== -1) ? (row[cols.dq] || "").toString().toUpperCase() : "NO";
      var isDQ    = (dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED" || dqRaw.indexOf("YES") !== -1);
      var code    = (cols && cols.code    !== -1 && row[cols.code])
                      ? row[cols.code].toString().trim().toUpperCase()
                      : ("T-" + String(i + 1).padStart(2, "0"));

      var total = calcTotal(r1, r2, r3, design, penalty, isDQ);

      // Keep Total column synced in sheet
      if (cols && cols.total !== -1) {
        var sheetTotal = Number(row[cols.total]);
        if (isNaN(sheetTotal) || sheetTotal !== total) {
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
        penalty:      penalty,
        disqualified: isDQ,
        total:        total
      });
    }
  }

  var out = JSON.stringify({ status: "ok", teams: teams, ts: new Date().getTime() });
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + "(" + out + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
// WRITE: ADD_TEAM
// ─────────────────────────────────────────────────────────────
function handleAddTeam(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var name = (params.name || "").toString().trim();
    var code = (params.code || "").toString().trim().toUpperCase();
    if (!name) return jsonOut({ status: "error", error: "name required" });

    var cols = detectColumns(sheet);
    if (!cols) { setupSheet(); cols = detectColumns(sheet); }

    if (findTeamRow(sheet, cols, name) !== -1) {
      return jsonOut({ status: "duplicate", message: "Team already exists: " + name });
    }

    var lastRow  = sheet.getLastRow();
    var autoCode = code || ("T-" + String(lastRow).padStart(2, "0"));
    var lastCol  = Math.max(sheet.getLastColumn(), STANDARD_HEADERS.length);
    var newRow   = new Array(lastCol).fill("");

    if (cols.code    !== -1) newRow[cols.code]    = autoCode;
    if (cols.name    !== -1) newRow[cols.name]    = name;
    if (cols.r1      !== -1) newRow[cols.r1]      = 0;
    if (cols.r2      !== -1) newRow[cols.r2]      = 0;
    if (cols.r3      !== -1) newRow[cols.r3]      = 0;
    if (cols.design  !== -1) newRow[cols.design]  = 0;
    if (cols.penalty !== -1) newRow[cols.penalty] = 0;
    if (cols.dq      !== -1) newRow[cols.dq]      = "No";
    if (cols.total   !== -1) newRow[cols.total]   = 0;

    sheet.appendRow(newRow);
    return jsonOut({ status: "ok", action: "ADD_TEAM", name: name, code: autoCode });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// WRITE: UPDATE_SCORE
// ─────────────────────────────────────────────────────────────
function handleUpdateScore(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var name = (params.name || "").toString().trim();
    if (!name) return jsonOut({ status: "error", error: "name required" });

    var cols = detectColumns(sheet);
    if (!cols) return jsonOut({ status: "error", error: "Columns not detected" });

    var row = findTeamRow(sheet, cols, name);
    if (row === -1) return jsonOut({ status: "notfound", name: name });

    var lastCol = sheet.getLastColumn();
    var rowVals = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    var r1      = cols.r1      !== -1 ? (Number(rowVals[cols.r1])      || 0) : 0;
    var r2      = cols.r2      !== -1 ? (Number(rowVals[cols.r2])      || 0) : 0;
    var r3      = cols.r3      !== -1 ? (Number(rowVals[cols.r3])      || 0) : 0;
    var design  = cols.design  !== -1 ? (Number(rowVals[cols.design])  || 0) : 0;
    var penalty = cols.penalty !== -1 ? (Number(rowVals[cols.penalty]) || 0) : 0;
    var dqRaw   = cols.dq      !== -1 ? (rowVals[cols.dq] || "No").toString().toUpperCase() : "NO";
    var isDQ    = (dqRaw === "YES" || dqRaw === "DQ" || dqRaw === "DISQUALIFIED" || dqRaw.indexOf("YES") !== -1);

    var cat = (params.category || "").toString().toLowerCase();
    var val = Number(params.value) || 0;
    if (cat === "round_1" && cols.r1      !== -1) { r1      = val; sheet.getRange(row, cols.r1      + 1).setValue(val); }
    if (cat === "round_2" && cols.r2      !== -1) { r2      = val; sheet.getRange(row, cols.r2      + 1).setValue(val); }
    if (cat === "round_3" && cols.r3      !== -1) { r3      = val; sheet.getRange(row, cols.r3      + 1).setValue(val); }
    if (cat === "design"  && cols.design  !== -1) { design  = val; sheet.getRange(row, cols.design  + 1).setValue(val); }
    if (cat === "penalty" && cols.penalty !== -1) { penalty = val; sheet.getRange(row, cols.penalty + 1).setValue(val); }

    if (params.disqualified !== undefined && cols.dq !== -1) {
      var dqStr = params.disqualified.toString().toUpperCase();
      isDQ = (dqStr === "YES" || dqStr === "TRUE" || dqStr === "DQ");
      sheet.getRange(row, cols.dq + 1).setValue(isDQ ? "Yes" : "No");
    }

    var total = calcTotal(r1, r2, r3, design, penalty, isDQ);
    if (cols.total !== -1) sheet.getRange(row, cols.total + 1).setValue(total);

    return jsonOut({ status: "ok", action: "UPDATE_SCORE", name: name, total: total });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// WRITE: UPDATE_NAME
// ─────────────────────────────────────────────────────────────
function handleUpdateName(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var oldName = (params.oldName || "").toString().trim();
    var newName = (params.newName || "").toString().trim();
    if (!oldName || !newName) return jsonOut({ status: "error", error: "Names required" });

    var cols = detectColumns(sheet);
    if (!cols || cols.name === -1) return jsonOut({ status: "error", error: "Name col missing" });

    var row = findTeamRow(sheet, cols, oldName);
    if (row === -1) return jsonOut({ status: "notfound", name: oldName });

    var existingRow = findTeamRow(sheet, cols, newName);
    if (existingRow !== -1 && existingRow !== row) {
      return jsonOut({ status: "duplicate", message: "A team named '" + newName + "' exists" });
    }

    sheet.getRange(row, cols.name + 1).setValue(newName);
    return jsonOut({ status: "ok", action: "UPDATE_NAME", oldName: oldName, newName: newName });
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────────────────────
// WRITE: DELETE_TEAM
// ─────────────────────────────────────────────────────────────
function handleDeleteTeam(sheet, params) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var name = (params.name || "").toString().trim();
    if (!name) return jsonOut({ status: "error", error: "name required" });

    var cols = detectColumns(sheet);
    if (!cols) return jsonOut({ status: "error", error: "Cols missing" });

    var row = findTeamRow(sheet, cols, name);
    if (row === -1) return jsonOut({ status: "notfound", name: name });

    sheet.deleteRow(row);
    return jsonOut({ status: "ok", action: "DELETE_TEAM", name: name });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
