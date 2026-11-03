// Enhanced Web Audio API Synthesizer with Cached Buffers, Auto-Resume & Crash-Proof Error Guards

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
        this.masterGain = null;
        this.cachedNoiseBuffer = null;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.ctx = new AudioContext();

            // Pre-generate reusable noise buffer for explosions (avoids heavy GC allocations during combat)
            const sampleRate = this.ctx.sampleRate || 44100;
            const bufferSize = Math.floor(sampleRate * 0.35);
            this.cachedNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
            const data = this.cachedNoiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
            }

            // Master compressor to keep sound punchy and prevent clipping
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
        } catch (e) {
            console.warn("AudioContext init error:", e);
        }
    }

    safePlay(soundFn) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            soundFn();
        } catch (err) {
            // Audio error should NEVER freeze the game!
            console.warn("Audio playback guarded:", err);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime);
            } catch (e) {}
        }
        return this.muted;
    }

    getDest() {
        return this.compressor || (this.ctx ? this.ctx.destination : null);
    }

    // Heavy sword slash whoosh
    playSwordSwing() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(380 + Math.random() * 50, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.16);
            filter.Q.setValueAtTime(2.5, now);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.getDest());

            osc.start(now);
            osc.stop(now + 0.17);
        });
    }

    // Visceral hit with low punch
    playHit() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.13);
        });
    }

    // Alien Laser Gun (Pew!)
    playLaser() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.getDest());

            osc.start(now);
            osc.stop(now + 0.19);
        });
    }

    // Cannon / Bomb Launch
    playBombLaunch() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.21);
        });
    }

    // Heavy Bomb & Meteor Explosion (Uses cached noise buffer)
    playBombExplode() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;

            // Deep sub rumble
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(150, now);
            sub.frequency.exponentialRampToValueAtTime(25, now + 0.45);

            subGain.gain.setValueAtTime(0.6, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            sub.connect(subGain);
            subGain.connect(this.getDest());
            sub.start(now);
            sub.stop(now + 0.46);

            // Fiery noise blast from cached buffer
            if (this.cachedNoiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.cachedNoiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(750, now);
                filter.frequency.exponentialRampToValueAtTime(90, now + 0.35);

                const nGain = this.ctx.createGain();
                nGain.gain.setValueAtTime(0.45, now);
                nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

                noise.connect(filter);
                filter.connect(nGain);
                nGain.connect(this.getDest());
                noise.start(now);
                noise.stop(now + 0.36);
            }
        });
    }

    // Arrow shoot twang
    playArrowShot() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(280, now + 0.09);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.1);
        });
    }

    // Peasant Rally Shout
    playPeasantSpawn() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            [280, 350, 420].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + i * 0.06);
                gain.gain.setValueAtTime(0.18, now + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.22);
                osc.connect(gain);
                gain.connect(this.getDest());
                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 0.23);
            });
        });
    }

    // Gold coin ding
    playCoin() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1046.50, now);
            osc.frequency.setValueAtTime(1567.98, now + 0.05);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.33);
        });
    }

    // Tower build clank
    playBuild() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            [0, 0.07, 0.14].forEach((d, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(180 + i * 70, now + d);
                osc.frequency.exponentialRampToValueAtTime(50, now + d + 0.06);
                gain.gain.setValueAtTime(0.18, now + d);
                gain.gain.exponentialRampToValueAtTime(0.01, now + d + 0.06);
                osc.connect(gain);
                gain.connect(this.getDest());
                osc.start(now + d);
                osc.stop(now + d + 0.07);
            });
        });
    }

    // Upgrade Fanfare
    playUpgrade() {
        this.safePlay(() => {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
                osc.connect(gain);
                gain.connect(this.getDest());
                osc.start(now);
                osc.stop(now + 0.26);
            });
        });
    }

    // Meteor Falling Whistle & Rumble
    playMeteorWhistle() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(850, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.55);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.56);
        });
    }

    // Meteor huge explosion
    playExplosion() {
        this.playBombExplode();
    }

    // Hero Dash
    playDash() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.13);
        });
    }

    // Hero Level Up
    playLevelUp() {
        this.safePlay(() => {
            const notes = [440, 554, 659, 880, 1108];
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
                osc.connect(gain);
                gain.connect(this.getDest());
                osc.start(now);
                osc.stop(now + 0.31);
            });
        });
    }

    // Holy Heal
    playHeal() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const notes = [392, 493.88, 587.33, 783.99];
            notes.forEach((freq, idx) => {
                const t = now + idx * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.005, t + 0.28);
                osc.connect(gain);
                gain.connect(this.getDest());
                osc.start(t);
                osc.stop(t + 0.29);
            });
        });
    }

    // Shield shattered sound
    playShieldBreak() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(620, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.23);
        });
    }

    // Drone spawn mechanical chirp
    playDroneSpawn() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(750, now + 0.05);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.16);
        });
    }

    // Alien Quantum Blink
    playBlink() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.18);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.19);
        });
    }

    // Treant Root / Creeping Vines
    playRoot() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.26);
        });
    }

    // Wing flap whoosh for flying enemies
    playWingFlap() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.13);
        });
    }

    // Shaman Heal / Buff Chime
    playShamanCast() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const notes = [440, 554, 659, 880];
            notes.forEach((freq, idx) => {
                const t = now + idx * 0.05;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.005, t + 0.18);
                osc.connect(gain);
                gain.connect(this.getDest());
                osc.start(t);
                osc.stop(t + 0.19);
            });
        });
    }

    // Fast light bow twang for archer garrison
    playCrossbow() {
        this.safePlay(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800 + Math.random() * 80, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
            osc.connect(gain);
            gain.connect(this.getDest());
            osc.start(now);
            osc.stop(now + 0.09);
        });
    }
}

const sounds = new SoundManager();
