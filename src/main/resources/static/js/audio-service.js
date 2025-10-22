class AudioService {
    constructor() {
        this.audioEnabled = false;
        this.audioContext = null;
        this.sounds = CONFIG.SOUNDS;
    }

    testSoundFiles() {
        console.log('=== TESTING SOUND FILES ===');
        
        Object.entries(this.sounds).forEach(([soundType, soundPath]) => {
            fetch(soundPath, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        console.log('FOUND: ' + soundPath);
                    } else {
                        console.error('NOT FOUND (' + response.status + '): ' + soundPath);
                    }
                })
                .catch(error => {
                    console.error('ERROR accessing: ' + soundPath, error);
                });
        });
    }

    enableAudio() {
        if (this.audioEnabled) {
            console.log('Audio already enabled');
            return;
        }
        
        console.log('Enabling audio system...');
        
        const silentAudio = new Audio();
        silentAudio.volume = 0.001;
        silentAudio.src = '/sounds/ticket-notif.mp3';
        
        const playPromise = silentAudio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    silentAudio.pause();
                    silentAudio.currentTime = 0;
                    this.audioEnabled = true;
                    console.log('Audio system ENABLED!');
                    this.showAudioEnabledMessage();
                    
                    setTimeout(() => {
                        console.log('Testing sound playback...');
                        this.playTestSound();
                    }, 300);
                })
                .catch(error => {
                    console.error('Failed to enable audio:', error);
                    this.attemptAlternativeAudioEnable();
                });
        }
    }

    attemptAlternativeAudioEnable() {
        console.log('Trying alternative audio enable...');
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 1;
            gainNode.gain.value = 0.001;
            oscillator.type = 'sine';
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.01);
            
            this.audioEnabled = true;
            console.log('Audio enabled via Web Audio API');
            this.showAudioEnabledMessage();
            
        } catch (error) {
            console.error('All audio enable methods failed:', error);
            this.audioEnabled = true;
            console.log('Audio marked as enabled (last resort)');
        }
    }

    showAudioEnabledMessage() {
        const msg = document.createElement('div');
        msg.textContent = 'Sound Enabled!';
        msg.style.cssText = 'position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:10px 20px;border-radius:5px;z-index:10000;font-family:Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }

    playTestSound() {
        console.log('Playing test sound...');
        this.playNotificationSound('success', true);
    }

    playNotificationSound(soundType = 'info', isTest = false) {
        if (!this.audioEnabled) {
            if (!isTest) {
                console.warn('Audio not enabled yet - need user interaction');
                this.showAudioEnablePrompt();
            }
            return;
        }

        const soundPath = this.sounds[soundType] || this.sounds['info'];
        
        if (isTest) {
            console.log('Testing sound: ' + soundType + ' -> ' + soundPath);
        }

        const audio = new Audio(soundPath);
        audio.volume = 0.7;
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Sound playing: ' + soundType);
                    audio.addEventListener('ended', () => {
                        audio.remove();
                    });
                })
                .catch(playError => {
                    console.error('Play failed:', playError);
                    if (playError.name === 'NotAllowedError') {
                        console.warn('Autoplay blocked - user needs to interact with page first');
                        this.showAutoplayBlockedMessage();
                    }
                });
        }
    }

    showAudioEnablePrompt() {
        const existingPrompt = document.querySelector('.audio-prompt');
        if (existingPrompt) existingPrompt.remove();
        
        const msg = document.createElement('div');
        msg.className = 'audio-prompt';
        msg.textContent = 'Click anywhere to enable sounds';
        msg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ffc107;color:black;padding:10px 20px;border-radius:5px;z-index:10000;font-family:Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;';
        
        msg.addEventListener('click', () => this.enableAudio());
        document.body.appendChild(msg);
        
        setTimeout(() => {
            if (msg.parentNode) {
                msg.remove();
            }
        }, 5000);
    }

    showAutoplayBlockedMessage() {
        const msg = document.createElement('div');
        msg.innerHTML = 'Click to allow sounds<br><small>Browser requires interaction</small>';
        msg.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#dc3545;color:white;padding:10px 15px;border-radius:5px;z-index:10000;font-family:Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;text-align:center;';
        
        msg.addEventListener('click', () => {
            this.enableAudio();
            msg.remove();
        });
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            if (msg.parentNode) {
                msg.remove();
            }
        }, 5000);
    }
}