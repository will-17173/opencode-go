---
name: xlsx
description: "Use this skill any time a spreadsheet file is the primary input or output. This means tasks where the user wants to: open, read, edit, or fix an existing .xlsx or .csv file (e.g., adding rows, exporting data, format conversion); create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats. Trigger especially when the user references a spreadsheet file by name or path. The deliverable must be a spreadsheet file. Scope: simple tabular data (rows + columns, no complex formulas, no charts, no conditional formatting). Do NOT trigger when the primary deliverable is a Word document, HTML report, or Google Sheets API integration."
---

# Excel / CSV Processing (Node.js)

Uses `exceljs` via `scripts/xlsx.mjs`. Supports: read, write, append, sheet listing, CSV→xlsx conversion.

## Setup

No dependencies to install. `exceljs` is built into the app.

The script calls the proxy server at `http://127.0.0.1:$PROXY_PORT/api/xlsx/*`.
Get the proxy port via IPC: `window.electronAPI.getProxyPort()`, then pass it:

```bash
# via env var (preferred in shell scripts)
PROXY_PORT=<port> node scripts/xlsx.mjs <cmd> [args...]

# or via flag
node scripts/xlsx.mjs --port <port> <cmd> [args...]
```

## Commands

```bash
# Read sheet → JSON (default: first sheet)
node scripts/xlsx.mjs read <file.xlsx> [sheetName]

# Write JSON array → xlsx (creates or overwrites sheet)
node scripts/xlsx.mjs write <file.xlsx> <data.json> [sheetName]

# Append rows to existing sheet
node scripts/xlsx.mjs append <file.xlsx> <data.json> [sheetName]

# List sheet names
node scripts/xlsx.mjs sheets <file.xlsx>

# Convert CSV to xlsx
node scripts/xlsx.mjs csv2xlsx <in.csv> <out.xlsx>
```

## Workflow

### Read and analyze

```bash
node scripts/xlsx.mjs read data.xlsx > rows.json
# Then process rows.json with jq or Node inline code
```

### Create from data

1. Write data to a temp JSON file
2. Run `write` command
3. Verify with `read` command

### Edit existing file

1. `read` → JSON
2. Modify JSON in memory or via script
3. `write` to overwrite, or `append` to add rows

## JSON format

All data is an array of objects with consistent keys:

```json
[
  {"name": "Alice", "score": 95},
  {"name": "Bob",   "score": 82}
]
```

- `write` infers column order from `Object.keys(data[0])`
- `append` infers column order from the existing header row

## Limitations

- No formula support (values only)
- No cell styling or conditional formatting
- CSV parsing splits on `,` only (no quoted fields with commas)
- For complex Excel features (formulas, charts, formatting), use openpyxl + LibreOffice instead
