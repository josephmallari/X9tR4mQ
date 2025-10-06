import { contextBridge } from 'electron';

// Expose system audio detection capabilities to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Check if system audio capture is available
    isSystemAudioAvailable: async () => {
        try {
            // Test if getDisplayMedia is available
            if (typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
                console.log('getDisplayMedia not available');
                return false;
            }
            
            // Try to get system audio stream to test availability
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
            
            console.log('System audio stream obtained:', stream);
            console.log('Audio tracks:', stream.getAudioTracks());
            
            // Stop the test stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            return stream.getAudioTracks().length > 0;
        } catch (error) {
            console.error('System audio not available:', error);
            return false;
        }
    },

    // Detect system audio (without capturing)
    detectSystemAudio: async () => {
        try {
            console.log('Attempting to detect system audio...');
            
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
