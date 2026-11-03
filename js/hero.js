// 16-Bit Pixel Hero Character

class Hero {
    constructor(startX = 320, startY = 180) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;

        this.radius = 9;
        this.speed = 115; // in 640x360 space
        this.angle = 0;

        // Level & Stats
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 120;
        this.maxHp = 280;
        this.hp = this.maxHp;
        this.damage = 34;
        this.attackRange = 36;
        this.attackArc = Math.PI * 0.75;

        // Cooldowns
        this.attackCooldown = 0;
        this.attackInterval = 0.38;
        this.swingAnim = 0;

        // Dash Skill
        this.dashCooldown = 0;
        this.dashInterval = 3.5;
        this.isDashing = false;
        this.dashDuration = 0.18;
        this.dashTimer = 0;
        this.dashVx = 0;
        this.dashVy = 0;

        // Status
        this.rootTimer = 0;

        // Skill 1: Meteor Rain (Q / 1) - Balanced to take ~40-45% HP rather than one-shot
        this.meteorCooldown = 0;
        this.meteorInterval = 45.0;
        this.isAimingMeteor = false;

        // Skill 2: Call Peasants (2)
        this.peasantCooldown = 0;
        this.peasantInterval = 18.0;
        this.isAimingPeasant = false;

        // Skill 3: Holy Heal (E / 3)
        this.healCooldown = 0;
        this.healInterval = 25.0;

        this.timeSinceDamaged = 0;
        this.regenRate = 12;

        this.dead = false;
        this.respawnTimer = 0;
        this.walkAnim = 0;
    }

    update(dt, input, effects, enemies, friendlies, bounds, peasantsList) {
        if (this.dead) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
                effects.addText("DİRİLDİ!", this.x, this.y - 16, '#4ade80', 10, 1.5);
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.swingAnim > 0) this.swingAnim -= dt * 5;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.meteorCooldown > 0) this.meteorCooldown -= dt;
        if (this.peasantCooldown > 0) this.peasantCooldown -= dt;
        if (this.healCooldown > 0) this.healCooldown -= dt;

        this.timeSinceDamaged += dt;
        if (this.timeSinceDamaged > 3.0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
        }

        if (this.rootTimer > 0) {
            this.rootTimer -= dt;
            if (Math.random() < 0.2) {
                effects.particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 8, this.y + 6,
                    0, -0.4, '#15803d', 2, 0.25, 'square'
                ));
            }
        }

        // 1. Dash
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.x += this.dashVx * dt;
            this.y += this.dashVy * dt;

            effects.particles.push(new Particle(
                this.x, this.y, 0, 0,
                '#60a5fa', 4, 0.18, 'square'
            ));

            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else if (this.rootTimer <= 0) {
            // Movement (Analog Joystick or WASD/Arrows)
            let moveX = input.moveX || 0;
            let moveY = input.moveY || 0;
            if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
            if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
            if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
            if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

            if (moveX !== 0 || moveY !== 0) {
                const len = Math.hypot(moveX, moveY);
                moveX /= len;
                moveY /= len;

                this.x += moveX * this.speed * dt;
                this.y += moveY * this.speed * dt;
                this.walkAnim += dt * 10;

                // On touch or if moving without active mouse drag, face movement direction
                if (input.isTouchMode || (!input.mouseLeft && !this.isAimingMeteor && !this.isAimingPeasant)) {
                    this.angle = Math.atan2(moveY, moveX);
                }

                if (Math.random() < 0.2) {
                    effects.particles.push(new Particle(
                        this.x, this.y + 7,
                        -moveX * 0.4, -moveY * 0.4,
                        '#854d0e', 2, 0.2, 'square'
                    ));
                }
            }

            // Dash Trigger (Space, Right Click, or Touch Dash Button)
            const dashRequested = input.keys['Space'] || input.mouseRight || input.dashRequested;
            if (dashRequested && this.dashCooldown <= 0) {
                let dx = moveX;
                let dy = moveY;
                if (dx === 0 && dy === 0) {
                    dx = Math.cos(this.angle);
                    dy = Math.sin(this.angle);
                }
                this.startDash(dx, dy);
                input.keys['Space'] = false;
                input.mouseRight = false;
                input.dashRequested = false;
            }
        }

        this.x = Math.max(16, Math.min(bounds.width - 16, this.x));
        this.y = Math.max(30, Math.min(bounds.height - 16, this.y));

        if (!input.isTouchMode) {
            const dx = input.mouseX - this.x;
            const dy = input.mouseY - this.y;
            this.angle = Math.atan2(dy, dx);
        }

        // Attack (Mouse Left Click or Mobile Attack Button)
        const attackTriggered = (input.mouseLeft || input.attackRequested) && !this.isAimingMeteor && !this.isAimingPeasant;
        if (attackTriggered && this.attackCooldown <= 0) {
            input.attackRequested = false;
            
            // On mobile, auto-aim towards closest enemy if nearby
            if (input.isTouchMode && enemies.length > 0) {
                let nearest = null;
                let minDist = 70;
                for (let e of enemies) {
                    if (e.dead || e.reachedEnd) continue;
                    const d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        nearest = e;
                    }
                }
                if (nearest) {
                    this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                }
            }

            this.attack(enemies, effects);
        }

        // Skill 1: Meteor target toggle [Q / 1]
        if (input.keys['KeyQ'] || input.keys['Digit1']) {
            if (this.meteorCooldown <= 0) {
                this.isAimingMeteor = !this.isAimingMeteor;
                this.isAimingPeasant = false;
            }
            input.keys['KeyQ'] = false;
            input.keys['Digit1'] = false;
        }

        // Skill 2: Peasant summon toggle [2]
        if (input.keys['Digit2']) {
            if (this.peasantCooldown <= 0) {
                this.isAimingPeasant = !this.isAimingPeasant;
                this.isAimingMeteor = false;
            }
            input.keys['Digit2'] = false;
        }

        // Skill 3: Holy Heal [E / 3]
        if (input.keys['KeyE'] || input.keys['Digit3']) {
            if (this.healCooldown <= 0) {
                this.castHeal(friendlies, effects);
            }
            input.keys['KeyE'] = false;
            input.keys['Digit3'] = false;
        }

        // Left Click Confirm Meteor
        if (input.mouseLeft && this.isAimingMeteor && this.meteorCooldown <= 0) {
            const mx = input.mouseX;
            const my = input.mouseY;
            this.isAimingMeteor = false;
            input.mouseLeft = false;
            try {
                this.castMeteor(mx, my, effects, enemies);
            } catch (err) {
                console.error("castMeteor error:", err);
            }
        }

        // Left Click Confirm Peasants
        if (input.mouseLeft && this.isAimingPeasant && this.peasantCooldown <= 0) {
            const mx = input.mouseX;
            const my = input.mouseY;
            this.isAimingPeasant = false;
            input.mouseLeft = false;
            try {
                this.spawnPeasants(mx, my, peasantsList, effects);
            } catch (err) {
                console.error("spawnPeasants error:", err);
            }
        }
    }

    startDash(dirX, dirY) {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashInterval;
        const dashSpeed = 340;
        this.dashVx = dirX * dashSpeed;
        this.dashVy = dirY * dashSpeed;
        sounds.playDash();
    }

    attack(enemies, effects) {
        this.attackCooldown = this.attackInterval;
        this.swingAnim = 1.0;
        sounds.playSwordSwing();

        effects.spawnSlashArc(this.x, this.y, this.angle, this.attackRange * 0.7);

        let hitCount = 0;
        for (let enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd) continue;

            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.attackRange + enemy.radius) {
                const angleToEnemy = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                let angleDiff = Math.abs(angleToEnemy - this.angle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (angleDiff <= this.attackArc / 2) {
                    const isCrit = Math.random() < 0.22;
                    let dmg = this.damage + Math.floor(Math.random() * 8);
                    if (isCrit) dmg = Math.round(dmg * 1.6);

                    enemy.takeDamage(dmg, effects, false);
                    effects.addText(isCrit ? `${dmg}!` : `${dmg}`, enemy.x, enemy.y - 10, isCrit ? '#f59e0b' : '#ffffff', isCrit ? 10 : 8);
                    effects.spawnSparks(enemy.x, enemy.y, isCrit ? '#f59e0b' : '#38bdf8', 4);
                    hitCount++;

                    const kbDist = isCrit ? 8 : 4;
                    enemy.x += Math.cos(this.angle) * kbDist;
                    enemy.y += Math.sin(this.angle) * kbDist;
                }
            }
        }

        if (hitCount > 0) {
            sounds.playHit();
            effects.shake(2, 0.12);
        }
    }

    castMeteor(targetX, targetY, effects, enemies) {
        this.meteorCooldown = this.meteorInterval;
        try {
            sounds.playMeteorWhistle();
        } catch (e) {}

        for (let i = 0; i < 5; i++) {
            const delay = i * 160;
            setTimeout(() => {
                try {
                    const scatterX = targetX + (Math.random() - 0.5) * 45;
                    const scatterY = targetY + (Math.random() - 0.5) * 45;

                    effects.launchMeteor(scatterX, scatterY, (hitX, hitY) => {
                        try {
                            sounds.playExplosion();
                        } catch (e) {}

                        try {
                            effects.spawnExplosion(hitX, hitY, 55);
                        } catch (e) {}

                        // ~40-45% max HP damage + moderate burn
                        if (Array.isArray(enemies)) {
                            for (let enemy of enemies) {
                                if (!enemy || enemy.dead || enemy.reachedEnd) continue;
                                const dist = Math.hypot(enemy.x - hitX, enemy.y - hitY);
                                if (dist <= 65) {
                                    const halfHpDmg = Math.round(enemy.maxHp * 0.42 + 20);
                                    if (typeof enemy.takeDamage === 'function') {
                                        enemy.takeDamage(halfHpDmg, effects);
                                    }
                                    if (typeof enemy.applyBurn === 'function') {
                                        enemy.applyBurn(30, 3.0);
                                    }
                                }
                            }
                        }
                    });
                } catch (err) {
                    console.error("Meteor delayed strike error:", err);
                }
            }, delay);
        }

        effects.addText("METEOR!", targetX, targetY - 20, '#f97316', 12, 1.8);
    }

    spawnPeasants(targetX, targetY, peasantsList, effects) {
        this.peasantCooldown = this.peasantInterval;
        try {
            sounds.playPeasantSpawn();
        } catch (e) {}

        try {
            const p1 = new Peasant(targetX - 8, targetY, 'scythe');
            const p2 = new Peasant(targetX + 8, targetY, 'shovel');
            if (Array.isArray(peasantsList)) {
                peasantsList.push(p1, p2);
            }

            effects.spawnSparks(targetX, targetY, '#fbbf24', 8);
            effects.addText("2 KÖYLÜ!", targetX, targetY - 16, '#fde047', 9, 1.5);
        } catch (err) {
            console.error("spawnPeasants error:", err);
        }
    }

    castHeal(friendlies, effects) {
        this.healCooldown = this.healInterval;
        try {
            sounds.playHeal();
        } catch (e) {}

        try {
            const healAmt = Math.round(this.maxHp * 0.4);
            this.hp = Math.min(this.maxHp, this.hp + healAmt);
            effects.addText(`+${healAmt}`, this.x, this.y - 14, '#22c55e', 9, 1.2);

            if (Array.isArray(friendlies)) {
                friendlies.forEach(f => {
                    if (f && !f.dead) {
                        const sHeal = Math.round(f.maxHp * 0.45);
                        f.hp = Math.min(f.maxHp, f.hp + sHeal);
                        effects.addText(`+${sHeal}`, f.x, f.y - 12, '#4ade80', 8, 1.0);
                    }
                });
            }

            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                effects.particles.push(new Particle(
                    this.x + Math.cos(a) * 14,
                    this.y + Math.sin(a) * 14,
                    Math.cos(a) * 0.8,
                    Math.sin(a) * 0.8,
                    '#4ade80', 3, 0.35, 'square'
                ));
            }
        } catch (err) {
            console.error("castHeal error:", err);
        }
    }

    takeDamage(amount, effects) {
        if (this.dead || this.isDashing) return;

        this.hp -= amount;
        this.timeSinceDamaged = 0;
        effects.addText(`-${amount}`, this.x, this.y - 12, '#ef4444', 9);
        effects.spawnBlood(this.x, this.y, 4);
        effects.shake(2, 0.1);

        if (this.hp <= 0) {
            this.die(effects);
        }
    }

    die(effects) {
        this.dead = true;
        this.hp = 0;
        this.respawnTimer = 8.0;
        effects.spawnBlood(this.x, this.y, 12);
        effects.addText("ÖLDÜ!", this.x, this.y - 14, '#ef4444', 11, 2.0);
    }

    respawn() {
        this.dead = false;
        this.hp = this.maxHp;
        this.x = this.startX;
        this.y = this.startY;
    }

    addXp(amount, effects) {
        this.xp += amount;
        if (this.xp >= this.xpNeeded) {
            this.levelUp(effects);
        }
    }

    levelUp(effects) {
        this.level++;
        this.xp -= this.xpNeeded;
        this.xpNeeded = Math.round(this.xpNeeded * 1.5);
        this.maxHp += 45;
        this.hp = this.maxHp;
        this.damage += 9;
        sounds.playLevelUp();
        effects.addText(`LVL ${this.level}!`, this.x, this.y - 18, '#fbbf24', 11, 1.8);
        effects.spawnSparks(this.x, this.y, '#fbbf24', 12);
    }

    // 16-Bit Pixel Knight Sprite Drawing
    draw(ctx) {
        const hx = Math.round(this.x);
        const hy = Math.round(this.y);

        if (this.dead) {
            // Tombstone
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(hx - 5, hy - 9, 10, 12);
            ctx.fillStyle = '#9ca3af';
            ctx.fillRect(hx - 3, hy - 7, 6, 2);
            ctx.fillRect(hx - 1, hy - 7, 2, 6);
            return;
        }

        ctx.save();
        ctx.translate(hx, hy);

        // Ground Pixel Shadow
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(-6, 7, 12, 3);

        // Entangled root vines if rooted by Treant
        if (this.rootTimer > 0) {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(-7, 4, 14, 4);
            ctx.fillStyle = '#166534';
            ctx.fillRect(-6, 2, 4, 6);
            ctx.fillRect(2, 2, 4, 6);
            ctx.fillStyle = '#86efac';
            ctx.fillRect(-4, 3, 2, 2);
            ctx.fillRect(3, 4, 2, 2);
        }

        // Pixel Cape (Red)
        ctx.save();
        ctx.rotate(this.angle);
        const capeWave = Math.sin(this.walkAnim) * 2;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-12, -4 + capeWave, 6, 8);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-14, -3 + capeWave, 3, 6);
        ctx.restore();

        // Rotate to aim angle
        ctx.rotate(this.angle);

        // Steel Armor Body (Pixel Grid)
        ctx.fillStyle = '#374151';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-4, -4, 8, 8);

        // Golden Trim
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2, -2, 4, 4);

        // Steel Helmet
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(1, -4, 6, 8);
        ctx.fillStyle = '#111827'; // Visor slit
        ctx.fillRect(4, -2, 2, 4);

        // Pixel Sword
        ctx.save();
        ctx.translate(4, 5);
        if (this.swingAnim > 0) {
            ctx.rotate(this.swingAnim * 1.8 - 0.9);
        }
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, -1, 14, 2);
        ctx.fillStyle = '#38bdf8'; // Glowing tip
        ctx.fillRect(12, -1, 3, 2);
        // Hilt
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-1, -3, 2, 6);
        ctx.restore();

        ctx.restore();
    }
}
