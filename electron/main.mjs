import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
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
            nodeIntegration: false,
            enableRemoteModule: false,
            preload: join(__dirname, 'preload.js'),
            // Windows-specific audio permissions
            webSecurity: false, // Temporarily disable for testing
            allowRunningInsecureContent: true
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

// Handle desktop capturer sources request
ipcMain.handle('get-desktop-sources', async (event, options = {}) => {
    try {
        console.log('Getting desktop sources with options:', options);
        
        // Try different configurations for Windows compatibility
        const sources = await desktopCapturer.getSources({
            types: ['audio', 'screen'], // Include both audio and screen
            fetchWindowIcons: false,
            thumbnailSize: { width: 150, height: 150 },
            ...options
        });
        
        console.log('Found sources:', sources.map(s => ({ id: s.id, name: s.name, type: s.type })));
        
        // Filter for audio sources specifically
        const audioSources = sources.filter(source => 
            source.type === 'audio' || 
            source.name.toLowerCase().includes('audio') ||
            source.name.toLowerCase().includes('sound') ||
            source.name.toLowerCase().includes('system')
        );
        
        return audioSources;
    } catch (error) {
        console.error('Error getting desktop sources:', error);
        throw error;
    }
});

// Alternative method for Windows audio detection
ipcMain.handle('get-windows-audio-sources', async () => {
    try {
        // Try to get system audio using different approach
        const sources = await desktopCapturer.getSources({
            types: ['screen'], // Get screen sources that might include audio
            fetchWindowIcons: false
        });
        
        // Filter and format for Windows
        const audioSources = sources.map(source => ({
            id: source.id,
            name: `System Audio - ${source.name}`,
            type: 'audio'
        }));
        
        return audioSources;
    } catch (error) {
        console.error('Error getting Windows audio sources:', error);
        return [];
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
