import { app, BrowserWindow, systemPreferences, desktopCapturer } from 'electron';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable ScreenCaptureKit and screen capture features on macOS
if (process.platform === 'darwin') {
    // Enable macOS ScreenCaptureKit API (for Sonoma and later)
    app.commandLine.appendSwitch('enable-features', 'ScreenCaptureKitPickerSonoma');
}

// Enable getDisplayMedia API for all platforms
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');

let win;

async function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: join(__dirname, 'preload.js'),
            webSecurity: true,
            // Enable media features
            enableBlinkFeatures: 'GetDisplayMedia'
        }
    })

    // Request Screen Recording permission on macOS
    if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('screen');
        console.log('Screen Recording permission status:', status);

        if (status !== 'granted') {
            console.log('Requesting Screen Recording permission...');
            console.log('Please grant Screen Recording permission in System Settings > Privacy & Security');
        }
    }

    // Set up the display media request handler
    // This is required for getDisplayMedia to work in Electron
    win.webContents.session.setDisplayMediaRequestHandler(async (request, callback) => {
        console.log('Display media request received');

        // Get available desktop sources
        const sources = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            fetchWindowIcons: true
        });

        console.log(`Found ${sources.length} sources`);

        // Return the first screen source (this should trigger the native picker on macOS)
        const primaryScreen = sources.find(source => source.id.startsWith('screen:')) || sources[0];

        if (primaryScreen) {
            console.log('Using source:', primaryScreen.name);
            callback({ video: primaryScreen, audio: 'loopback' });
        } else {
            console.error('No desktop sources available');
            callback({});
        }
    });

    console.log('Using native system picker for screen/audio capture');

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
