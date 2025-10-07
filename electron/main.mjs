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

    // Set up display media request handler for system audio capture (auto-prioritize Google Meet)
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        console.log('Display media request received:', request);
        console.log('Platform:', process.platform);
        
        // Get all available sources and prioritize Google Meet
        desktopCapturer.getSources({ 
            types: ['screen', 'window'],
            thumbnailSize: { width: 0, height: 0 },
            fetchWindowIcons: false
        }).then((sources) => {
            console.log('Available sources:', sources.length);
            
            // Log all sources for debugging
            sources.forEach((source, index) => {
                console.log(`Source ${index}: ${source.name} (${source.id})`);
            });
            
            // Prioritize Google Meet sources
            const googleMeetSources = sources.filter(source => 
                source.name.toLowerCase().includes('meet') ||
                source.name.toLowerCase().includes('google') ||
                (source.name.toLowerCase().includes('chrome') && source.name.toLowerCase().includes('meet'))
            );
            
            // Then prioritize browser windows that might have Google Meet
            const browserSources = sources.filter(source => 
                source.name.toLowerCase().includes('chrome') ||
                source.name.toLowerCase().includes('edge') ||
                source.name.toLowerCase().includes('firefox') ||
                source.name.toLowerCase().includes('browser')
            );
            
            // Select the best source: Google Meet first, then browser windows, then any screen
            let selectedSource = null;
            
            if (googleMeetSources.length > 0) {
                selectedSource = googleMeetSources[0];
                console.log('Selected Google Meet source:', selectedSource.name);
            } else if (browserSources.length > 0) {
                selectedSource = browserSources[0];
                console.log('Selected browser source (might have Google Meet):', selectedSource.name);
            } else {
                // Fallback to first screen
                const screenSources = sources.filter(source => source.id.startsWith('screen:'));
                selectedSource = screenSources.length > 0 ? screenSources[0] : sources[0];
                console.log('Selected screen source:', selectedSource?.name || 'none');
            }
            
            if (selectedSource) {
                callback({ 
                    video: selectedSource, 
                    audio: 'loopback' // This captures system audio including Google Meet
                });
            } else {
                console.log('No sources available');
                callback({ video: null, audio: null });
            }
        }).catch((error) => {
            console.error('Error getting sources:', error);
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
