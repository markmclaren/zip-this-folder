import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createZipArchive, formatBytes, getUniqueZipPath, IgnoreOptions } from './zipper';

export function activate(context: vscode.ExtensionContext) {
  const zipCommand = vscode.commands.registerCommand(
    'zip-this-folder.zipFolder',
    async (selectedUri?: vscode.Uri, allSelectedUris?: vscode.Uri[]) => {
      try {
        let targets: vscode.Uri[] = [];

        // 1. Multiple items selected in Explorer
        if (allSelectedUris && allSelectedUris.length > 0) {
          targets = allSelectedUris;
        }
        // 2. Single item clicked (folder or root)
        else if (selectedUri && typeof selectedUri.fsPath === 'string' && selectedUri.fsPath.length > 0) {
          targets = [selectedUri];
        }
        // 3. Clicked from empty space, view title bar, or Command Palette
        else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
          if (vscode.workspace.workspaceFolders.length === 1) {
            targets = [vscode.workspace.workspaceFolders[0].uri];
          } else {
            const picked = await vscode.window.showWorkspaceFolderPick({
              placeHolder: 'Select workspace folder to zip',
            });
            if (!picked) {
              return;
            }
            targets = [picked.uri];
          }
        }
        // 4. Fallback if no workspace is currently open
        else {
          const selected = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: true,
            openLabel: 'Select Folder to Zip',
            title: 'Select Folder(s) to Zip',
          });
          if (!selected || selected.length === 0) {
            return;
          }
          targets = selected;
        }

        // Filter and validate targets (must be existing directories)
        const validFolders: { uri: vscode.Uri; folderPath: string; folderName: string }[] = [];

        for (const uri of targets) {
          const folderPath = uri.fsPath;
          try {
            const stat = await fs.promises.stat(folderPath);
            if (stat.isDirectory()) {
              const folderName = path.basename(folderPath) || 'workspace';
              validFolders.push({ uri, folderPath, folderName });
            }
          } catch (statErr) {
            vscode.window.showErrorMessage(
              `Unable to access "${folderPath}": ${(statErr as Error).message}`
            );
          }
        }

        if (validFolders.length === 0) {
          vscode.window.showWarningMessage('No valid folders selected to zip.');
          return;
        }

        for (const { folderPath, folderName } of validFolders) {
          await processFolderZip(folderPath, folderName);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Zip Failed: ${err?.message || err}`);
      }
    }
  );

  context.subscriptions.push(zipCommand);
}

async function processFolderZip(folderPath: string, folderName: string): Promise<void> {
  const parentDir = path.dirname(folderPath);
  // In the rare case that the folder is the root of a drive (e.g. C:\), save into the folder itself
  const destDir = (parentDir === folderPath) ? folderPath : parentDir;
  const defaultZipPath = path.join(destDir, `${folderName}.zip`);
  let targetZipPath = defaultZipPath;

  // Check if destination zip file already exists
  if (fs.existsSync(defaultZipPath)) {
    const uniquePath = getUniqueZipPath(defaultZipPath);
    const uniqueFileName = path.basename(uniquePath);

    const choice = await vscode.window.showWarningMessage(
      `"${folderName}.zip" already exists in ${destDir}.`,
      { modal: true },
      'Overwrite',
      `Create "${uniqueFileName}"`
    );

    if (!choice) {
      // User cancelled
      return;
    }

    if (choice === `Create "${uniqueFileName}"`) {
      targetZipPath = uniquePath;
    }
  }

  // Load ignore settings from VS Code configuration
  const config = vscode.workspace.getConfiguration('zipThisFolder');
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(folderPath));
  const workspaceRoot = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;

  const ignoreOptions: IgnoreOptions = {
    useDefaultExcludes: config.get<boolean>('useDefaultExcludes', true),
    useGitignore: config.get<boolean>('useGitignore', true),
    useZipignore: config.get<boolean>('useZipignore', true),
    additionalExcludes: config.get<string[]>('additionalExcludes', []),
    workspaceRoot,
  };

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Zipping "${folderName}"`,
      cancellable: true,
    },
    async (progress, token) => {
      let isCancelled = false;
      token.onCancellationRequested(() => {
        isCancelled = true;
      });

      progress.report({ message: 'Starting compression...' });

      try {
        const result = await createZipArchive({
          sourceDir: folderPath,
          targetZipPath,
          ignoreOptions,
          onProgress: (count) => {
            progress.report({
              message: `${count} item${count === 1 ? '' : 's'} compressed...`,
            });
          },
          isCancelled: () => isCancelled || token.isCancellationRequested,
        });

        const sizeStr = formatBytes(result.totalBytes);
        const savedZipName = path.basename(result.targetPath);

        const action = await vscode.window.showInformationMessage(
          `Successfully zipped "${folderName}" into "${savedZipName}" (${sizeStr})`,
          'Reveal in File Explorer'
        );

        if (action === 'Reveal in File Explorer') {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(result.targetPath));
        }
      } catch (err: any) {
        if (isCancelled || token.isCancellationRequested) {
          vscode.window.showInformationMessage(`Zipping of "${folderName}" was cancelled.`);
        } else {
          throw err;
        }
      }
    }
  );
}

export function deactivate() {}
