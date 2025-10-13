const { contextBridge } = require('electron');

// Expose system audio detection capabilities to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Get platform information
    getPlatform: () => {
        return process.platform;
    },

    // Check if system audio capture is available (Windows optimized)
    isSystemAudioAvailable: async () => {
        try {
            const platform = process.platform;
            console.log('Checking system audio availability on platform:', platform);
            
            // Test if getDisplayMedia is available in the renderer context
            if (typeof navigator !== 'undefined' && 
                navigator.mediaDevices && 
                typeof navigator.mediaDevices.getDisplayMedia === 'function') {
                
                if (platform === 'win32') {
                    console.log('Windows platform - system audio should be available');
                    return true;
                } else {
                    console.log('Non-Windows platform - system audio may have limitations');
                    return true; // Still return true but with caveats
                }
            }
            console.log('getDisplayMedia not available');
            return false;
        } catch (error) {
            console.error('System audio not available:', error);
            return false;
        }
    },

    // Note: detectSystemAudio is now handled directly in the renderer
    // because navigator.mediaDevices.getDisplayMedia must be called from renderer context
    // This function is kept for backward compatibility but will throw an informative error
    detectSystemAudio: async () => {
        throw new Error('detectSystemAudio must be called directly from renderer using navigator.mediaDevices.getDisplayMedia');
    },

    // Get system audio stream (for actual capture)
    getSystemAudioStream: async () => {
        try {
            if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('getDisplayMedia not available in this context');
            }
            
            console.log('Requesting system audio stream for capture...');
            
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100,
                    channelCount: 2,
                },
                video: false
            });
            
            console.log('System audio stream obtained for capture');
            console.log('Audio tracks:', stream.getAudioTracks().length);
            
            // Log audio track details
            stream.getAudioTracks().forEach((track, index) => {
                console.log(`Audio track ${index}:`, {
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                    settings: track.getSettings(),
                    constraints: track.getConstraints()
                });
            });
            
            return stream;
        } catch (error) {
            console.error('Failed to get system audio stream:', error);
            throw error;
        }
    },

    // Stop system audio capture
    stopSystemAudioCapture: (stream) => {
        try {
            console.log('Stopping system audio capture...');
            
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped audio track:', track.label);
                });
            }
            
            console.log('System audio capture stopped');
        } catch (error) {
            console.error('Error stopping system audio capture:', error);
        }
    },

});
