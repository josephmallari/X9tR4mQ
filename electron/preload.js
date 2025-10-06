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

    // Detect system audio (without capturing)
    detectSystemAudio: async () => {
        try {
            console.log('Attempting to detect system audio...');
            
            if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('getDisplayMedia not available in this context');
            }
            
            // Request display media to trigger the handler
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: false
            });
            
            const audioTracks = stream.getAudioTracks();
            console.log('System audio detected:', audioTracks.length > 0);
            
            if (audioTracks.length > 0) {
                const track = audioTracks[0];
                console.log('Audio track details:', {
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                    settings: track.getSettings(),
                    constraints: track.getConstraints()
                });
            }
            
            // Stop the stream immediately since we're just detecting
            stream.getTracks().forEach(track => track.stop());
            
            return audioTracks.length > 0;
        } catch (error) {
            console.error('Failed to detect system audio:', error);
            return false;
        }
    },

    // Get system audio stream (for actual capture)
    getSystemAudioStream: async () => {
        try {
            if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('getDisplayMedia not available in this context');
            }
            
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
            return stream;
        } catch (error) {
            console.error('Failed to get system audio stream:', error);
            throw error;
        }
    }
});
