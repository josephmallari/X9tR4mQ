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
            preload: join(__dirname, 'preload.mjs')
        }
    })

    // Set up display media request handler for system audio capture (Windows optimized)
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        console.log('Display media request received:', request);
        console.log('Platform:', process.platform);
        
        // Check if we're on Windows for better system audio support
        if (process.platform === 'win32') {
            console.log('Windows detected - enabling system audio capture');
            
            desktopCapturer.getSources({ 
                types: ['screen'],
                thumbnailSize: { width: 0, height: 0 }, // Skip thumbnails for better performance
                fetchWindowIcons: false // Skip icons for better performance
            }).then((sources) => {
                console.log('Available Windows sources:', sources.length);
                
                // Grant access to the first screen found for system audio
                if (sources.length > 0) {
                    console.log('Windows system audio source detected:', sources[0].name);
                    callback({ video: sources[0], audio: 'loopback' });
                } else {
                    console.log('No Windows system audio sources found');
                    callback({ video: null, audio: null });
                }
            }).catch((error) => {
                console.error('Error getting Windows desktop sources:', error);
                callback({ video: null, audio: null });
            });
        } else {
            console.log('Non-Windows platform detected - limited system audio support');
            // For non-Windows platforms, still try but with lower expectations
            desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
                if (sources.length > 0) {
                    console.log('Non-Windows source found (limited audio support):', sources[0].name);
                    callback({ video: sources[0], audio: 'loopback' });
                } else {
                    console.log('No sources found on non-Windows platform');
                    callback({ video: null, audio: null });
                }
            }).catch((error) => {
                console.error('Error on non-Windows platform:', error);
                callback({ video: null, audio: null });
            });
        }
    }, { useSystemPicker: true });

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
