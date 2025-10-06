const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getDesktopSources: (options) => ipcRenderer.invoke('get-desktop-sources', options),
    getWindowsAudioSources: () => ipcRenderer.invoke('get-windows-audio-sources'),
    getPlatform: () => process.platform
});