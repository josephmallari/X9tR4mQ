import { app, BrowserWindow, desktopCapturer, session } from 'electron';
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
            preload: join(__dirname, 'preload.js')
        }
    })

    // Set up display media request handler for system audio capture
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        console.log('Display media request received:', request);
        console.log('Platform:', process.platform);
        
        // For now, we'll let the custom source picker handle selection
        // The renderer will call getAvailableSources and show the picker UI
        // This handler will be called with the selected source
        
        // Default to first available screen source if no specific selection
        desktopCapturer.getSources({ 
            types: ['screen'],
            thumbnailSize: { width: 0, height: 0 },
            fetchWindowIcons: false
        }).then((sources) => {
            if (sources.length > 0) {
                console.log('Using default screen source:', sources[0].name);
                callback({ 
                    video: sources[0], 
                    audio: 'loopback'
                });
            } else {
                console.log('No screen sources available');
                callback({ video: null, audio: null });
            }
        }).catch((error) => {
            console.error('Error getting default source:', error);
            callback({ video: null, audio: null });
        });
    });

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
