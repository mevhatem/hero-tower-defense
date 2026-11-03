// 16-Bit Pixel Soldiers & Peasant Militia (Köylüler)

class Soldier {
    constructor(tower, rallyX, rallyY, level = 1, slotIndex = 0) {
        this.tower = tower;
        this.level = level;
        this.slotIndex = slotIndex;

        const angleOffset = (slotIndex - 0.5) * 1.0;
        this.targetX = rallyX + Math.cos(angleOffset) * 13;
        this.targetY = rallyY + Math.sin(angleOffset) * 13;

        this.x = tower.x;
        this.y = tower.y;
        this.speed = 55; // in 640x360
        this.radius = 7;
        
        this.setupStats();

        this.blockingTarget = null;
        this.attackCooldown = 0;
        this.dead = false;
        this.swingAnim = 0;
        this.walkAnim = Math.random() * Math.PI;
        this.rootTimer = 0;
    }

    setupStats() {
        if (this.level === 1) {
            this.maxHp = 220;
            this.hp = this.maxHp;
            this.damage = 18;
            this.attackRate = 0.9;
            this.armor = 0.15;
            this.name = "Milis";
        } else if (this.level === 2) {
            this.maxHp = 440;
            this.hp = this.maxHp;
            this.damage = 38;
            this.attackRate = 0.8;
            this.armor = 0.3;
            this.name = "Bakır Muhafız";
        } else {
            this.maxHp = 780;
            this.hp = this.maxHp;
            this.damage = 68;
            this.attackRate = 0.7;
            this.armor = 0.45;
            this.name = "Kraliyet Şövalyesi";
        }
    }

    update(dt, enemies, effects) {
        if (this.dead) return;

        if (this.rootTimer > 0) {
            this.rootTimer -= dt;
            return;
        }

        this.walkAnim += dt * 8;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.swingAnim > 0) this.swingAnim -= dt * 6;

        if (this.blockingTarget && (this.blockingTarget.dead || this.blockingTarget.reachedEnd)) {
            this.blockingTarget = null;
        }

        // 1. Fight engaged enemy
        if (this.blockingTarget) {
            const dx = this.blockingTarget.x - this.x;
            const dy = this.blockingTarget.y - this.y;
            this.angle = Math.atan2(dy, dx);

            const dist = Math.hypot(dx, dy);
            if (dist > 16) {
                this.x += (dx / dist) * this.speed * 0.8 * dt;
                this.y += (dy / dist) * this.speed * 0.8 * dt;
            }

            if (this.attackCooldown <= 0) {
                this.attackCooldown = this.attackRate;
                this.swingAnim = 1.0;
                sounds.playSwordSwing();

                const dmg = this.damage + Math.floor(Math.random() * 6);
                this.blockingTarget.takeDamage(dmg, effects);
                effects.spawnSparks(this.blockingTarget.x, this.blockingTarget.y, '#f59e0b', 3);
            }
            return;
        }

        // 2. Intercept nearby enemy on the road
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.blockedBy || enemy.isFlying) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= 35) {
                this.blockingTarget = enemy;
                enemy.blockedBy = this;
                effects.addText("DUR!", this.x, this.y - 12, '#fbbf24', 8, 0.8);
                break;
            }
        }

        // 3. March to rally point
        const distToRally = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        if (distToRally > 3) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            this.x += (dx / distToRally) * this.speed * dt;
            this.y += (dy / distToRally) * this.speed * dt;
            this.angle = Math.atan2(dy, dx);
        }
    }

    takeDamage(amount, effects) {
        if (this.dead) return;

        const effectiveDmg = Math.max(2, Math.round(amount * (1 - this.armor)));
        this.hp -= effectiveDmg;
        effects.addText(`-${effectiveDmg}`, this.x, this.y - 9, '#ef4444', 8);
        effects.spawnBlood(this.x, this.y, 3);

        if (this.hp <= 0) {
            this.die(effects);
        }
    }

    die(effects) {
        this.dead = true;
        this.hp = 0;
        if (this.blockingTarget && this.blockingTarget.blockedBy === this) {
            this.blockingTarget.blockedBy = null;
        }
        this.blockingTarget = null;
        effects.spawnBlood(this.x, this.y, 8);
        effects.addText("ŞEHİT!", this.x, this.y - 12, '#991b1b', 8, 1.2);
        if (this.tower) {
            this.tower.onSoldierDied(this);
        }
    }

    draw(ctx) {
        if (this.dead) return;

        const sx = Math.round(this.x);
        const sy = Math.round(this.y);

        ctx.save();
        ctx.translate(sx, sy);

        // Ground Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(-5, 5, 10, 2);

        let armorCol = '#4b5563';
        let shieldCol = '#854d0e';

        if (this.level === 2) {
            armorCol = '#b45309';
            shieldCol = '#d97706';
        } else if (this.level === 3) {
            armorCol = '#2563eb';
            shieldCol = '#fbbf24';
        }

        // Body
        ctx.fillStyle = armorCol;
        ctx.fillRect(-3, -4, 6, 8);

        // Helmet
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(-3, -7, 6, 4);

        // Shield (left)
        ctx.fillStyle = shieldCol;
        ctx.fillRect(-6, -2, 3, 6);

        // Sword (right)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(4, -5, 2, 7);

        // Pixel HP Bar
        const barW = 14;
        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-barW / 2, -11, barW, 2);
        ctx.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(-barW / 2, -11, Math.round(barW * hpPct), 2);

        ctx.restore();
    }
}

// 2. PEASANT MILITIA (KÖYLÜLER) - Straw hats, Scythe or Shovel
class Peasant {
    constructor(x, y, weaponType = 'scythe') {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.weaponType = weaponType;

        this.radius = 6;
        this.speed = 50;
        this.maxHp = 110;
        this.hp = this.maxHp;
        this.damage = 12;
        this.attackRate = 1.0;
        this.armor = 0;
        this.blockingTarget = null;
        this.attackCooldown = 0;
        this.dead = false;
        this.lifetime = 26.0;
        this.rootTimer = 0;
    }

    update(dt, enemies, effects) {
        if (this.dead) return;

        if (this.rootTimer > 0) {
            this.rootTimer -= dt;
            return;
        }

        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.die(effects, "GİTTİ!");
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        if (this.blockingTarget && (this.blockingTarget.dead || this.blockingTarget.reachedEnd)) {
            this.blockingTarget = null;
        }

        if (this.blockingTarget) {
            const dx = this.blockingTarget.x - this.x;
            const dy = this.blockingTarget.y - this.y;
            this.angle = Math.atan2(dy, dx);

            if (this.attackCooldown <= 0) {
                this.attackCooldown = this.attackRate;
                sounds.playSwordSwing();

                const dmg = this.damage + Math.floor(Math.random() * 4);
                this.blockingTarget.takeDamage(dmg, effects);
                effects.spawnSparks(this.blockingTarget.x, this.blockingTarget.y, '#f59e0b', 2);
            }
            return;
        }

        // Intercept close enemy
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.blockedBy || enemy.isFlying) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= 30) {
                this.blockingTarget = enemy;
                enemy.blockedBy = this;
                effects.addText("DUR!", this.x, this.y - 10, '#fbbf24', 7, 0.8);
                break;
            }
        }
    }

    takeDamage(amount, effects) {
        if (this.dead) return;
        this.hp -= amount;
        effects.addText(`-${amount}`, this.x, this.y - 8, '#ef4444', 8);
        effects.spawnBlood(this.x, this.y, 3);

        if (this.hp <= 0) {
            this.die(effects, "ÖLDÜ!");
        }
    }

    die(effects, label = "ÖLDÜ!") {
        this.dead = true;
        this.hp = 0;
        if (this.blockingTarget && this.blockingTarget.blockedBy === this) {
            this.blockingTarget.blockedBy = null;
        }
        this.blockingTarget = null;
        effects.spawnBlood(this.x, this.y, 5);
        effects.addText(label, this.x, this.y - 12, '#b91c1c', 8, 1.2);
    }

    draw(ctx) {
        if (this.dead) return;

        const px = Math.round(this.x);
        const py = Math.round(this.y);

        ctx.save();
        ctx.translate(px, py);

        // Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(-4, 4, 8, 2);

        // Brown Burlap Peasant Tunic
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-3, -3, 6, 7);

        // Yellow Straw Hat
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-5, -6, 10, 2);
        ctx.fillRect(-3, -8, 6, 2);

        // Weapon (Scythe or Shovel)
        ctx.fillStyle = '#45220c';
        ctx.fillRect(4, -8, 2, 10);
        if (this.weaponType === 'scythe') {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(2, -9, 4, 2); // curved blade
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(3, -10, 4, 3); // shovel head
        }

        // Small HP Bar
        const barW = 12;
        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-barW / 2, -10, barW, 2);
        ctx.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(-barW / 2, -10, Math.round(barW * hpPct), 2);

        ctx.restore();
    }
}

// 3. ARCHER SOLDIER (OKÇU ASKER) - Spawns from Archer Barracks (Okçu Kulübesi)
// Counts 1 more than warrior barracks, lower HP, shoots arrows at both ground & flying enemies!
class ArcherSoldier {
    constructor(tower, rallyX, rallyY, level = 1, slotIndex = 0) {
        this.tower = tower;
        this.level = level;
        this.slotIndex = slotIndex;

        const total = tower.maxSoldiers || 3;
        const angleOffset = (slotIndex / total) * Math.PI * 2;
        this.targetX = rallyX + Math.cos(angleOffset) * 16;
        this.targetY = rallyY + Math.sin(angleOffset) * 16;

        this.x = tower.x;
        this.y = tower.y;
        this.speed = 60;
        this.radius = 6;

        this.setupStats();

        this.target = null;
        this.cooldown = Math.random() * 0.4;
        this.dead = false;
        this.angle = 0;
        this.walkAnim = Math.random() * Math.PI;
        this.rootTimer = 0;
    }

    setupStats() {
        if (this.level === 1) {
            this.maxHp = 110;
            this.hp = this.maxHp;
            this.damage = 18;
            this.range = 95;
            this.fireInterval = 0.82;
            this.armor = 0.05;
            this.name = "Avcı Okçu";
        } else if (this.level === 2) {
            this.maxHp = 210;
            this.hp = this.maxHp;
            this.damage = 34;
            this.range = 110;
            this.fireInterval = 0.68;
            this.armor = 0.15;
            this.name = "Orman Nişancısı";
        } else {
            this.maxHp = 350;
            this.hp = this.maxHp;
            this.damage = 58;
            this.range = 130;
            this.fireInterval = 0.52;
            this.armor = 0.25;
            this.name = "Kraliyet Okçusu";
        }
    }

    update(dt, enemies, effects, projectiles) {
        if (this.dead) return;

        if (this.rootTimer > 0) {
            this.rootTimer -= dt;
            return;
        }

        this.walkAnim += dt * 8;
        if (this.cooldown > 0) this.cooldown -= dt;

        // March to station around rally point
        const distToRally = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        if (distToRally > 3) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            this.x += (dx / distToRally) * this.speed * dt;
            this.y += (dy / distToRally) * this.speed * dt;
            this.angle = Math.atan2(dy, dx);
        }

        // Target nearest enemy (Can hit ground AND flying enemies!)
        this.target = null;
        let minDist = this.range;

        // Prioritize flying enemies first!
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.isStealthed) continue;
            if (enemy.isFlying) {
                const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (d <= minDist) {
                    this.target = enemy;
                    minDist = d;
                    break;
                }
            }
        }

        // If no flying enemy in range, target closest ground enemy
        if (!this.target) {
            for (let enemy of enemies) {
                if (enemy.dead || enemy.reachedEnd || enemy.isStealthed) continue;
                const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (d <= minDist) {
                    this.target = enemy;
                    minDist = d;
                }
            }
        }

        if (this.target) {
            this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            if (this.cooldown <= 0) {
                this.cooldown = this.fireInterval;
                sounds.playCrossbow();
                if (projectiles) {
                    projectiles.push(new Arrow(this.x, this.y - 4, this.target, this.damage));
                }
            }
        }
    }

    takeDamage(amount, effects) {
        if (this.dead) return;
        const effectiveDmg = Math.max(2, Math.round(amount * (1 - this.armor)));
        this.hp -= effectiveDmg;
        effects.addText(`-${effectiveDmg}`, this.x, this.y - 8, '#ef4444', 8);
        effects.spawnBlood(this.x, this.y, 3);

        if (this.hp <= 0) {
            this.die(effects);
        }
    }

    die(effects) {
        this.dead = true;
        this.hp = 0;
        this.target = null;
        effects.spawnBlood(this.x, this.y, 6);
        effects.addText("ÖLDÜ!", this.x, this.y - 12, '#b91c1c', 8, 1.2);
    }

    draw(ctx) {
        if (this.dead) return;

        const px = Math.round(this.x);
        const py = Math.round(this.y);

        ctx.save();
        ctx.translate(px, py);

        // Ground Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(-5, 5, 10, 2);

        // Hunter Tunic (Stardew Green & Forest Brown)
        ctx.fillStyle = this.level === 3 ? '#1e3a8a' : (this.level === 2 ? '#047857' : '#15803d');
        ctx.fillRect(-4, -3, 8, 8);
        ctx.fillStyle = '#78350f'; // leather belt
        ctx.fillRect(-4, 0, 8, 2);

        // Hunter Feathered Cap
        ctx.fillStyle = this.level === 3 ? '#1e40af' : '#166534';
        ctx.fillRect(-5, -7, 10, 3);
        ctx.fillRect(-3, -9, 6, 2);
        // Red / Yellow Feather
        ctx.fillStyle = this.level === 3 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(2, -11, 2, 4);

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-2, -5, 1, 1);
        ctx.fillRect(1, -5, 1, 1);

        // Wooden Bow in Hand
        ctx.save();
        ctx.rotate(this.angle);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(5, -6, 2, 12);
        ctx.fillRect(4, -7, 2, 2);
        ctx.fillRect(4, 5, 2, 2);
        ctx.fillStyle = '#e2e8f0'; // bowstring
        ctx.fillRect(3, -5, 1, 10);
        ctx.restore();

        // Health Bar
        const barW = 12;
        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-barW / 2, -11, barW, 2);
        ctx.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(-barW / 2, -11, Math.round(barW * hpPct), 2);

        ctx.restore();
    }
}
