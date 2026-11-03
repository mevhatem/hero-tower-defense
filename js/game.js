// 16-Bit Pixel Game Controller, Loop, HUD Updates, and Interactions

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Disable smoothing for razor-sharp 16-bit pixels!
        this.ctx.imageSmoothingEnabled = false;

        // Hardcore Balanced Game State
        this.lives = 20;
        this.gold = 130; // Starting gold: enough for only 1 initial tower!
        this.kills = 0;
        this.totalGoldEarned = 130;
        this.gameSpeed = 1;
        this.isPaused = false;
        this.gameOver = false;
        this.victory = false;

        // Managers & Entities (640x360 space)
        this.map = new GameMap(this.canvas.width, this.canvas.height);
        this.effects = new EffectsManager();
        this.waves = new WaveManager();
        this.hero = new Hero(320, 180);

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.peasants = [];
        this.lasers = [];

        this.selectedSpot = null;
        this.hoveredSpot = null;

        // Input
        this.input = {
            keys: {},
            mouseX: 0,
            mouseY: 0,
            mouseLeft: false,
            mouseRight: false,
            moveX: 0,
            moveY: 0,
            attackRequested: false,
            dashRequested: false,
            isTouchMode: false
        };

        // Cache DOM elements
        this.dom = {
            lives: document.getElementById('lives-display'),
            gold: document.getElementById('gold-display'),
            wave: document.getElementById('wave-display'),
            maxWave: document.getElementById('max-wave-display'),
            countdownBadge: document.getElementById('countdown-badge'),
            countdownText: document.getElementById('countdown-text'),
            nextWaveBtn: document.getElementById('next-wave-btn'),
            speedBtn: document.getElementById('speed-btn'),
            speedText: document.getElementById('speed-text'),
            soundBtn: document.getElementById('sound-btn'),
            soundIcon: document.getElementById('sound-icon'),
            mobileToggleBtn: document.getElementById('mobile-toggle-btn'),
            helpBtn: document.getElementById('help-btn'),
            heroLevel: document.getElementById('hero-level'),
            heroHpFill: document.getElementById('hero-hp-fill'),
            heroHpDisplay: document.getElementById('hero-hp-display'),
            heroXpFill: document.getElementById('hero-xp-fill'),
            heroDmg: document.getElementById('hero-dmg'),
            heroDashStatus: document.getElementById('hero-dash-status'),
            meteorBtn: document.getElementById('meteor-btn'),
            meteorCdOverlay: document.getElementById('meteor-cd-overlay'),
            meteorTimer: document.getElementById('meteor-timer'),
            peasantBtn: document.getElementById('peasant-btn'),
            peasantCdOverlay: document.getElementById('peasant-cd-overlay'),
            peasantTimer: document.getElementById('peasant-timer'),
            healBtn: document.getElementById('heal-btn'),
            healCdOverlay: document.getElementById('heal-cd-overlay'),
            healTimer: document.getElementById('heal-timer'),
            towerModal: document.getElementById('tower-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalContent: document.getElementById('modal-content'),
            modalCloseBtn: document.getElementById('modal-close-btn'),
            bossContainer: document.getElementById('boss-container'),
            bossName: document.getElementById('boss-name'),
            bossHpText: document.getElementById('boss-hp-text'),
            bossHpFill: document.getElementById('boss-hp-fill'),
            waveAnnouncement: document.getElementById('wave-announcement'),
            announcementTitle: document.getElementById('announcement-title'),
            announcementSubtitle: document.getElementById('announcement-subtitle'),
            helpModal: document.getElementById('help-modal'),
            helpCloseBtn: document.getElementById('help-close-btn'),
            gameOverModal: document.getElementById('game-over-modal'),
            endTitle: document.getElementById('end-title'),
            endMessage: document.getElementById('end-message'),
            endIcon: document.getElementById('end-icon'),
            endWaves: document.getElementById('end-waves'),
            endKills: document.getElementById('end-kills'),
            endGold: document.getElementById('end-gold'),
            restartBtn: document.getElementById('restart-btn'),
            // Mobile Touch Elements
            mobileControls: document.getElementById('mobile-controls'),
            joystickBase: document.getElementById('joystick-base'),
            joystickStick: document.getElementById('joystick-stick'),
            touchAttackBtn: document.getElementById('touch-attack-btn'),
            touchDashBtn: document.getElementById('touch-dash-btn'),
            touchMeteorBtn: document.getElementById('touch-meteor-btn'),
            touchPeasantBtn: document.getElementById('touch-peasant-btn'),
            touchHealBtn: document.getElementById('touch-heal-btn'),
            portraitAdvisory: document.getElementById('portrait-advisory')
        };

        this.lastTime = performance.now();
        this.setupEventListeners();
        this.setupMobileControls();

        window.onEnemyKilled = (enemy) => this.handleEnemyKilled(enemy);

        requestAnimationFrame((t) => this.loop(t));
    }

    setupEventListeners() {
        const updateMouseCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Scale mouse coords accurately from 1280x720 client to 640x360 canvas
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.input.mouseX = (e.clientX - rect.left) * scaleX;
            this.input.mouseY = (e.clientY - rect.top) * scaleY;
            this.hoveredSpot = this.map.getSpotAt(this.input.mouseX, this.input.mouseY);
        };

        window.addEventListener('mousemove', updateMouseCoords);

        window.addEventListener('mousedown', (e) => {
            sounds.init();
            if (e.target !== this.canvas) return;

            if (e.button === 0) {
                this.input.mouseLeft = true;
                this.handleClick(this.input.mouseX, this.input.mouseY);
            } else if (e.button === 2) {
                this.input.mouseRight = true;
                if (this.hero.isAimingMeteor || this.hero.isAimingPeasant) {
                    this.hero.isAimingMeteor = false;
                    this.hero.isAimingPeasant = false;
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.input.mouseLeft = false;
            if (e.button === 2) this.input.mouseRight = false;
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('keydown', (e) => {
            sounds.init();
            this.input.keys[e.code] = true;

            if (e.code === 'Escape') {
                this.closeTowerModal();
                this.hero.isAimingMeteor = false;
                this.hero.isAimingPeasant = false;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
        });

        // Top UI Controls
        this.dom.nextWaveBtn.addEventListener('click', () => {
            this.gold += 15;
            this.effects.addText("+15G ERKEN!", this.canvas.width / 2, 40, '#fde047', 10, 1.4);
            sounds.playCoin();
            this.triggerNextWave();
        });

        this.dom.speedBtn.addEventListener('click', () => {
            this.gameSpeed = (this.gameSpeed === 1) ? 2 : 1;
            this.dom.speedText.textContent = `${this.gameSpeed}X`;
            this.dom.speedBtn.classList.toggle('primary', this.gameSpeed === 2);
        });

        this.dom.soundBtn.addEventListener('click', () => {
            const isMuted = sounds.toggleMute();
            this.dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
        });

        this.dom.helpBtn.addEventListener('click', () => {
            this.dom.helpModal.classList.remove('hidden');
        });

        this.dom.helpCloseBtn.addEventListener('click', () => {
            this.dom.helpModal.classList.add('hidden');
        });

        this.dom.modalCloseBtn.addEventListener('click', () => {
            this.closeTowerModal();
        });

        // Ability Card Buttons
        this.dom.meteorBtn.addEventListener('click', () => {
            if (this.hero.meteorCooldown <= 0) {
                this.hero.isAimingMeteor = !this.hero.isAimingMeteor;
                this.hero.isAimingPeasant = false;
            }
        });

        this.dom.peasantBtn.addEventListener('click', () => {
            if (this.hero.peasantCooldown <= 0) {
                this.hero.isAimingPeasant = !this.hero.isAimingPeasant;
                this.hero.isAimingMeteor = false;
            }
        });

        this.dom.healBtn.addEventListener('click', () => {
            if (this.hero.healCooldown <= 0) {
                const allFriendlies = this.getAllFriendlies();
                this.hero.castHeal(allFriendlies, this.effects);
            }
        });

        this.dom.restartBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    enableMobileControls(force = null) {
        if (force !== null) {
            this.input.isTouchMode = force;
        } else {
            this.input.isTouchMode = !this.input.isTouchMode;
        }

        if (this.input.isTouchMode) {
            this.dom.mobileControls.classList.remove('hidden');
            if (this.dom.mobileToggleBtn) this.dom.mobileToggleBtn.classList.add('primary');
        } else {
            this.dom.mobileControls.classList.add('hidden');
            if (this.dom.mobileToggleBtn) this.dom.mobileToggleBtn.classList.remove('primary');
        }
    }

    setupMobileControls() {
        // Auto-detect touch device or small screen
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 900;
        if (isTouchDevice) {
            this.enableMobileControls(true);
        }

        // Toggle button in header
        if (this.dom.mobileToggleBtn) {
            this.dom.mobileToggleBtn.addEventListener('click', () => {
                this.enableMobileControls();
            });
        }

        // Check orientation for mobile
        const checkOrientation = () => {
            if (this.dom.portraitAdvisory) {
                if (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) {
                    this.dom.portraitAdvisory.classList.remove('hidden');
                } else {
                    this.dom.portraitAdvisory.classList.add('hidden');
                }
            }
        };
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation();

        // 1. Touch on Canvas (Aiming skills & Building Towers)
        const getCanvasTouchCoords = (touch) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
        };

        this.canvas.addEventListener('touchstart', (e) => {
            sounds.init();
            if (!this.input.isTouchMode) this.enableMobileControls(true);
            const touch = e.changedTouches[0];
            const coords = getCanvasTouchCoords(touch);
            this.input.mouseX = coords.x;
            this.input.mouseY = coords.y;

            if (this.hero.isAimingMeteor || this.hero.isAimingPeasant) {
                this.input.mouseLeft = true;
                e.preventDefault();
            } else {
                this.handleClick(coords.x, coords.y);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            const touch = e.changedTouches[0];
            const coords = getCanvasTouchCoords(touch);
            this.input.mouseX = coords.x;
            this.input.mouseY = coords.y;
            this.hoveredSpot = this.map.getSpotAt(coords.x, coords.y);
            if (this.hero.isAimingMeteor || this.hero.isAimingPeasant) {
                e.preventDefault();
            }
        }, { passive: false });

        // 2. Virtual Analog Joystick
        let joystickTouchId = null;
        let baseRect = null;
        const maxRadius = 38;

        const updateJoystick = (touch) => {
            if (!baseRect) baseRect = this.dom.joystickBase.getBoundingClientRect();
            const centerX = baseRect.left + baseRect.width / 2;
            const centerY = baseRect.top + baseRect.height / 2;
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            const dist = Math.hypot(dx, dy);

            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }

            this.dom.joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;

            // Deadzone of 6px
            if (dist > 6) {
                const normLen = Math.hypot(dx, dy);
                this.input.moveX = dx / normLen;
                this.input.moveY = dy / normLen;
                this.hero.angle = Math.atan2(dy, dx);
            } else {
                this.input.moveX = 0;
                this.input.moveY = 0;
            }
        };

        const resetJoystick = () => {
            joystickTouchId = null;
            this.input.moveX = 0;
            this.input.moveY = 0;
            this.dom.joystickStick.style.transform = 'translate(0px, 0px)';
        };

        this.dom.joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            sounds.init();
            const touch = e.changedTouches[0];
            joystickTouchId = touch.identifier;
            baseRect = this.dom.joystickBase.getBoundingClientRect();
            updateJoystick(touch);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (joystickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    updateJoystick(e.changedTouches[i]);
                    break;
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (joystickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    resetJoystick();
                    break;
                }
            }
        });

        window.addEventListener('touchcancel', (e) => {
            if (joystickTouchId !== null) resetJoystick();
        });

        // 3. Mobile Action Buttons
        if (this.dom.touchAttackBtn) {
            const handleAttackTouch = (e) => {
                e.preventDefault();
                sounds.init();
                this.input.attackRequested = true;
            };
            this.dom.touchAttackBtn.addEventListener('touchstart', handleAttackTouch, { passive: false });
            this.dom.touchAttackBtn.addEventListener('click', handleAttackTouch);
        }

        if (this.dom.touchDashBtn) {
            const handleDashTouch = (e) => {
                e.preventDefault();
                sounds.init();
                this.input.dashRequested = true;
            };
            this.dom.touchDashBtn.addEventListener('touchstart', handleDashTouch, { passive: false });
            this.dom.touchDashBtn.addEventListener('click', handleDashTouch);
        }

        if (this.dom.touchMeteorBtn) {
            this.dom.touchMeteorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.hero.meteorCooldown <= 0) {
                    this.hero.isAimingMeteor = !this.hero.isAimingMeteor;
                    this.hero.isAimingPeasant = false;
                }
            });
        }

        if (this.dom.touchPeasantBtn) {
            this.dom.touchPeasantBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.hero.peasantCooldown <= 0) {
                    this.hero.isAimingPeasant = !this.hero.isAimingPeasant;
                    this.hero.isAimingMeteor = false;
                }
            });
        }

        if (this.dom.touchHealBtn) {
            this.dom.touchHealBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.hero.healCooldown <= 0) {
                    this.hero.castHeal(this.getAllFriendlies(), this.effects);
                }
            });
        }
    }

    getAllFriendlies() {
        const list = [...this.peasants];
        this.towers.forEach(t => {
            if (t.soldierList) list.push(...t.soldierList);
        });
        return list;
    }

    handleClick(x, y) {
        if (this.hero.isAimingMeteor || this.hero.isAimingPeasant) {
            return;
        }

        const clickedSpot = this.map.getSpotAt(x, y);
        if (clickedSpot) {
            this.selectedSpot = clickedSpot;
            this.openTowerModal(clickedSpot);
        } else {
            if (this.selectedSpot) {
                this.closeTowerModal();
            }
        }
    }

    openTowerModal(spot) {
        this.dom.modalContent.innerHTML = '';
        this.dom.towerModal.classList.remove('hidden');

        // On mobile or small screens, center modal for effortless finger tapping
        if (this.input.isTouchMode || window.innerWidth <= 900) {
            this.dom.towerModal.style.left = '50%';
            this.dom.towerModal.style.top = '50%';
            this.dom.towerModal.style.transform = 'translate(-50%, -50%)';
        } else {
            this.dom.towerModal.style.transform = 'none';
            // Scale spot coordinates by 2 for the 1280x720 UI container!
            const modalW = 380;
            const modalH = 340;
            let left = (spot.x * 2) + 40;
            let top = (spot.y * 2) - 100;

            if (left + modalW > 1280) left = (spot.x * 2) - modalW - 20;
            if (top < 70) top = 70;
            if (top + modalH > 720) top = 720 - modalH - 20;

            this.dom.towerModal.style.left = `${left}px`;
            this.dom.towerModal.style.top = `${top}px`;
        }
        this.dom.towerModal.style.transform = 'none';

        if (!spot.tower) {
            this.dom.modalTitle.textContent = "KULE İNŞA ET";

            const options = [
                {
                    type: 'archer',
                    name: "Okçu Kulesi",
                    cost: 75,
                    icon: "🏹",
                    desc: "Uzaktan seri ok atar. Uçan ve hızlı hedeflere etkilidir."
                },
                {
                    type: 'barracks',
                    name: "Savaşçı Kışlası",
                    cost: 95,
                    icon: "⚔️",
                    desc: "Yola 2 kılıçlı savaşçı çıkarır, canavarları yolda tutar."
                },
                {
                    type: 'archer_barracks',
                    name: "Okçu Kulübesi",
                    cost: 90,
                    icon: "🎯",
                    desc: "Yola 3 menzilli Okçu çıkarır! Uçan ve yer hedeflerini oklarlar (Savaşçıdan 1 fazla!)."
                },
                {
                    type: 'bomber',
                    name: "Bombacı Kulesi",
                    cost: 110,
                    icon: "💣",
                    desc: "Havadan ağır bombalar atarak yerdeki zırhlı robot ve orkları ezer (Uçanlara vuramaz)."
                },
                {
                    type: 'mage',
                    name: "Büyücü Kulesi",
                    cost: 120,
                    icon: "🔮",
                    desc: "Zırhı delen ve yavaşlatan sihirli küreler fırlatır (Uçanlara vurur)."
                }
            ];

            options.forEach(opt => {
                const canAfford = this.gold >= opt.cost;
                const row = document.createElement('div');
                row.className = `tower-build-option ${canAfford ? '' : 'disabled'}`;
                row.innerHTML = `
                    <div class="option-icon">${opt.icon}</div>
                    <div class="option-details">
                        <div class="option-title">${opt.name}</div>
                        <div class="option-desc">${opt.desc}</div>
                        <div class="option-cost">${opt.cost} ALTIN (G)</div>
                    </div>
                `;

                if (canAfford) {
                    row.onclick = () => {
                        this.buildTower(spot, opt.type, opt.cost);
                        this.closeTowerModal();
                    };
                }
                this.dom.modalContent.appendChild(row);
            });

        } else {
            const tower = spot.tower;
            this.dom.modalTitle.textContent = `${tower.name} [LV.${tower.level}]`;

            if (tower.level < tower.maxLevel) {
                const canAfford = this.gold >= tower.upgradeCost;
                let nextPreview = "";
                if (tower.level === 1) {
                    nextPreview = "Lv 2: Bakır kaplamalar, boyu uzar, hasar ve menzil katlanır!";
                } else if (tower.level === 2) {
                    nextPreview = "Lv 3: Kraliyet taş surları, altın sancaklar, en yüksek güç!";
                }

                const upgRow = document.createElement('div');
                upgRow.className = `tower-upgrade-option ${canAfford ? '' : 'disabled'}`;
                upgRow.innerHTML = `
                    <div class="option-icon">⬆️</div>
                    <div class="option-details">
                        <div class="option-title">YÜKSELT (UPDATE)</div>
                        <div class="option-desc">${nextPreview}</div>
                        <div class="option-cost">${tower.upgradeCost} ALTIN (G)</div>
                    </div>
                `;

                if (canAfford) {
                    upgRow.onclick = () => {
                        this.gold -= tower.upgradeCost;
                        tower.totalInvested += tower.upgradeCost;
                        tower.upgrade();
                        this.effects.addText("GELİŞTİRİLDİ!", tower.x, tower.y - 18, '#fbbf24', 9, 1.4);
                        this.closeTowerModal();
                    };
                }
                this.dom.modalContent.appendChild(upgRow);
            } else {
                const maxRow = document.createElement('div');
                maxRow.className = "tower-build-option disabled";
                maxRow.innerHTML = `
                    <div class="option-icon">👑</div>
                    <div class="option-details">
                        <div class="option-title">MAKSİMUM SEVİYE!</div>
                        <div class="option-desc">Kule krallığın zirve gücüne ulaştı.</div>
                    </div>
                `;
                this.dom.modalContent.appendChild(maxRow);
            }

            const sellValue = tower.getSellValue();
            const actionRow = document.createElement('div');
            actionRow.className = 'action-row';
            actionRow.innerHTML = `
                <button class="pixel-btn btn-danger action-btn">
                    🗑️ YIK (+${sellValue}G)
                </button>
            `;
            actionRow.querySelector('button').onclick = () => {
                this.sellTower(spot, sellValue);
                this.closeTowerModal();
            };
            this.dom.modalContent.appendChild(actionRow);
        }
    }

    closeTowerModal() {
        this.dom.towerModal.classList.add('hidden');
        this.selectedSpot = null;
    }

    buildTower(spot, type, cost) {
        this.gold -= cost;
        let tower = null;

        if (type === 'archer') {
            tower = new ArcherTower(spot);
        } else if (type === 'barracks') {
            tower = new BarracksTower(spot);
        } else if (type === 'archer_barracks') {
            tower = new ArcherBarracksTower(spot);
        } else if (type === 'bomber') {
            tower = new BomberTower(spot);
        } else if (type === 'mage') {
            tower = new MageTower(spot);
        }

        spot.tower = tower;
        this.towers.push(tower);
        sounds.playBuild();
        this.effects.spawnSparks(spot.x, spot.y, '#fbbf24', 8);
        this.effects.addText("DİKİLDİ!", spot.x, spot.y - 14, '#4ade80', 9);
    }

    sellTower(spot, refund) {
        if (!spot.tower) return;
        this.gold += refund;

        if (spot.tower.soldierList) {
            spot.tower.soldierList.forEach(s => s.die(this.effects));
        }

        this.towers = this.towers.filter(t => t !== spot.tower);
        spot.tower = null;
        sounds.playCoin();
        this.effects.addText(`+${refund}G`, spot.x, spot.y - 12, '#fde047', 9);
    }

    triggerNextWave() {
        const waveData = this.waves.startNextWave();
        if (waveData) {
            sounds.playLevelUp();
            this.showAnnouncement(waveData.title, waveData.subtitle);
            this.dom.nextWaveBtn.disabled = true;
            this.dom.nextWaveBtn.style.opacity = '0.5';
        }
    }

    showAnnouncement(title, subtitle) {
        this.dom.announcementTitle.textContent = title;
        this.dom.announcementSubtitle.textContent = subtitle;
        this.dom.waveAnnouncement.classList.remove('hidden');

        this.dom.waveAnnouncement.style.animation = 'none';
        void this.dom.waveAnnouncement.offsetHeight;
        this.dom.waveAnnouncement.style.animation = null;

        setTimeout(() => {
            this.dom.waveAnnouncement.classList.add('hidden');
        }, 2600);
    }

    handleEnemyKilled(enemy) {
        this.gold += enemy.goldReward;
        this.totalGoldEarned += enemy.goldReward;
        this.kills++;
        this.hero.addXp(enemy.xpReward, this.effects);
    }

    update(dt) {
        if (this.gameOver || this.victory) return;

        const effectiveDt = dt * this.gameSpeed;

        // 1. Waves update with Auto-Start callback
        this.waves.update(effectiveDt, this.map.path, this.enemies, () => {
            this.triggerNextWave();
        });

        if (this.waves.waveCompleted && this.enemies.length === 0) {
            this.waves.waveCompleted = false;
            this.dom.nextWaveBtn.disabled = false;
            this.dom.nextWaveBtn.style.opacity = '1';

            if (this.waves.currentWave >= this.waves.maxWave) {
                this.onVictory();
                return;
            }
        }

        const allFriendlies = this.getAllFriendlies();

        // 2. Hero update
        this.hero.update(effectiveDt, this.input, this.effects, this.enemies, allFriendlies, {
            width: this.canvas.width,
            height: this.canvas.height
        }, this.peasants);

        // 3. Peasants update
        this.peasants = this.peasants.filter(p => !p.dead);
        this.peasants.forEach(p => p.update(effectiveDt, this.enemies, this.effects));

        // 4. Towers update
        this.towers.forEach(t => {
            t.update(effectiveDt, this.enemies, this.projectiles, this.effects);
        });

        // 5. Projectiles update
        this.projectiles = this.projectiles.filter(p => {
            if (p instanceof Arrow) return p.update(effectiveDt, this.effects);
            if (p instanceof CannonBomb) return p.update(effectiveDt, this.enemies, this.effects);
            if (p instanceof MagicOrb) return p.update(effectiveDt, this.enemies, this.effects);
            return false;
        });

        // 6. Lasers update
        this.lasers = this.lasers.filter(l => l.update(effectiveDt));

        // 7. Enemies update
        const currentEnemies = [...this.enemies];
        currentEnemies.forEach(e => {
            e.update(effectiveDt, this.hero, allFriendlies, this.effects, this.lasers, this.enemies);
            if (e.reachedEnd) {
                this.lives = Math.max(0, this.lives - (e.isBoss ? 5 : 1));
                this.effects.shake(4, 0.25);
                sounds.playHit();
                this.effects.addText(e.isBoss ? "-5 CAN!" : "-1 CAN!", 610, 155, '#ef4444', 10, 1.5);
            }
        });

        this.enemies = this.enemies.filter(e => !e.dead && !e.reachedEnd);

        if (this.lives <= 0) {
            this.onGameOver();
            return;
        }

        // 8. Effects update
        this.effects.update(effectiveDt);

        // 9. Update HUD UI
        this.updateHUD();
    }

    updateHUD() {
        this.dom.lives.textContent = this.lives;
        this.dom.gold.textContent = this.gold;
        this.dom.wave.textContent = this.waves.currentWave;
        this.dom.maxWave.textContent = this.waves.maxWave;

        if (!this.waves.waveActive && this.waves.currentWave < this.waves.maxWave) {
            this.dom.countdownBadge.classList.remove('hidden');
            this.dom.countdownText.textContent = `${Math.ceil(this.waves.autoStartTimer)}s`;
        } else {
            this.dom.countdownBadge.classList.add('hidden');
        }

        // Hero Stats
        this.dom.heroLevel.textContent = this.hero.level;
        this.dom.heroHpDisplay.textContent = `${Math.ceil(this.hero.hp)}/${this.hero.maxHp}`;
        this.dom.heroHpFill.style.width = `${Math.max(0, (this.hero.hp / this.hero.maxHp) * 100)}%`;

        const xpPct = Math.min(100, (this.hero.xp / this.hero.xpNeeded) * 100);
        this.dom.heroXpFill.style.width = `${xpPct}%`;
        this.dom.heroDmg.textContent = this.hero.damage;

        if (this.hero.dashCooldown <= 0) {
            this.dom.heroDashStatus.textContent = "HAZIR";
            this.dom.heroDashStatus.style.color = "#4ade80";
        } else {
            this.dom.heroDashStatus.textContent = `${this.hero.dashCooldown.toFixed(1)}s`;
            this.dom.heroDashStatus.style.color = "#f87171";
        }

        // Skill 1: Meteor
        if (this.hero.meteorCooldown <= 0) {
            this.dom.meteorBtn.classList.add('ready');
            this.dom.meteorBtn.classList.remove('cooling');
            this.dom.meteorCdOverlay.style.height = '0%';
            this.dom.meteorTimer.textContent = "HAZIR";
            this.dom.meteorBtn.classList.toggle('target-mode', this.hero.isAimingMeteor);
        } else {
            this.dom.meteorBtn.classList.remove('ready', 'target-mode');
            this.dom.meteorBtn.classList.add('cooling');
            const pct = (this.hero.meteorCooldown / this.hero.meteorInterval) * 100;
            this.dom.meteorCdOverlay.style.height = `${pct}%`;
            this.dom.meteorTimer.textContent = `${Math.ceil(this.hero.meteorCooldown)}s`;
        }

        // Skill 2: Peasant Summon
        if (this.hero.peasantCooldown <= 0) {
            this.dom.peasantBtn.classList.add('ready');
            this.dom.peasantBtn.classList.remove('cooling');
            this.dom.peasantCdOverlay.style.height = '0%';
            this.dom.peasantTimer.textContent = "HAZIR";
            this.dom.peasantBtn.classList.toggle('target-mode', this.hero.isAimingPeasant);
        } else {
            this.dom.peasantBtn.classList.remove('ready', 'target-mode');
            this.dom.peasantBtn.classList.add('cooling');
            const pct = (this.hero.peasantCooldown / this.hero.peasantInterval) * 100;
            this.dom.peasantCdOverlay.style.height = `${pct}%`;
            this.dom.peasantTimer.textContent = `${Math.ceil(this.hero.peasantCooldown)}s`;
        }

        // Skill 3: Heal
        if (this.hero.healCooldown <= 0) {
            this.dom.healBtn.classList.add('ready');
            this.dom.healBtn.classList.remove('cooling');
            this.dom.healCdOverlay.style.height = '0%';
            this.dom.healTimer.textContent = "HAZIR";
        } else {
            this.dom.healBtn.classList.remove('ready');
            this.dom.healBtn.classList.add('cooling');
            const pct = (this.hero.healCooldown / this.hero.healInterval) * 100;
            this.dom.healCdOverlay.style.height = `${pct}%`;
            this.dom.healTimer.textContent = `${Math.ceil(this.hero.healCooldown)}s`;
        }

        // Mobile Skill Action Buttons State
        if (this.dom.touchMeteorBtn) {
            this.dom.touchMeteorBtn.classList.toggle('active-target', this.hero.isAimingMeteor);
            this.dom.touchMeteorBtn.style.opacity = (this.hero.meteorCooldown <= 0) ? '1' : '0.5';
        }
        if (this.dom.touchPeasantBtn) {
            this.dom.touchPeasantBtn.classList.toggle('active-target', this.hero.isAimingPeasant);
            this.dom.touchPeasantBtn.style.opacity = (this.hero.peasantCooldown <= 0) ? '1' : '0.5';
        }
        if (this.dom.touchHealBtn) {
            this.dom.touchHealBtn.style.opacity = (this.hero.healCooldown <= 0) ? '1' : '0.5';
        }
        if (this.dom.touchDashBtn) {
            this.dom.touchDashBtn.style.opacity = (this.hero.dashCooldown <= 0) ? '1' : '0.6';
        }

        // Boss Bar
        const boss = this.enemies.find(e => e.isBoss);
        if (boss) {
            this.dom.bossContainer.classList.remove('hidden');
            this.dom.bossName.textContent = boss.name;
            this.dom.bossHpText.textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
            this.dom.bossHpFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
        } else {
            this.dom.bossContainer.classList.add('hidden');
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.effects.applyShake(this.ctx);

        // 1. Map & Sockets
        this.map.draw(this.ctx, this.hoveredSpot);

        // 2. Decals & Scorch marks
        this.effects.drawDecals(this.ctx);

        // 3. Towers & Soldiers
        this.towers.forEach(t => {
            const isSelected = (this.selectedSpot && this.selectedSpot.tower === t);
            t.draw(this.ctx, isSelected);
        });

        // 4. Peasants
        this.peasants.forEach(p => p.draw(this.ctx));

        // 5. Enemies
        this.enemies.forEach(e => e.draw(this.ctx));

        // 6. Alien Laser Beams
        this.lasers.forEach(l => l.draw(this.ctx));

        // 7. Hero
        this.hero.draw(this.ctx);

        // 8. Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));

        // 9. Effects & Particles
        this.effects.draw(this.ctx);

        // 10. Targeting reticles
        if (this.hero.isAimingMeteor) {
            this.drawMeteorReticle(this.ctx, this.input.mouseX, this.input.mouseY);
        } else if (this.hero.isAimingPeasant) {
            this.drawPeasantReticle(this.ctx, this.input.mouseX, this.input.mouseY);
        }

        this.ctx.restore();
    }

    drawMeteorReticle(ctx, x, y) {
        ctx.save();
        const rx = Math.round(x);
        const ry = Math.round(y);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx - 55, ry - 55, 110, 110);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(rx - 55, ry - 55, 110, 110);

        ctx.fillStyle = '#fee2e2';
        ctx.font = 'bold 8px Silkscreen, monospace';
        ctx.textAlign = 'center';
        ctx.fillText("GÖKTAŞI İNDİR [TIKLA]", rx, ry - 60);
        ctx.restore();
    }

    drawPeasantReticle(ctx, x, y) {
        ctx.save();
        const rx = Math.round(x);
        const ry = Math.round(y);

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx - 25, ry - 25, 50, 50);

        ctx.fillStyle = 'rgba(253, 224, 71, 0.2)';
        ctx.fillRect(rx - 25, ry - 25, 50, 50);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 8px Silkscreen, monospace';
        ctx.textAlign = 'center';
        ctx.fillText("2 KÖYLÜ ÇAĞIR [TIKLA]", rx, ry - 30);
        ctx.restore();
    }

    onGameOver() {
        this.gameOver = true;
        this.dom.endTitle.textContent = "SAVUNMA ÇÖKTÜ!";
        this.dom.endTitle.style.color = "#ef4444";
        this.dom.endIcon.textContent = "💀";
        this.dom.endMessage.textContent = "Canavarlar krallığın savunma hattını aştı...";
        this.dom.endWaves.textContent = `${this.waves.currentWave} / ${this.waves.maxWave}`;
        this.dom.endKills.textContent = this.kills;
        this.dom.endGold.textContent = `${this.totalGoldEarned}G`;
        this.dom.gameOverModal.classList.remove('hidden');
    }

    onVictory() {
        this.victory = true;
        sounds.playLevelUp();
        this.dom.endTitle.textContent = "ZAFER BİZİMDİR!";
        this.dom.endTitle.style.color = "#fbbf24";
        this.dom.endIcon.textContent = "🏆";
        this.dom.endMessage.textContent = "Tüm 10 zorlu dalgayı, robotları, lazerli uzaylıları ve Kara Ork Efendisi'ni yendin!";
        this.dom.endWaves.textContent = "10/10 TAMAMLANDI!";
        this.dom.endKills.textContent = this.kills;
        this.dom.endGold.textContent = `${this.totalGoldEarned}G`;
        this.dom.gameOverModal.classList.remove('hidden');
    }

    loop(timestamp) {
        // Unconditionally request next frame first so an unexpected exception can never freeze the loop
        requestAnimationFrame((t) => this.loop(t));

        try {
            const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
            this.lastTime = timestamp;

            this.update(dt);
            this.render();
        } catch (err) {
            console.error("Game loop error:", err);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
