// 16-Bit Terraria & Stardew Valley Inspired Towers, Upgrades & Visual Evolutions
// Towers: Archer, Barracks (Warrior), Archer Barracks (Garrison), Bomber (Mortar), Mage (Wizard Spire)

class Arrow {
    constructor(startX, startY, target, damage, speed = 260) {
        this.x = startX;
        this.y = startY;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.dead = false;
        this.angle = 0;
    }

    update(dt, effects) {
        if (this.dead) return false;

        const dx = this.target.x - this.x;
        const dy = (this.target.isFlying ? this.target.y - (this.target.flyAltitude || 14) : this.target.y) - this.y;
        const dist = Math.hypot(dx, dy);
        this.angle = Math.atan2(dy, dx);

        if (dist <= 10) {
            this.dead = true;
            if (!this.target.dead) {
                this.target.takeDamage(this.damage, effects, true, true);
                sounds.playHit();
                effects.spawnSparks(this.x, this.y, '#e2e8f0', 3);
            }
            return false;
        }

        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(this.angle);

        // Pixel Arrow
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-6, -1, 9, 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(3, -2, 4, 4);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-6, -2, 2, 4);

        ctx.restore();
    }
}

class CannonBomb {
    constructor(startX, startY, targetX, targetY, damage, splashRadius = 40) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.splashRadius = splashRadius;

        this.progress = 0;
        this.duration = 0.65;
        this.peakHeight = 40;
        this.dead = false;
    }

    update(dt, enemies, effects) {
        if (this.dead) return false;

        this.progress += dt / this.duration;

        const curGroundX = this.startX + (this.targetX - this.startX) * this.progress;
        const curGroundY = this.startY + (this.targetY - this.startY) * this.progress;
        const arc = 4 * this.peakHeight * this.progress * (1 - this.progress);

        this.x = curGroundX;
        this.y = curGroundY - arc;
        this.groundY = curGroundY;

        if (Math.random() < 0.3) {
            effects.particles.push(new Particle(
                this.x, this.y, 0, -0.5,
                '#f97316', 2, 0.2, 'square'
            ));
        }

        if (this.progress >= 1.0) {
            this.dead = true;
            sounds.playBombExplode();
            effects.spawnExplosion(this.targetX, this.targetY, this.splashRadius);

            // Bombs ONLY damage ground targets (Flying enemies are immune!)
            for (let e of enemies) {
                if (e.dead || e.reachedEnd || e.isFlying) continue;
                const d = Math.hypot(e.x - this.targetX, e.y - this.targetY);
                if (d <= this.splashRadius) {
                    const falloff = 1 - (d / this.splashRadius) * 0.35;
                    const dmg = Math.round(this.damage * falloff);
                    e.takeDamage(dmg, effects);
                }
            }
            return false;
        }

        return true;
    }

    draw(ctx) {
        ctx.save();
        const bx = Math.round(this.x);
        const by = Math.round(this.y);
        const gy = Math.round(this.groundY);

        // Ground shadow beneath bomb
        ctx.fillStyle = 'rgba(27, 46, 24, 0.4)';
        ctx.fillRect(bx - 3, gy - 1, 6, 3);

        // Iron Bomb with Burning Spark Fuse
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - 4, by - 4, 8, 8);
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx - 3, by - 3, 6, 6);
        ctx.fillStyle = '#94a3b8'; // highlight
        ctx.fillRect(bx - 2, by - 2, 2, 2);

        // Spark Fuse
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(bx, by - 6, 2, 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bx + 1, by - 7, 2, 2);

        ctx.restore();
    }
}

class MagicOrb {
    constructor(startX, startY, target, damage, splashRadius = 30) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.target = target;
        this.damage = damage;
        this.splashRadius = splashRadius;
        this.speed = 175;
        this.dead = false;
    }

    update(dt, enemies, effects) {
        if (this.dead) return false;

        const targetY = (this.target.isFlying ? this.target.y - (this.target.flyAltitude || 14) : this.target.y);
        const dx = this.target.x - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 10) {
            this.dead = true;
            sounds.playMagicImpact();

            // Magic hits both ground AND flying targets!
            effects.spawnSparks(this.target.x, targetY, '#a855f7', 10);
            for (let e of enemies) {
                if (e.dead || e.reachedEnd) continue;
                const ey = (e.isFlying ? e.y - (e.flyAltitude || 14) : e.y);
                const d = Math.hypot(e.x - this.target.x, ey - targetY);
                if (d <= this.splashRadius) {
                    e.takeDamage(this.damage, effects);
                    e.applySlow(0.45, 2.2);
                }
            }
            return false;
        }

        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;

        if (Math.random() < 0.35) {
            effects.particles.push(new Particle(
                this.x + (Math.random() - 0.5) * 4,
                this.y + (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                '#c084fc', 2, 0.2, 'square'
            ));
        }

        return true;
    }

    draw(ctx) {
        ctx.save();
        const ox = Math.round(this.x);
        const oy = Math.round(this.y);

        // Glowing Arcane Pixel Orb
        ctx.fillStyle = '#7e22ce';
        ctx.fillRect(ox - 4, oy - 4, 8, 8);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(ox - 3, oy - 3, 6, 6);
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(ox - 1, oy - 1, 2, 2);

        ctx.restore();
    }
}

// Base Tower
class Tower {
    constructor(spot, type) {
        this.spot = spot;
        this.x = spot.x;
        this.y = spot.y;
        this.type = type;
        this.level = 1;
        this.maxLevel = 3;
        this.cooldown = 0;
        this.target = null;
        this.soldierList = [];
    }

    upgrade() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.applyLevelStats();
            sounds.playUpgrade();
            return true;
        }
        return false;
    }

    getSellValue() {
        return Math.floor(this.totalInvested * 0.7);
    }
}

// ========================================================
// 1. ARCHER TOWER (OKÇU KULESİ) - Stardew Wooden Lookout
// ========================================================
class ArcherTower extends Tower {
    constructor(spot) {
        super(spot, 'archer');
        this.totalInvested = 75;
        this.applyLevelStats();
    }

    applyLevelStats() {
        if (this.level === 1) {
            this.name = "Ahşap Gözetleme Kulesi";
            this.damage = 18;
            this.range = 90;
            this.fireInterval = 0.85;
            this.upgradeCost = 110;
        } else if (this.level === 2) {
            this.name = "Bakır Kiremitli Okçu Kulesi";
            this.damage = 38;
            this.range = 110;
            this.fireInterval = 0.65;
            this.upgradeCost = 180;
        } else {
            this.name = "Kraliyet Taş Okçu Kalesi";
            this.damage = 75;
            this.range = 130;
            this.fireInterval = 0.45;
            this.upgradeCost = 0;
        }
    }

    update(dt, enemies, projectiles, effects) {
        if (this.cooldown > 0) this.cooldown -= dt;

        this.target = null;
        // Prioritize flying enemies!
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.isStealthed) continue;
            if (enemy.isFlying) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range) {
                    this.target = enemy;
                    break;
                }
            }
        }

        // If no flying enemy, target nearest ground
        if (!this.target) {
            for (let enemy of enemies) {
                if (enemy.dead || enemy.reachedEnd || enemy.isStealthed) continue;
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range) {
                    this.target = enemy;
                    break;
                }
            }
        }

        if (this.target && this.cooldown <= 0) {
            this.cooldown = this.fireInterval;
            sounds.playArrowShot();
            if (this.level === 3) {
                projectiles.push(new Arrow(this.x - 3, this.y - 14, this.target, Math.round(this.damage * 0.6)));
                projectiles.push(new Arrow(this.x + 3, this.y - 14, this.target, Math.round(this.damage * 0.6)));
            } else {
                projectiles.push(new Arrow(this.x, this.y - 12, this.target, this.damage));
            }
        }
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        const tx = Math.round(this.x);
        const ty = Math.round(this.y);

        if (isSelected) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx - this.range, ty - this.range, this.range * 2, this.range * 2);
        }

        // Base Soft Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(tx - 12, ty + 8, 24, 4);

        if (this.level === 1) {
            // Level 1: Terraria Timber Lookout with Red Shingle Canopy
            ctx.fillStyle = '#5c3a21'; // wooden log posts
            ctx.fillRect(tx - 8, ty - 10, 16, 18);
            ctx.fillStyle = '#3f2512';
            ctx.fillRect(tx - 6, ty - 6, 12, 2);
            ctx.fillRect(tx - 6, ty + 3, 12, 2);

            // Red Terracotta Shingle Roof (Stardew Style)
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(tx - 10, ty - 13, 20, 4);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(tx - 7, ty - 16, 14, 3);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(tx - 3, ty - 18, 6, 2);

            // Mini Weather Vane / Gold Flag
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 1, ty - 21, 2, 3);
            ctx.fillRect(tx + 1, ty - 21, 3, 2);

            // Cute Green-Capped Archer
            ctx.fillStyle = '#15803d';
            ctx.fillRect(tx - 3, ty - 11, 6, 4);
            ctx.fillStyle = '#fde047'; // feather
            ctx.fillRect(tx + 2, ty - 13, 2, 2);

        } else if (this.level === 2) {
            // Level 2: Stardew Valley Copper Roof & Stone Base Tower
            ctx.fillStyle = '#475569'; // stone base
            ctx.fillRect(tx - 9, ty - 6, 18, 14);
            ctx.fillStyle = '#78350f'; // wood upper tower
            ctx.fillRect(tx - 8, ty - 17, 16, 11);

            // Warm Window Light
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(tx - 3, ty - 2, 6, 5);

            // Polished Copper Spire
            ctx.fillStyle = '#b45309';
            ctx.fillRect(tx - 11, ty - 19, 22, 3);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(tx - 8, ty - 22, 16, 3);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(tx - 4, ty - 26, 8, 4);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 1, ty - 29, 2, 3);

            // Blue Marksman
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(tx - 3, ty - 14, 6, 4);

        } else {
            // Level 3: Royal Stone Castle Watchtower
            ctx.fillStyle = '#1e293b'; // royal dark stone
            ctx.fillRect(tx - 11, ty - 22, 22, 30);
            ctx.fillStyle = '#334155';
            ctx.fillRect(tx - 9, ty - 20, 18, 28);

            // Stone Battlements
            ctx.fillStyle = '#475569';
            ctx.fillRect(tx - 12, ty - 25, 5, 4);
            ctx.fillRect(tx - 2, ty - 25, 4, 4);
            ctx.fillRect(tx + 7, ty - 25, 5, 4);

            // Blue Royal Shingle Spire
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(tx - 10, ty - 28, 20, 3);
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(tx - 6, ty - 31, 12, 3);
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(tx - 2, ty - 34, 4, 3);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 1, ty - 37, 2, 3); // golden finial

            // Twin Royal Snipers
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 5, ty - 23, 3, 3);
            ctx.fillRect(tx + 2, ty - 23, 3, 3);
        }

        ctx.restore();
    }
}

// ========================================================
// 2. BARRACKS / WARRIOR TOWER (SAVAŞÇI KIŞLASI)
// ========================================================
class BarracksTower extends Tower {
    constructor(spot) {
        super(spot, 'barracks');
        this.totalInvested = 95;
        this.respawnTimer = 0;
        this.respawnInterval = 7.0;
        this.applyLevelStats();
        this.spawnSoldiers();
    }

    applyLevelStats() {
        if (this.level === 1) {
            this.name = "Ahşap Kışla Kulübesi";
            this.maxSoldiers = 2;
            this.respawnInterval = 7.0;
            this.upgradeCost = 130;
        } else if (this.level === 2) {
            this.name = "Bakır Zırhlı Kışla";
            this.maxSoldiers = 2;
            this.respawnInterval = 5.5;
            this.upgradeCost = 210;
        } else {
            this.name = "Kraliyet Şövalye Kalesi";
            this.maxSoldiers = 3;
            this.respawnInterval = 4.5;
            this.upgradeCost = 0;
        }
    }

    upgrade() {
        if (super.upgrade()) {
            this.soldierList.forEach(s => {
                s.level = this.level;
                s.setupStats();
            });
            this.checkAndSpawnSoldiers();
            return true;
        }
        return false;
    }

    spawnSoldiers() {
        this.soldierList = [];
        for (let i = 0; i < this.maxSoldiers; i++) {
            this.soldierList.push(new Soldier(this, this.spot.rallyPoint.x, this.spot.rallyPoint.y, this.level, i));
        }
    }

    checkAndSpawnSoldiers() {
        this.soldierList = this.soldierList.filter(s => !s.dead);
        while (this.soldierList.length < this.maxSoldiers) {
            const nextIdx = this.soldierList.length;
            const newSoldier = new Soldier(this, this.spot.rallyPoint.x, this.spot.rallyPoint.y, this.level, nextIdx);
            this.soldierList.push(newSoldier);
            sounds.playBuild();
        }
    }

    update(dt, enemies, projectiles, effects) {
        this.soldierList = this.soldierList.filter(s => !s.dead);

        if (this.soldierList.length < this.maxSoldiers) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawnTimer = this.respawnInterval;
                const nextIdx = this.soldierList.length;
                this.soldierList.push(new Soldier(this, this.spot.rallyPoint.x, this.spot.rallyPoint.y, this.level, nextIdx));
                effects.addText("ASKER HAZIR!", this.x, this.y - 18, '#38bdf8', 8, 1.2);
            }
        }

        this.soldierList.forEach(s => s.update(dt, enemies, effects));
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        const tx = Math.round(this.x);
        const ty = Math.round(this.y);

        if (isSelected) {
            ctx.strokeStyle = '#38bdf8';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(this.spot.rallyPoint.x, this.spot.rallyPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(tx - 12, ty + 8, 24, 4);

        if (this.level === 1) {
            // Stardew Cozy Wood Guard Cabin
            ctx.fillStyle = '#45220c';
            ctx.fillRect(tx - 10, ty - 10, 20, 18);
            // Wooden Shingles
            ctx.fillStyle = '#78350f';
            ctx.fillRect(tx - 12, ty - 13, 24, 4);
            ctx.fillRect(tx - 8, ty - 16, 16, 3);

            // Door & Warm Light
            ctx.fillStyle = '#111827';
            ctx.fillRect(tx - 4, ty + 1, 8, 7);
            ctx.fillStyle = '#fde047'; // lantern by door
            ctx.fillRect(tx + 5, ty + 2, 2, 3);

            // Shield Crest over door
            ctx.fillStyle = '#854d0e';
            ctx.fillRect(tx - 2, ty - 6, 4, 4);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(tx - 1, ty - 5, 2, 2);

        } else if (this.level === 2) {
            // Copper Fortified Garrison with Chimney Smoke
            ctx.fillStyle = '#475569';
            ctx.fillRect(tx - 11, ty - 15, 22, 23);
            ctx.fillStyle = '#b45309'; // copper bands
            ctx.fillRect(tx - 11, ty - 15, 3, 23);
            ctx.fillRect(tx + 8, ty - 15, 3, 23);

            // Copper Roof
            ctx.fillStyle = '#d97706';
            ctx.fillRect(tx - 12, ty - 18, 24, 4);
            ctx.fillRect(tx - 8, ty - 21, 16, 3);

            // Stone Chimney with Smoke
            ctx.fillStyle = '#334155';
            ctx.fillRect(tx + 6, ty - 25, 4, 7);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(tx + 7, ty - 27, 2, 2);

            // Red War Banner
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(tx - 9, ty - 18, 4, 10);

        } else {
            // Royal Knight Keep
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(tx - 12, ty - 20, 24, 28);
            ctx.fillStyle = '#334155';
            ctx.fillRect(tx - 14, ty - 23, 6, 4);
            ctx.fillRect(tx - 3, ty - 23, 6, 4);
            ctx.fillRect(tx + 8, ty - 23, 6, 4);

            // Iron Portcullis Door
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx - 4, ty + 1, 8, 7);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(tx - 3, ty + 2, 2, 5);
            ctx.fillRect(tx + 1, ty + 2, 2, 5);

            // Gold Royal Crest
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 2, ty - 12, 4, 4);
        }

        ctx.restore();
        this.soldierList.forEach(s => s.draw(ctx));
    }
}

// ========================================================
// 3. ARCHER BARRACKS / HUNTER GARRISON (OKÇU KULÜBESİ) - YENİ!
// ========================================================
class ArcherBarracksTower extends Tower {
    constructor(spot) {
        super(spot, 'archer_barracks');
        this.totalInvested = 90;
        this.respawnTimer = 0;
        this.respawnInterval = 6.0;
        this.applyLevelStats();
        this.spawnSoldiers();
    }

    applyLevelStats() {
        if (this.level === 1) {
            this.name = "Avcı Çadırı & Kulübesi";
            this.maxSoldiers = 3; // 1 more than warrior barracks!
            this.respawnInterval = 6.0;
            this.upgradeCost = 120;
        } else if (this.level === 2) {
            this.name = "Orman Gözcü Kulübesi";
            this.maxSoldiers = 3;
            this.respawnInterval = 5.0;
            this.upgradeCost = 190;
        } else {
            this.name = "Kraliyet Nişancı Loncası";
            this.maxSoldiers = 4; // 1 more than warrior barracks!
            this.respawnInterval = 4.0;
            this.upgradeCost = 0;
        }
    }

    upgrade() {
        if (super.upgrade()) {
            this.soldierList.forEach(s => {
                s.level = this.level;
                s.setupStats();
            });
            this.checkAndSpawnSoldiers();
            return true;
        }
        return false;
    }

    spawnSoldiers() {
        this.soldierList = [];
        for (let i = 0; i < this.maxSoldiers; i++) {
            this.soldierList.push(new ArcherSoldier(this, this.spot.rallyPoint.x, this.spot.rallyPoint.y, this.level, i));
        }
    }

    checkAndSpawnSoldiers() {
        this.soldierList = this.soldierList.filter(s => !s.dead);
        while (this.soldierList.length < this.maxSoldiers) {
            const nextIdx = this.soldierList.length;
            const newSoldier = new ArcherSoldier(this, this.spot.rallyPoint.x, this.spot.rallyPoint.y, this.level, nextIdx);
            this.soldierList.push(newSoldier);
            sounds.playBuild();
        }
    }

    update(dt, enemies, projectiles, effects) {
        this.soldierList = this.soldierList.filter(s => !s.dead);

        if (this.soldierList.length < this.maxSoldiers) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawnTimer = this.respawnInterval;
                const nextIdx = this.soldierList.length;
                this.soldierList.push(new ArcherSoldier(this, this.spot.rallyPoint.x, this.spot.rallyPoint.y, this.level, nextIdx));
                effects.addText("OKÇU HAZIR!", this.x, this.y - 18, '#4ade80', 8, 1.2);
            }
        }

        this.soldierList.forEach(s => s.update(dt, enemies, effects, projectiles));
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        const tx = Math.round(this.x);
        const ty = Math.round(this.y);

        if (isSelected) {
            ctx.strokeStyle = '#4ade80';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(this.spot.rallyPoint.x, this.spot.rallyPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(tx - 12, ty + 8, 24, 4);

        if (this.level === 1) {
            // Level 1: Hunter Tent & Target Dummy (Stardew Style)
            ctx.fillStyle = '#78350f'; // log frame
            ctx.fillRect(tx - 10, ty - 8, 20, 16);
            ctx.fillStyle = '#ca8a04'; // straw canopy
            ctx.fillRect(tx - 12, ty - 12, 24, 5);
            ctx.fillRect(tx - 8, ty - 15, 16, 4);

            // Hanging Target Dummy on side
            ctx.fillStyle = '#ca8a04'; // straw dummy
            ctx.fillRect(tx + 8, ty - 4, 4, 6);
            ctx.fillStyle = '#ef4444'; // bullseye red
            ctx.fillRect(tx + 9, ty - 2, 2, 2);

            // Cozy Window Glow
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(tx - 4, ty - 2, 4, 4);

        } else if (this.level === 2) {
            // Level 2: Stardew Wood & Green Shingle Hunter Lodge
            ctx.fillStyle = '#5c3a21';
            ctx.fillRect(tx - 11, ty - 15, 22, 23);
            // Green Shingle Roof
            ctx.fillStyle = '#15803d';
            ctx.fillRect(tx - 13, ty - 17, 26, 4);
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(tx - 10, ty - 20, 20, 4);
            ctx.fillRect(tx - 5, ty - 23, 10, 4);

            // Chimney with Puffing Smoke
            ctx.fillStyle = '#475569';
            ctx.fillRect(tx + 6, ty - 24, 4, 7);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(tx + 7, ty - 26, 2, 2);

            // Hanging Crossed Bows Emblem
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 2, ty - 7, 4, 4);

            // Potted Flower by Door
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(tx - 9, ty + 3, 3, 3);
            ctx.fillStyle = '#f472b6';
            ctx.fillRect(tx - 9, ty + 1, 3, 2);

        } else {
            // Level 3: Royal Marksman Spire
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(tx - 12, ty - 20, 24, 28);
            ctx.fillStyle = '#334155';
            ctx.fillRect(tx - 10, ty - 18, 20, 24);

            // Blue Royal Shingle Roof & Spire
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(tx - 13, ty - 22, 26, 4);
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(tx - 9, ty - 25, 18, 4);
            ctx.fillRect(tx - 4, ty - 29, 8, 5);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 1, ty - 32, 2, 4); // gold weather vane

            // Stone Chimney
            ctx.fillStyle = '#475569';
            ctx.fillRect(tx + 7, ty - 27, 4, 8);

            // Target Archery Window
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(tx - 3, ty - 12, 6, 6);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx - 1, ty - 12, 2, 6);
        }

        ctx.restore();
        this.soldierList.forEach(s => s.draw(ctx));
    }
}

// ========================================================
// 4. BOMBER / DWARVEN ARTILLERY TOWER (BOMBACI KULESİ)
// ========================================================
class BomberTower extends Tower {
    constructor(spot) {
        super(spot, 'bomber');
        this.totalInvested = 110;
        this.applyLevelStats();
    }

    applyLevelStats() {
        if (this.level === 1) {
            this.name = "Ahşap Havan Kulesi";
            this.damage = 65;
            this.range = 95;
            this.fireInterval = 2.0;
            this.splashRadius = 40;
            this.upgradeCost = 140;
        } else if (this.level === 2) {
            this.name = "Bakır & Fıçı Havanı";
            this.damage = 135;
            this.range = 115;
            this.fireInterval = 1.7;
            this.splashRadius = 50;
            this.upgradeCost = 220;
        } else {
            this.name = "Kraliyet Kuşatma Topu";
            this.damage = 260;
            this.range = 135;
            this.fireInterval = 1.4;
            this.splashRadius = 65;
            this.upgradeCost = 0;
        }
    }

    update(dt, enemies, projectiles, effects) {
        if (this.cooldown > 0) this.cooldown -= dt;

        this.target = null;
        // CANNOT target flying enemies (Bombs only hit ground targets!)
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.isStealthed || enemy.isFlying) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range) {
                this.target = enemy;
                break;
            }
        }

        if (this.target && this.cooldown <= 0) {
            this.cooldown = this.fireInterval;
            sounds.playBombLaunch();
            projectiles.push(new CannonBomb(this.x, this.y - 12, this.target.x, this.target.y, this.damage, this.splashRadius));
        }
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        const tx = Math.round(this.x);
        const ty = Math.round(this.y);

        if (isSelected) {
            ctx.strokeStyle = '#ef4444';
            ctx.strokeRect(tx - this.range, ty - this.range, this.range * 2, this.range * 2);
        }

        // Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(tx - 12, ty + 8, 24, 4);

        if (this.level === 1) {
            // Dwarven Workshop / Stone & Barrel Mortar
            ctx.fillStyle = '#475569';
            ctx.fillRect(tx - 10, ty - 8, 20, 16);
            // Black Mortar Barrel
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(tx - 4, ty - 15, 8, 9);
            // Wooden Gunpowder Barrel on side
            ctx.fillStyle = '#78350f';
            ctx.fillRect(tx + 7, ty + 1, 5, 7);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(tx + 7, ty + 3, 5, 1);

        } else if (this.level === 2) {
            // Copper Fortified Mortar Mill
            ctx.fillStyle = '#78350f';
            ctx.fillRect(tx - 10, ty - 14, 20, 22);
            ctx.fillStyle = '#b45309';
            ctx.fillRect(tx - 11, ty - 10, 22, 3);
            ctx.fillStyle = '#374151';
            ctx.fillRect(tx - 5, ty - 20, 10, 12);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(tx - 6, ty - 22, 12, 3);
            // Stack of Cannonballs
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx - 10, ty + 2, 3, 3);
            ctx.fillRect(tx - 7, ty + 2, 3, 3);
            ctx.fillRect(tx - 8, ty - 1, 3, 3);

        } else {
            // Royal Siege Cannon Foundry
            ctx.fillStyle = '#111827';
            ctx.fillRect(tx - 12, ty - 18, 24, 26);
            ctx.fillStyle = '#374151';
            ctx.fillRect(tx - 13, ty - 21, 5, 4);
            ctx.fillRect(tx + 8, ty - 21, 5, 4);

            // Dual Heavy Iron Cannon Barrels
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx - 6, ty - 24, 5, 12);
            ctx.fillRect(tx + 1, ty - 24, 5, 12);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 6, ty - 26, 5, 2);
            ctx.fillRect(tx + 1, ty - 26, 5, 2);
        }

        ctx.restore();
    }
}

// ========================================================
// 5. MAGE / WIZARD TOWER (Stardew Valley Wizard Spire)
// ========================================================
class MageTower extends Tower {
    constructor(spot) {
        super(spot, 'mage');
        this.totalInvested = 120;
        this.applyLevelStats();
    }

    applyLevelStats() {
        if (this.level === 1) {
            this.name = "Çırak Büyücü Kulesi";
            this.damage = 38;
            this.range = 85;
            this.fireInterval = 1.25;
            this.splashRadius = 26;
            this.upgradeCost = 160;
        } else if (this.level === 2) {
            this.name = "Bakır & Kristal Büyücü";
            this.damage = 78;
            this.range = 105;
            this.fireInterval = 1.05;
            this.splashRadius = 34;
            this.upgradeCost = 240;
        } else {
            this.name = "Başbüyücü Gözlemevi";
            this.damage = 155;
            this.range = 125;
            this.fireInterval = 0.85;
            this.splashRadius = 44;
            this.upgradeCost = 0;
        }
    }

    update(dt, enemies, projectiles, effects) {
        if (this.cooldown > 0) this.cooldown -= dt;

        this.target = null;
        // Prioritize flying enemies!
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.isStealthed) continue;
            if (enemy.isFlying) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range) {
                    this.target = enemy;
                    break;
                }
            }
        }

        // If no flying, target closest ground
        if (!this.target) {
            for (let enemy of enemies) {
                if (enemy.dead || enemy.reachedEnd || enemy.isStealthed) continue;
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range) {
                    this.target = enemy;
                    break;
                }
            }
        }

        if (this.target && this.cooldown <= 0) {
            this.cooldown = this.fireInterval;
            sounds.playMagicCast();
            projectiles.push(new MagicOrb(this.x, this.y - 18, this.target, this.damage, this.splashRadius));
        }
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        const tx = Math.round(this.x);
        const ty = Math.round(this.y);

        if (isSelected) {
            ctx.strokeStyle = '#c084fc';
            ctx.strokeRect(tx - this.range, ty - this.range, this.range * 2, this.range * 2);
        }

        // Base Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(tx - 12, ty + 8, 24, 4);

        if (this.level === 1) {
            // Stardew Valley Wizard Spire (Purple Roof, Ivy on Stone)
            ctx.fillStyle = '#334155'; // stone tower base
            ctx.fillRect(tx - 8, ty - 10, 16, 18);
            ctx.fillStyle = '#15803d'; // creeping ivy
            ctx.fillRect(tx - 8, ty - 6, 2, 10);
            ctx.fillRect(tx - 6, ty - 2, 2, 4);

            // Purple Witch Hat Roof
            ctx.fillStyle = '#581c87';
            ctx.fillRect(tx - 10, ty - 13, 20, 3);
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(tx - 7, ty - 17, 14, 4);
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(tx - 3, ty - 21, 6, 4);

            // Floating Floating Magic Crystal Orb
            const crystalFloat = Math.sin(Date.now() * 0.005) * 2;
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(tx - 2, ty - 26 + crystalFloat, 4, 4);
            ctx.fillStyle = '#f3e8ff';
            ctx.fillRect(tx - 1, ty - 25 + crystalFloat, 2, 2);

        } else if (this.level === 2) {
            // Level 2: Dual Crystal Wizard Tower
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(tx - 9, ty - 16, 18, 24);
            ctx.fillStyle = '#22c55e'; // ivy
            ctx.fillRect(tx + 7, ty - 10, 2, 12);

            // Shingle Spire
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(tx - 11, ty - 19, 22, 3);
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(tx - 7, ty - 24, 14, 5);
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(tx - 3, ty - 28, 6, 4);

            // Pulsing Crystal Sphere
            const float2 = Math.sin(Date.now() * 0.006) * 3;
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(tx - 3, ty - 34 + float2, 6, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(tx - 1, ty - 33 + float2, 2, 2);

        } else {
            // Level 3: Royal Archmage Observatory
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx - 10, ty - 22, 20, 30);

            // Gold Trim & Stained Glass Window
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 11, ty - 18, 22, 2);
            ctx.fillStyle = '#38bdf8'; // glowing stained glass
            ctx.fillRect(tx - 3, ty - 10, 6, 8);

            // Archmage High Spire
            ctx.fillStyle = '#6b21a8';
            ctx.fillRect(tx - 12, ty - 25, 24, 3);
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(tx - 8, ty - 30, 16, 5);
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(tx - 4, ty - 36, 8, 6);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(tx - 1, ty - 40, 2, 4);

            // 2 Orbiting Arcane Crystals
            const rot = Date.now() * 0.004;
            const ox1 = Math.cos(rot) * 9;
            const oy1 = Math.sin(rot) * 4;
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(tx + ox1 - 2, ty - 44 + oy1, 4, 4);
            ctx.fillStyle = '#f472b6';
            ctx.fillRect(tx - ox1 - 2, ty - 44 - oy1, 4, 4);
        }

        ctx.restore();
    }
}
