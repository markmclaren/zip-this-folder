# Zip This Folder

[![CI Build](https://github.com/markmclaren/zip-this-folder/actions/workflows/ci.yml/badge.svg)](https://github.com/markmclaren/zip-this-folder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight extension for **Visual Studio Code** and **Antigravity IDE** that allows you to easily zip any folder directly from the Explorer sidebar context menu.

## Features

- **Context Menu Integration**: Right-click any folder, root folder, or empty space in the Explorer sidebar and select **"Zip this folder"**.
- **Top-Level / Root Folder Zipping**: Zip the entire opened workspace folder either by:
  - Clicking the **Zip** icon `$(file-zip)` in the Explorer title bar.
  - Right-clicking on empty space inside the Explorer sidebar.
  - Right-clicking the root folder in multi-root workspaces.
- **Automatic Excludes & `.zipignore`**: Automatically skips `node_modules`, `.git`, `.DS_Store`, `Thumbs.db`, and `*.zip` by default. Also respects your project's `.gitignore` and dedicated `.zipignore` files!
- **Preserves Root Folder**: The generated `.zip` includes the selected folder at the root of the archive (e.g. `my-folder.zip` contains `my-folder/...`).
- **Same-Directory Output**: Automatically saves the `.zip` archive alongside the target folder (`<folder-name>.zip`).
- **Conflict Handling**: If a zip file with the same name already exists, you can choose to overwrite it or automatically save it as a unique file name (e.g. `my-folder (1).zip`).
- **Progress & Cancellation**: Displays a live compression progress notification with item counts and allows cancellation at any point.
- **Reveal in Explorer**: Provides a one-click button upon completion to instantly reveal the generated `.zip` in your system file explorer.
- **Multi-Selection Support**: Select multiple folders in the Explorer and zip them in one go.

## Usage

- **Sub-folders**: Right-click any folder in the Explorer sidebar and choose **"Zip this folder"**.
- **Top-level / Workspace Root**:
  - Click the **Zip** icon in the Explorer header bar (next to New File / New Folder), or
  - Right-click empty space in the Explorer sidebar and choose **"Zip this folder"**, or
  - Open the Command Palette (`Ctrl+Shift+P`) and type `Zip this folder`.

## Ignore Rules & `.zipignore`

The extension ignores unwanted files and directories using the standard gitignore syntax:

1. **Default Excludes**: `node_modules`, `.git`, `.DS_Store`, `Thumbs.db`, `*.zip`, and `.zipignore` are excluded automatically.
2. **`.gitignore` Support**: If a `.gitignore` exists in the folder or workspace root, its rules are applied automatically.
3. **`.zipignore` Support**: Create a `.zipignore` file in your folder or workspace root with any custom exclusion patterns specific to zipping (e.g. `dist/`, `build/`, `*.log`, `.env*`).
4. **Settings (`settings.json`)**:
   - `zipThisFolder.useDefaultExcludes` (boolean, default: `true`): Exclude common build & cache directories (`node_modules`, `.git`, etc.).
   - `zipThisFolder.useGitignore` (boolean, default: `true`): Respect patterns from `.gitignore`.
   - `zipThisFolder.useZipignore` (boolean, default: `true`): Respect patterns from `.zipignore`.
   - `zipThisFolder.additionalExcludes` (array, default: `[]`): Custom glob patterns to always exclude (e.g. `["dist", "build", ".venv"]`).

## Development & Testing

### Prerequisites
- Node.js (v18+)
- npm

### One-Click Build (.bat)
You can double-click or run `build.bat` in the project root to typecheck, bundle, and package the `.vsix` in one step:
```cmd
build.bat
```

### Manual Build
```bash
# Install dependencies
npm install

# Compile the extension with esbuild
npm run compile

# Typecheck with TypeScript
npm run check-types
```

### Running Locally
1. Press `F5` in VS Code or Antigravity IDE to launch the **Extension Development Host**.
2. In the new window, open any workspace folder.
3. Right-click on a folder in the sidebar and choose **"Zip this folder"**.

### Packaging as a `.vsix`
```bash
npx @vscode/vsce package --no-dependencies
```
You can then install the `.vsix` file into VS Code or Antigravity via `Extensions: Install from VSIX...`.

