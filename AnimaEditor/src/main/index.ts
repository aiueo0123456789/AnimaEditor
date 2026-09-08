import { app, shell, BrowserWindow, ipcMain, protocol, dialog } from 'electron'
import fs from 'fs/promises';
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import path from 'path';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    fullscreen: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.openDevTools();

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('show-save-dialog', async (event, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    return canceled ? null : filePath;
  });

  ipcMain.handle('show-open-dialog', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('read-file', async (event, filePath: string) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (e) {
      console.error('読み込み失敗:', e);
      return null;
    }
  });

  ipcMain.handle('write-file', async (event, filePath: string, data: string) => {
    try {
      await fs.writeFile(filePath, data, 'utf-8');
      return true;
    } catch (e) {
      console.error('書き込み失敗:', e);
      return false;
    }
  });

  protocol.handle('local-file', async (request) => {
    try {
      // pathnameには "local" ホストの後ろの部分(/Users/...)だけが入る
      const filePath = decodeURIComponent(new URL(request.url).pathname);
      const data = await fs.readFile(filePath);

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      };
      const contentType = mimeTypes[ext] ?? 'application/octet-stream';

      return new Response(data, {
        headers: { 'content-type': contentType },
      });
    } catch (e) {
      console.error('画像読み込み失敗:', e);
      return new Response(null, { status: 404 });
    }
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
