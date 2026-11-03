// Hardcore 16-Bit Pixel Wave Definitions, Balanced AI Compositions & Auto Spawner
// Features: Ground & Flying Enemies, Shamans, Fire Drakes, Wyvern Sky Boss & Dark Overlord

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.maxWave = 10;
        this.waveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveCompleted = false;

        this.autoStartDelay = 7.0;
        this.autoStartTimer = 4.0;
        this.autoStartActive = true;

        this.waveDefinitions = [
            // Wave 1: Shielded Orcs & Sprinting Wolves (Ground Only)
            {
                title: "DALGA 1: KALKANLI ORK ALAYI & HIZLI KURTLAR",
                subtitle: "Orkların kalkanı var! Kurtlar ise çok hızlı koşar! Kahramanınla yolu tut!",
                enemies: [
                    { type: 'wolf', count: 5, interval: 0.9 },
                    { type: 'orc', count: 8, interval: 0.8 },
                    { type: 'treant', count: 3, interval: 1.5 }
                ]
            },
            // Wave 2: Gnarled Treants & Shadow Pack (Ground Only - Build Gold!)
            {
                title: "DALGA 2: KÖK SALAN AĞAÇLAR VE GÖLGE SÜRÜSÜ",
                subtitle: "Ağaç canavarları can yeniler! Altınını biriktir ve savunma hattını güçlendir!",
                enemies: [
                    { type: 'wolf', count: 8, interval: 0.7 },
                    { type: 'treant', count: 5, interval: 1.3 },
                    { type: 'orc', count: 9, interval: 0.8 }
                ]
            },
            // Wave 3: Heavy Robots Spawning Nano-Drones (Ground Only - Prepare for Air!)
            {
                title: "DALGA 3: ÇELİK BİÇİCİLER & NANO-DRONE TEHLİKESİ",
                subtitle: "Robotlar ilerlerken arkalarından dronelar fırlatır! Gelecek dalga için hava savunması hazırla!",
                enemies: [
                    { type: 'robot', count: 7, interval: 1.1 },
                    { type: 'treant', count: 5, interval: 1.2 },
                    { type: 'orc', count: 10, interval: 0.7 },
                    { type: 'wolf', count: 6, interval: 0.6 }
                ]
            },
            // Wave 4: First Airborne Wave! Flying Bats & Orc Shamans
            {
                title: "DALGA 4: GÖKYÜZÜ TEHLİKESİ - GÖLGE YARASALARI!",
                subtitle: "Yarasalar havadan süzülüyor! Savaşçılar ve bombalar havaya vuramaz; Okçu ve Büyücü Kuleleri şart!",
                enemies: [
                    { type: 'bat', count: 7, interval: 0.9 },
                    { type: 'shaman', count: 3, interval: 2.2 },
                    { type: 'alien', count: 8, interval: 0.8 },
                    { type: 'robot', count: 6, interval: 1.0 }
                ]
            },
            // Wave 5: MINI-BOSS - ORK KUMANDANI (Warcry) + Bats + Heavy Siege
            {
                title: "DALGA 5: ORK KUMANDANI & HAVA KORUMALARI",
                subtitle: "Kumandan savaş narası atar! Yarasalar havadan kaleyi aşmaya çalışır! Meteorunu [Q] kullan!",
                enemies: [
                    { type: 'bat', count: 10, interval: 0.5 },
                    { type: 'boss_mini', count: 1, interval: 2.5 },
                    { type: 'shaman', count: 2, interval: 2.0 },
                    { type: 'alien', count: 8, interval: 0.7 },
                    { type: 'robot', count: 6, interval: 0.9 }
                ]
            },
            // Wave 6: Fire Drakes (Flying & Spitting Fireballs!)
            {
                title: "DALGA 6: KANATLI ALEV WYVERN'LERİ!",
                subtitle: "Alev ejdercikleri havadan uçup aşağıya ateş püskürtür! Okçularını ve büyücülerini hazırla!",
                enemies: [
                    { type: 'drake', count: 5, interval: 1.4 },
                    { type: 'bat', count: 10, interval: 0.5 },
                    { type: 'robot', count: 8, interval: 0.8 },
                    { type: 'treant', count: 6, interval: 1.0 }
                ]
            },
            // Wave 7: SKY BOSS - GÖK KORSANI WYVERN (Uçan Boss!)
            {
                title: "DALGA 7: GÖK KORSANI WYVERN (HAVA PATRONU)!",
                subtitle: "Devasa alev ejderhası göklerden saldırıyor! Yer savaşçıları ona erişemez; okçular ve büyücüler hedefe kilitlensin!",
                enemies: [
                    { type: 'bat', count: 8, interval: 0.5 },
                    { type: 'boss_sky', count: 1, interval: 2.5 },
                    { type: 'drake', count: 4, interval: 1.2 },
                    { type: 'shaman', count: 3, interval: 1.8 },
                    { type: 'alien', count: 10, interval: 0.6 }
                ]
            },
            // Wave 8: Quad-Alliance Airborne & Armored Siege
            {
                title: "DALGA 8: KARADAN VE HAVADAN TOPYEKÜN SALDIRI",
                subtitle: "Yarasalar, ejdercikler, şamanlar ve kalkanlı orklar topyekün taarruzda!",
                enemies: [
                    { type: 'drake', count: 7, interval: 1.1 },
                    { type: 'bat', count: 12, interval: 0.4 },
                    { type: 'shaman', count: 4, interval: 1.5 },
                    { type: 'robot', count: 9, interval: 0.7 },
                    { type: 'orc', count: 12, interval: 0.5 }
                ]
            },
            // Wave 9: Pre-Apocalyptic Sky Firestorm
            {
                title: "DALGA 9: GÖKYÜZÜ ALEV FIRTINASI",
                subtitle: "Son savunma hattı çatırdıyor! Uçan ejderler ve lazer timi kaleye doğru hücum ediyor!",
                enemies: [
                    { type: 'drake', count: 9, interval: 0.9 },
                    { type: 'bat', count: 14, interval: 0.35 },
                    { type: 'alien', count: 14, interval: 0.5 },
                    { type: 'robot', count: 11, interval: 0.6 },
                    { type: 'treant', count: 8, interval: 0.8 }
                ]
            },
            // Wave 10: Final Dual-Threat Boss - KARA ORK EFENDİSİ & GÖK EJDERLERİ
            {
                title: "DALGA 10: KARA ORK EFENDİSİ VE GÖK ORDUSU (FİNAL)",
                subtitle: "Yürüyen Deprem Lordu yerleri titretirken, başının üstünde Wyvernler krallığa ölüm saçıyor! Zafer ya da ölüm!",
                enemies: [
                    { type: 'drake', count: 7, interval: 0.9 },
                    { type: 'bat', count: 12, interval: 0.4 },
                    { type: 'boss_final', count: 1, interval: 2.5 },
                    { type: 'shaman', count: 4, interval: 1.4 },
                    { type: 'alien', count: 14, interval: 0.5 },
                    { type: 'robot', count: 10, interval: 0.6 },
                    { type: 'treant', count: 9, interval: 0.8 }
                ]
            }
        ];
    }

    startNextWave() {
        if (this.currentWave >= this.maxWave) return null;
        this.currentWave++;
        this.waveActive = true;
        this.waveCompleted = false;
        this.autoStartActive = false;

        const waveData = this.waveDefinitions[this.currentWave - 1];
        this.spawnQueue = [];

        for (let group of waveData.enemies) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    delay: group.interval
                });
            }
        }

        this.spawnTimer = 0.4;
        return waveData;
    }

    update(dt, mapPath, activeEnemies, onAutoStartCallback) {
        if (!this.waveActive && this.currentWave < this.maxWave) {
            this.autoStartTimer -= dt;
            if (this.autoStartTimer <= 0) {
                this.autoStartTimer = this.autoStartDelay;
                if (onAutoStartCallback) {
                    onAutoStartCallback();
                }
            }
        }

        if (!this.waveActive) return;

        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                const nextEnemyData = this.spawnQueue.shift();
                this.spawnTimer = nextEnemyData.delay;
                const enemy = this.createEnemy(nextEnemyData.type, mapPath);
                activeEnemies.push(enemy);
            }
        } else {
            if (activeEnemies.length === 0) {
                this.waveActive = false;
                this.waveCompleted = true;
                this.autoStartTimer = this.autoStartDelay;
                this.autoStartActive = true;
            }
        }
    }

    createEnemy(type, mapPath) {
        let config = {};
        const waveScale = this.currentWave;
        config.waveScale = waveScale;

        if (type === 'orc') {
            config = {
                name: "Ork Savaşçı",
                type: 'orc',
                hp: 280 + (waveScale * 65),
                shield: 160 + (waveScale * 45), // Tough front shield!
                speed: 42,
                damage: 26 + (waveScale * 3),
                attackRate: 0.9,
                gold: 4,
                xp: 22,
                radius: 9
            };
        } else if (type === 'treant') {
            config = {
                name: "Korkunç Ağaç Canavarı",
                type: 'treant',
                hp: 580 + (waveScale * 110),
                speed: 24, // Slow, towering lumberer
                damage: 42 + (waveScale * 4),
                attackRate: 1.25,
                armorPhysical: 0.45, // 45% arrow resistance!
                regenRate: 20 + (waveScale * 3), // Constant health regeneration
                gold: 8,
                xp: 38,
                radius: 12
            };
        } else if (type === 'robot') {
            config = {
                name: "Çelik Biçici Robot",
                type: 'robot',
                hp: 440 + (waveScale * 80),
                speed: 32, // Heavy tank
                damage: 32 + (waveScale * 3),
                attackRate: 0.85,
                armorPhysical: 0.40, // 40% arrow resistance!
                isSpawner: true, // Spawns kamikaze mini-bots every 5.2s!
                gold: 6,
                xp: 32,
                radius: 10
            };
        } else if (type === 'alien') {
            config = {
                name: "Lazerli Uzaylı",
                type: 'alien',
                hp: 260 + (waveScale * 50),
                speed: 52, // Agile hovering stride
                damage: 20,
                attackRate: 0.9,
                hasLaser: true,
                laserDamage: 24 + (waveScale * 3),
                hasBlink: true, // Teleports backwards when cornered!
                gold: 5,
                xp: 34,
                radius: 9
            };
        } else if (type === 'wolf') {
            config = {
                name: "Kara Kurt",
                type: 'wolf',
                hp: 170 + (waveScale * 35),
                speed: 90, // Sprint rush!
                damage: 22 + (waveScale * 2),
                attackRate: 0.7,
                stealth: true,
                gold: 3,
                xp: 18,
                radius: 8
            };
        } else if (type === 'bat') {
            // New Flying Enemy: Shadow Bat Imp (Bypasses ground melee!)
            config = {
                name: "Gölge Yarasası",
                type: 'bat',
                hp: 160 + (waveScale * 35),
                speed: 66,
                damage: 18,
                isFlying: true, // Immune to bombs & ground blocking!
                gold: 3,
                xp: 18,
                radius: 7
            };
        } else if (type === 'drake') {
            // New Flying Enemy: Fire Wyvern / Drake (Spits fire down!)
            config = {
                name: "Alev Ejderciği",
                type: 'drake',
                hp: 420 + (waveScale * 75),
                speed: 44,
                damage: 26 + (waveScale * 2),
                isFlying: true, // Immune to bombs & ground blocking!
                gold: 7,
                xp: 35,
                radius: 11
            };
        } else if (type === 'shaman') {
            // New Support Enemy: Orc Shaman (Heals allies!)
            config = {
                name: "Ork Şamanı",
                type: 'shaman',
                hp: 320 + (waveScale * 55),
                speed: 36,
                damage: 20,
                isShaman: true, // Casts healing chants!
                gold: 6,
                xp: 30,
                radius: 9
            };
        } else if (type === 'boss_sky') {
            // New Airborne Boss: Sky Terror Wyvern
            config = {
                name: "GÖK KORSANI WYVERN",
                type: 'boss_sky',
                hp: 4600,
                speed: 30,
                damage: 65,
                isFlying: true,
                isBoss: true,
                gold: 85,
                xp: 260,
                radius: 17
            };
        } else if (type === 'boss_mini') {
            config = {
                name: "Ork Kumandanı",
                type: 'boss',
                hp: 3200,
                shield: 1200,
                speed: 28,
                damage: 70,
                attackRate: 0.95,
                gold: 45,
                xp: 180,
                radius: 15,
                isBoss: true
            };
        } else if (type === 'boss_final') {
            config = {
                name: "KARA ORK EFENDİSİ",
                type: 'boss',
                hp: 8500,
                shield: 3000,
                speed: 25,
                damage: 110,
                attackRate: 0.9,
                gold: 150,
                xp: 450,
                radius: 18,
                isBoss: true
            };
        }

        return new Enemy(mapPath, config);
    }
}
