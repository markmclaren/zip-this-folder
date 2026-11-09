import * as fs from 'fs';
import * as path from 'path';
import * as yazl from 'yazl';
import ignore, { Ignore } from 'ignore';

export interface IgnoreOptions {
  useDefaultExcludes?: boolean;
  useGitignore?: boolean;
  useZipignore?: boolean;
  additionalExcludes?: string[];
  workspaceRoot?: string;
}

export interface ZipOptions {
  sourceDir: string;
  targetZipPath: string;
  ignoreOptions?: IgnoreOptions;
  onProgress?: (processedFiles: number) => void;
  isCancelled?: () => boolean;
}

export interface ZipResult {
  totalBytes: number;
  targetPath: string;
}

const DEFAULT_EXCLUDES = [
  'node_modules',
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '*.zip',
  '.zipignore',
];

/**
 * Builds an Ignore instance populated with default excludes,
 * user settings, .gitignore, and .zipignore rules.
 */
export function buildIgnoreFilter(sourceDir: string, options: IgnoreOptions = {}): Ignore {
  const ig = ignore();

  // 1. Default excludes (node_modules, .git, etc.)
  if (options.useDefaultExcludes !== false) {
    ig.add(DEFAULT_EXCLUDES);
  }

  // 2. User-configured additional excludes from VS Code settings
  if (options.additionalExcludes && options.additionalExcludes.length > 0) {
    ig.add(options.additionalExcludes);
  }

  // Helper to safely load ignore files
  const loadIgnoreFile = (filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        ig.add(content);
      }
    } catch {
      // Ignore read errors
    }
  };

  // 3. .gitignore support
  if (options.useGitignore !== false) {
    // Check workspace root if different
    if (options.workspaceRoot && options.workspaceRoot !== sourceDir) {
      loadIgnoreFile(path.join(options.workspaceRoot, '.gitignore'));
    }
    loadIgnoreFile(path.join(sourceDir, '.gitignore'));
  }

  // 4. .zipignore support (dedicated ignore file for zipping)
  if (options.useZipignore !== false) {
    // Check workspace root if different
    if (options.workspaceRoot && options.workspaceRoot !== sourceDir) {
      loadIgnoreFile(path.join(options.workspaceRoot, '.zipignore'));
    }
    loadIgnoreFile(path.join(sourceDir, '.zipignore'));
  }

  return ig;
}

/**
 * Gets a unique file path if target path already exists,
 * e.g. "folder (1).zip", "folder (2).zip".
 */
export function getUniqueZipPath(targetPath: string): string {
  if (!fs.existsSync(targetPath)) {
    return targetPath;
  }

  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const baseName = path.basename(targetPath, ext);

  let counter = 1;
  let newPath = path.join(dir, `${baseName} (${counter})${ext}`);

  while (fs.existsSync(newPath)) {
    counter++;
    newPath = path.join(dir, `${baseName} (${counter})${ext}`);
  }

  return newPath;
}

/**
 * Format bytes into human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Compresses a directory into a zip archive using yazl.
 * Preserves the directory itself inside the archive root,
 * and skips ignored files/directories before descending into them.
 */
export function createZipArchive(options: ZipOptions): Promise<ZipResult> {
  const { sourceDir, targetZipPath, ignoreOptions, onProgress, isCancelled } = options;
  const folderName = path.basename(sourceDir);
  const ig = buildIgnoreFilter(sourceDir, ignoreOptions);

  return new Promise((resolve, reject) => {
    let output: fs.WriteStream;
    try {
      output = fs.createWriteStream(targetZipPath);
    } catch (err) {
      return reject(err);
    }

    const zipFile = new yazl.ZipFile();

    let cleanedUp = false;
    const cleanupPartialFile = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      try {
        output.destroy();
      } catch {
        // ignore
      }
      try {
        if (fs.existsSync(targetZipPath)) {
          fs.unlinkSync(targetZipPath);
        }
      } catch {
        // ignore error during cleanup
      }
    };

    output.on('close', () => {
      let totalBytes = 0;
      try {
        totalBytes = fs.statSync(targetZipPath).size;
      } catch {
        // ignore
      }
      resolve({
        totalBytes,
        targetPath: targetZipPath,
      });
    });

    output.on('error', (err: Error) => {
      cleanupPartialFile();
      reject(err);
    });

    zipFile.outputStream.on('error', (err: Error) => {
      cleanupPartialFile();
      reject(err);
    });

    zipFile.outputStream.pipe(output);

    let processedCount = 0;

    async function walk(currentDir: string): Promise<void> {
      if (isCancelled && isCancelled()) {
        throw new Error('Zip operation was cancelled.');
      }

      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      } catch {
        // Skip unreadable directory
        return;
      }

      // If directory is completely empty, record an empty directory entry
      if (entries.length === 0) {
        const relDir = path.relative(sourceDir, currentDir).replace(/\\/g, '/');
        const zipDirPath = relDir ? `${folderName}/${relDir}/` : `${folderName}/`;
        zipFile.addEmptyDirectory(zipDirPath);
        return;
      }

      for (const entry of entries) {
        if (isCancelled && isCancelled()) {
          throw new Error('Zip operation was cancelled.');
        }

        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(sourceDir, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          if (ig.ignores(relPath) || ig.ignores(`${relPath}/`)) {
            continue; // Skip entire directory without reading inside it!
          }
          await walk(fullPath);
        } else if (entry.isFile() || entry.isSymbolicLink()) {
          if (ig.ignores(relPath)) {
            continue;
          }
          const zipEntryPath = `${folderName}/${relPath}`;
          zipFile.addFile(fullPath, zipEntryPath);
          processedCount++;
          if (onProgress) {
            onProgress(processedCount);
          }
        }
      }
    }

    walk(sourceDir)
      .then(() => {
        zipFile.end();
      })
      .catch((err) => {
        cleanupPartialFile();
        reject(err);
      });
  });
}
