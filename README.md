# NotebookLM Mindmap Extractor

Chrome extension for extracting mindmaps from NotebookLM and exporting them to common mindmap formats.

## Features

- Detects mindmap nodes from `notebooklm.google.com`
- Reconstructs hierarchy using SVG position and connection analysis
- Exports to:
  - FreeMind (`.mm`)
  - Generic XML (`.xml`)
  - OPML (`.opml`)
  - Excalidraw (`.excalidraw`) (optimised for great outputs)
- Debug mode for inspecting detected nodes, levels, connections, and page HTML
- Download support via the Chrome Downloads API

## Files

- `manifest.json` — Chrome extension manifest (MV3)
- `popup.html` — extension popup UI
- `popup.js` — popup logic, export generation, downloads
- `content.js` — NotebookLM page extraction and hierarchy building
- `background.js` — install/download listeners
- `styles.css` — button styles

## Install

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder

## Usage

1. Open a NotebookLM mindmap page
2. Click the extension icon
3. Click **Detect Mindmap**
4. Choose an export format
5. Click **Export Mindmap**

### Debug mode

Use **Debug Mode** if detection is off. It lets you:

- inspect all detected nodes
- view X-level grouping
- select a different root node
- download the full page HTML

## Permissions

- `activeTab`
- `scripting`
- `storage`
- `downloads`

## Notes

- The extension only runs on `https://notebooklm.google.com/*`
- Extraction depends on NotebookLM’s current DOM/SVG structure, so UI changes on Google’s side may break detection

## Development

To modify locally:

1. Edit the extension files
2. Reload the extension in `chrome://extensions`
3. Test on a NotebookLM mindmap
