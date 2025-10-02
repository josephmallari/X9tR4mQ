import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


let win;

async function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            preload: join(__dirname, 'preload.mjs')
        }
    })

    if (!app.isPackaged) {
        const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
        await win.loadURL(url);
        win.webContents.openDevTools({ mode: 'detach' })
    } else {
        const indexHtml = fileURLToPath(new URL('../dist/index.html', import.meta.url))
        await win.loadFile(indexHtml)
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
