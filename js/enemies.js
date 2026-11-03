// 16-Bit Pixel Monsters: Detailed Sprites, Unique Mechanics & Hardcore Balanced AI
// Features: Orc Shields, Mecha Drone Spawners, Treant Regeneration & Rooting, Alien Lasers & Blink, Shadow Wolf Stealth Rush, Bosses

class AlienLaser {
    constructor(startX, startY, target, damage) {
        this.startX = startX;
        this.startY = startY;
        this.target = target;
        this.targetX = target.x;
        this.targetY = target.y;
        this.damage = damage;
        this.life = 0.16;
        this.maxLife = 0.16;
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Outer glow
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.round(this.startX), Math.round(this.startY));
        ctx.lineTo(Math.round(this.targetX), Math.round(this.targetY));
        ctx.stroke();

        // Inner beam core
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

class Enemy {
    constructor(mapPath, config) {
        this.path = mapPath;
        this.config = config;

        this.x = this.path[0].x;
        this.y = this.path[0].y;
        this.waypointIndex = 1;

        this.name = config.name || "Canavar";
        this.type = config.type || "orc";
        this.maxHp = config.hp || 250;
        this.hp = this.maxHp;

        // Speed variance: Wolves run super fast, Treants march slowly!
        this.baseSpeed = config.speed || 40;
        this.speed = this.baseSpeed;
        this.damage = config.damage || 25;
        this.attackRate = config.attackRate || 1.0;
        this.goldReward = config.gold || 5;
        this.xpReward = config.xp || 20;
        this.radius = config.radius || 9;
        this.isBoss = config.isBoss || false;

        // Specific Trait 1: Orc & Boss Shields (Absorbs physical & projectile damage first)
        this.maxShield = config.shield || 0;
        this.shield = this.maxShield;

        // Specific Trait 2: Treant Bark & Regeneration & Root Aura
        this.armorPhysical = config.armorPhysical || 0; // Reduces arrow damage
        this.regenRate = config.regenRate || 0;
        this.rootInterval = 6.5;
        this.rootCooldown = Math.random() * 2.0;

        // Specific Trait 3: Heavy Robot Drone Spawner
        this.isSpawner = config.isSpawner || false;
        this.droneInterval = 5.2;
        this.droneTimer = 2.0 + Math.random() * 2.0;

        // Specific Trait 4: Mini-Bot Kamikaze
        this.isMiniBot = config.isMiniBot || false;

        // Specific Trait 5: Alien Ranged Laser & Quantum Blink
        this.hasLaser = config.hasLaser || false;
        this.laserRange = 120;
        this.laserCooldown = 0.5 + Math.random() * 0.8;
        this.laserInterval = 1.9;
        this.laserDamage = config.laserDamage || 22;
        this.hasBlink = config.hasBlink || false;
        this.blinkCooldown = 0;

        // Specific Trait 6: Shadow Wolf Stealth Rush
        this.isStealthed = config.stealth || false;
        this.stealthTimer = config.stealth ? 3.0 : 0;

        // Specific Trait 7: Boss Stomp / Warcry
        this.stompInterval = 7.0;
        this.stompCooldown = 4.0;
        this.warcryInterval = 8.5;
        this.warcryCooldown = 3.0;

        // Specific Trait 8: Aerial / Flying Monsters (Immune to ground soldiers & bombs!)
        this.isFlying = config.isFlying || false;
        this.flyAltitude = this.isFlying ? 15 : 0;
        this.drakeSpitCooldown = 1.0;
        this.drakeSpitInterval = 2.8;

        // Specific Trait 9: Shaman Healer
        this.isShaman = config.isShaman || false;
        this.shamanCooldown = 2.0;
        this.shamanInterval = 4.2;

        this.attackCooldown = 0;
        this.blockedBy = null;
        this.dead = false;
        this.reachedEnd = false;
        this.slowTimer = 0;
        this.burnTimer = 0;
        this.burnDmg = 0;
        this.walkAnim = Math.random() * Math.PI * 2;
    }

    update(dt, hero, allFriendlies, effects, globalLasers, activeEnemies) {
        if (this.dead || this.reachedEnd) return;

        this.walkAnim += dt * (this.speed * 0.16);
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.laserCooldown > 0) this.laserCooldown -= dt;
        if (this.blinkCooldown > 0) this.blinkCooldown -= dt;
        if (this.rootCooldown > 0) this.rootCooldown -= dt;
        if (this.stompCooldown > 0) this.stompCooldown -= dt;
        if (this.warcryCooldown > 0) this.warcryCooldown -= dt;
        if (this.drakeSpitCooldown > 0) this.drakeSpitCooldown -= dt;
        if (this.shamanCooldown > 0) this.shamanCooldown -= dt;

        // Wing flap audio occasionally for flyers
        if (this.isFlying && Math.random() < 0.04) {
            sounds.playWingFlap();
        }

        // 1. Stealth Decay for Wolves
        if (this.isStealthed) {
            this.stealthTimer -= dt;
            if (this.stealthTimer <= 0) {
                this.isStealthed = false;
                effects.spawnSparks(this.x, this.y, '#9333ea', 6);
            }
        }

        // 2. Slow Timer
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) {
                this.speed = this.baseSpeed;
            }
        }

        // 3. Burn Status
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            let burnDmg = this.burnDmg * dt;
            // Treants are vulnerable to fire (+50% burn damage!)
            if (this.type === 'treant') burnDmg *= 1.5;
            this.takeDamage(burnDmg, effects, false);

            if (Math.random() < 0.28) {
                effects.particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 8,
                    this.y - Math.random() * 10,
                    (Math.random() - 0.5) * 0.5, -1,
                    '#f97316', 2, 0.25, 'square'
                ));
            }
        }

        // 4. Treant Natural Regeneration
        if (this.regenRate > 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
            if (Math.random() < 0.15) {
                effects.particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 10,
                    this.y - Math.random() * 12,
                    0, -0.6, '#4ade80', 2, 0.35, 'square'
                ));
            }
        }

        // 5. Treant Root Ability (Entangles hero and soldiers in vines)
        if (this.type === 'treant' && this.rootCooldown <= 0) {
            const distHero = Math.hypot(hero.x - this.x, hero.y - this.y);
            let rootedAny = false;

            if (!hero.dead && distHero <= 46) {
                hero.rootTimer = 1.3;
                rootedAny = true;
                effects.spawnSparks(hero.x, hero.y + 4, '#15803d', 6);
            }

            for (let f of allFriendlies) {
                if (!f.dead && Math.hypot(f.x - this.x, f.y - this.y) <= 46) {
                    f.rootTimer = 1.3;
                    rootedAny = true;
                    effects.spawnSparks(f.x, f.y + 4, '#15803d', 5);
                }
            }

            if (rootedAny) {
                this.rootCooldown = this.rootInterval;
                sounds.playRoot();
                effects.addText("SARMAŞIK KÖKÜ!", this.x, this.y - 18, '#22c55e', 9, 1.4);
            }
        }

        // 6. Heavy Robot Drone Spawner
        if (this.isSpawner && activeEnemies) {
            this.droneTimer -= dt;
            if (this.droneTimer <= 0) {
                this.droneTimer = this.droneInterval;
                sounds.playDroneSpawn();
                effects.spawnSparks(this.x, this.y - 8, '#f97316', 6);
                effects.addText("DRONE!", this.x, this.y - 18, '#ef4444', 8, 1.0);

                // Spawn Mini-Bot directly at current position along path
                const droneConfig = {
                    name: "Nano-Drone",
                    type: 'minibot',
                    hp: 110 + (this.config.waveScale || 1) * 15,
                    speed: 76,
                    damage: 32,
                    isMiniBot: true,
                    gold: 1,
                    xp: 6,
                    radius: 6
                };
                const drone = new Enemy(this.path, droneConfig);
                drone.x = this.x;
                drone.y = this.y;
                drone.waypointIndex = this.waypointIndex;
                activeEnemies.push(drone);
            }
        }

        // 7. Mini-Bot Kamikaze Detonation
        if (this.isMiniBot) {
            const distHero = Math.hypot(hero.x - this.x, hero.y - this.y);
            let shouldExplode = (!hero.dead && distHero <= 16);

            if (!shouldExplode) {
                for (let f of allFriendlies) {
                    if (!f.dead && Math.hypot(f.x - this.x, f.y - this.y) <= 14) {
                        shouldExplode = true;
                        break;
                    }
                }
            }

            if (shouldExplode) {
                this.dead = true;
                sounds.playBombExplode();
                effects.spawnExplosion(this.x, this.y, 30);
                effects.addText("PATLAMA!", this.x, this.y - 12, '#ef4444', 9, 1.2);

                if (!hero.dead && distHero <= 32) {
                    hero.takeDamage(this.damage, effects);
                }
                for (let f of allFriendlies) {
                    if (!f.dead && Math.hypot(f.x - this.x, f.y - this.y) <= 32) {
                        f.takeDamage(this.damage, effects);
                    }
                }
                return;
            }
        }

        // 8. Alien Quantum Blink (Teleports backwards along path when threatened)
        if (this.hasBlink && this.blinkCooldown <= 0) {
            const distHero = Math.hypot(hero.x - this.x, hero.y - this.y);
            if ((!hero.dead && distHero <= 40) || (this.hp < this.maxHp * 0.45)) {
                this.blink(effects);
                this.blinkCooldown = 9.0;
            }
        }

        // 9. Alien Ranged Laser Attack
        if (this.hasLaser && this.laserCooldown <= 0) {
            let laserTarget = null;
            let minDist = this.laserRange;

            if (!hero.dead) {
                const dHero = Math.hypot(hero.x - this.x, hero.y - this.y);
                if (dHero <= this.laserRange) {
                    laserTarget = hero;
                    minDist = dHero;
                }
            }

            for (let friendly of allFriendlies) {
                if (friendly.dead) continue;
                const d = Math.hypot(friendly.x - this.x, friendly.y - this.y);
                if (d < minDist) {
                    laserTarget = friendly;
                    minDist = d;
                }
            }

            if (laserTarget) {
                this.laserCooldown = this.laserInterval;
                sounds.playLaser();
                laserTarget.takeDamage(this.laserDamage, effects);
                effects.spawnSparks(laserTarget.x, laserTarget.y, '#ef4444', 4);
                if (globalLasers) {
                    globalLasers.push(new AlienLaser(this.x, this.y - 4, laserTarget, this.laserDamage));
                }
            }
        }

        // 10. Boss Stomp & Warcry Abilities
        if (this.isBoss) {
            if (this.stompCooldown <= 0) {
                this.stompCooldown = this.stompInterval;
                effects.shake(7, 0.45);
                sounds.playBombExplode();
                effects.addText("DEPREM DARBESİ!", this.x, this.y - 24, '#ef4444', 11, 1.8);

                // Knockback & damage nearby hero/soldiers
                const distHero = Math.hypot(hero.x - this.x, hero.y - this.y);
                if (!hero.dead && distHero <= 65) {
                    hero.takeDamage(45, effects);
                    const ang = Math.atan2(hero.y - this.y, hero.x - this.x);
                    hero.x += Math.cos(ang) * 16;
                    hero.y += Math.sin(ang) * 16;
                }

                for (let f of allFriendlies) {
                    if (!f.dead && Math.hypot(f.x - this.x, f.y - this.y) <= 60) {
                        f.takeDamage(45, effects);
                    }
                }
            }

            if (this.warcryCooldown <= 0 && activeEnemies) {
                this.warcryCooldown = this.warcryInterval;
                sounds.playUpgrade();
                effects.addText("SAVAŞ NARASI! (+HIZ)", this.x, this.y - 20, '#fbbf24', 10, 1.6);
                effects.spawnSparks(this.x, this.y, '#f59e0b', 14);

                activeEnemies.forEach(e => {
                    if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 120) {
                        e.speed = e.baseSpeed * 1.35;
                        setTimeout(() => { if (!e.dead) e.speed = e.baseSpeed; }, 3500);
                    }
                });
            }
        }

        // 10b. Airborne Fire Spit for Drake & Sky Wyvern Boss
        if ((this.type === 'drake' || this.type === 'boss_sky') && this.drakeSpitCooldown <= 0) {
            let fireTarget = null;
            if (!hero.dead && Math.hypot(hero.x - this.x, hero.y - this.y) <= 90) {
                fireTarget = hero;
            } else {
                for (let f of allFriendlies) {
                    if (!f.dead && Math.hypot(f.x - this.x, f.y - this.y) <= 85) {
                        fireTarget = f;
                        break;
                    }
                }
            }

            if (fireTarget) {
                this.drakeSpitCooldown = this.drakeSpitInterval;
                sounds.playBombExplode();
                fireTarget.takeDamage(this.damage, effects);
                effects.spawnExplosion(fireTarget.x, fireTarget.y, 22);
                effects.addText("ALEV!", fireTarget.x, fireTarget.y - 14, '#f97316', 8, 1.0);
            }
        }

        // 10c. Shaman Healing Chant
        if (this.isShaman && this.shamanCooldown <= 0 && activeEnemies) {
            let healTarget = null;
            let maxMissingHp = 0;
            for (let e of activeEnemies) {
                if (!e.dead && e !== this && e.hp < e.maxHp && Math.hypot(e.x - this.x, e.y - this.y) <= 90) {
                    const missing = e.maxHp - e.hp;
                    if (missing > maxMissingHp) {
                        maxMissingHp = missing;
                        healTarget = e;
                    }
                }
            }

            if (healTarget) {
                this.shamanCooldown = this.shamanInterval;
                sounds.playShamanCast();
                const healAmt = 55;
                healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + healAmt);
                effects.addText(`+${healAmt} HP`, healTarget.x, healTarget.y - 16, '#4ade80', 9, 1.2);
                effects.spawnSparks(healTarget.x, healTarget.y, '#22c55e', 8);
            }
        }

        // 11. Melee Combat with blocking soldier/peasant (Flying units never blocked!)
        if (!this.isFlying && this.blockedBy) {
            if (this.blockedBy.dead) {
                this.blockedBy = null;
            } else {
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackRate;
                    this.blockedBy.takeDamage(this.damage, effects);
                    sounds.playHit();
                }
                return;
            }
        }

        // 12. Melee Combat with Hero
        const distToHero = Math.hypot(hero.x - this.x, hero.y - this.y);
        if (!hero.dead && distToHero <= this.radius + hero.radius + 4) {
            if (this.attackCooldown <= 0) {
                this.attackCooldown = this.attackRate;
                hero.takeDamage(this.damage, effects);
                sounds.playHit();
            }
        }

        // 13. Move along waypoints
        const targetPoint = this.path[this.waypointIndex];
        if (!targetPoint) {
            this.reachedEnd = true;
            return;
        }

        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 3) {
            this.waypointIndex++;
            if (this.waypointIndex >= this.path.length) {
                this.reachedEnd = true;
            }
        } else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    blink(effects) {
        sounds.playBlink();
        effects.spawnSparks(this.x, this.y, '#c084fc', 8);

        // Jump 35px backwards along previous path
        if (this.waypointIndex > 1) {
            const prevPoint = this.path[this.waypointIndex - 1];
            const dx = prevPoint.x - this.x;
            const dy = prevPoint.y - this.y;
            const d = Math.hypot(dx, dy) || 1;
            this.x += (dx / d) * Math.min(38, d);
            this.y += (dy / d) * Math.min(38, d);
        } else {
            this.x = Math.max(8, this.x - 25);
        }

        effects.spawnSparks(this.x, this.y, '#a855f7', 8);
        effects.addText("IŞINLANMA!", this.x, this.y - 14, '#c084fc', 8, 1.2);
    }

    applySlow(amount = 0.5, duration = 2.0) {
        this.speed = this.baseSpeed * (1 - amount);
        this.slowTimer = duration;
    }

    applyBurn(damagePerSec = 45, duration = 4.0) {
        this.burnDmg = damagePerSec;
        this.burnTimer = duration;
    }

    takeDamage(amount, effects, showFloater = true, isArrow = false) {
        if (this.dead || this.reachedEnd) return;

        let remainingDamage = amount;

        // Specific Trait 1: Orc & Boss Shields
        if (this.shield > 0) {
            const shieldDmg = Math.min(this.shield, remainingDamage);
            this.shield -= shieldDmg;
            remainingDamage -= shieldDmg;

            effects.spawnSparks(this.x, this.y, '#38bdf8', 3);
            if (showFloater && shieldDmg >= 3) {
                effects.addText(`🛡️-${Math.round(shieldDmg)}`, this.x, this.y - 12, '#38bdf8', 8);
            }

            if (this.shield <= 0) {
                this.shield = 0;
                sounds.playShieldBreak();
                effects.spawnSparks(this.x, this.y, '#38bdf8', 12);
                effects.addText("KALKAN PARÇALANDI!", this.x, this.y - 16, '#38bdf8', 9, 1.5);
            }
        }

        if (remainingDamage <= 0) return;

        // Physical Arrow Resistance
        let effectiveAmount = remainingDamage;
        if (isArrow && this.armorPhysical > 0) {
            effectiveAmount = Math.max(2, Math.round(remainingDamage * (1 - this.armorPhysical)));
        }

        this.hp -= effectiveAmount;
        if (showFloater && effectiveAmount >= 3) {
            effects.addText(`-${Math.round(effectiveAmount)}`, this.x, this.y - 8, '#ffffff', 8);
        }

        if (this.hp <= 0) {
            this.die(effects);
        }
    }

    die(effects) {
        if (this.dead) return;
        this.dead = true;
        this.hp = 0;

        if (this.blockedBy && this.blockedBy.blockingTarget === this) {
            this.blockedBy.blockingTarget = null;
        }

        effects.spawnBlood(this.x, this.y, this.isBoss ? 20 : 8);
        effects.addText(`+${this.goldReward}G`, this.x, this.y - 12, '#fde047', 9, 1.2);
        sounds.playCoin();

        window.onEnemyKilled(this);
    }

    // High-Detail 16-Bit Pixel Art Enemy Sprite Drawing
    draw(ctx) {
        if (this.dead || this.reachedEnd) return;

        const ex = Math.round(this.x);
        const ey = Math.round(this.y);

        ctx.save();
        ctx.translate(ex, ey);

        // Stealth transparency for wolves
        if (this.isStealthed) {
            ctx.globalAlpha = 0.38;
        }

        // Ground Pixel Shadow (stays on the ground)
        ctx.fillStyle = '#1b2e18';
        ctx.fillRect(-this.radius, this.radius * 0.7, this.radius * 2, 2);

        // Airborne flight offset with wing flutter
        if (this.isFlying) {
            const flutter = Math.round(Math.sin(this.walkAnim * 2.5) * 2);
            ctx.translate(0, -this.flyAltitude + flutter);
        }

        if (this.type === 'orc') {
            // ==========================================
            // 1. DETAILED PIXEL ORC WARRIOR
            // ==========================================
            const bob = Math.round(Math.sin(this.walkAnim) * 1.5);

            // Shod Iron Boots & Green Legs
            ctx.fillStyle = '#14532d';
            ctx.fillRect(-5, 4 + bob, 3, 5);
            ctx.fillRect(2, 4 - bob, 3, 5);
            ctx.fillStyle = '#1e293b'; // boots
            ctx.fillRect(-6, 7 + bob, 4, 3);
            ctx.fillRect(1, 7 - bob, 4, 3);

            // Muscular Green Torso & Studded Armor
            ctx.fillStyle = '#166534';
            ctx.fillRect(-7, -6 + bob, 14, 10);
            ctx.fillStyle = '#334155'; // iron cuirass
            ctx.fillRect(-5, -4 + bob, 10, 7);
            ctx.fillStyle = '#78350f'; // leather harness
            ctx.fillRect(-6, -2 + bob, 12, 2);
            ctx.fillStyle = '#94a3b8'; // iron belt buckle
            ctx.fillRect(-1, 1 + bob, 3, 3);

            // Spiked Iron Pauldrons (Shoulders)
            ctx.fillStyle = '#475569';
            ctx.fillRect(-9, -7 + bob, 4, 4);
            ctx.fillRect(5, -7 + bob, 4, 4);
            ctx.fillStyle = '#cbd5e1'; // metal spikes
            ctx.fillRect(-8, -9 + bob, 2, 2);
            ctx.fillRect(6, -9 + bob, 2, 2);

            // Head, Cowl & Horned Iron Helmet
            ctx.fillStyle = '#15803d'; // head
            ctx.fillRect(-4, -10 + bob, 8, 6);
            ctx.fillStyle = '#334155'; // iron helmet
            ctx.fillRect(-5, -12 + bob, 10, 4);
            ctx.fillStyle = '#475569'; // brow guard
            ctx.fillRect(-4, -9 + bob, 8, 2);
            // Horns
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(-7, -14 + bob, 2, 4);
            ctx.fillRect(-8, -16 + bob, 2, 3);
            ctx.fillRect(5, -14 + bob, 2, 4);
            ctx.fillRect(6, -16 + bob, 2, 3);

            // Red Piercing Eyes & Upturned Tusks
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-3, -8 + bob, 2, 1);
            ctx.fillRect(1, -8 + bob, 2, 1);
            ctx.fillStyle = '#f8fafc'; // tusks
            ctx.fillRect(-3, -6 + bob, 1, 3);
            ctx.fillRect(2, -6 + bob, 1, 3);

            // Right Hand: Heavy Jagged Battle-Axe
            ctx.fillStyle = '#78350f'; // axe haft
            ctx.fillRect(8, -12 + bob, 2, 16);
            ctx.fillStyle = '#94a3b8'; // iron blade
            ctx.fillRect(10, -11 + bob, 4, 6);
            ctx.fillRect(9, -13 + bob, 3, 3);
            ctx.fillRect(9, -6 + bob, 3, 3);
            ctx.fillStyle = '#b91c1c'; // blood stains
            ctx.fillRect(12, -9 + bob, 2, 3);

            // Left Hand: Spiked Shield (Only visible while shield > 0)
            if (this.shield > 0) {
                // Round Oak Wood Shield with Iron Studded Rim
                ctx.fillStyle = '#451a03';
                ctx.fillRect(-12, -7 + bob, 6, 12);
                ctx.fillStyle = '#78350f';
                ctx.fillRect(-11, -6 + bob, 4, 10);
                // Iron boss & rim
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-13, -8 + bob, 8, 2);
                ctx.fillRect(-13, 3 + bob, 8, 2);
                ctx.fillRect(-10, -3 + bob, 3, 4); // center metal boss
                // Crack if damaged
                if (this.shield < this.maxShield * 0.5) {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(-11, -4 + bob, 3, 2);
                }
            }

        } else if (this.type === 'treant') {
            // ==========================================
            // 2. DETAILED ANCIENT TREANT (WOODFIEND)
            // ==========================================
            const sway = Math.round(Math.sin(this.walkAnim) * 1.5);

            // Stumping Root Legs
            ctx.fillStyle = '#271406';
            ctx.fillRect(-7, 5 + sway, 4, 6);
            ctx.fillRect(3, 5 - sway, 4, 6);
            ctx.fillStyle = '#15803d'; // moss on roots
            ctx.fillRect(-8, 9 + sway, 5, 2);
            ctx.fillRect(2, 9 - sway, 5, 2);

            // Thick Gnarled Ancient Trunk
            ctx.fillStyle = '#3f2512';
            ctx.fillRect(-10, -13, 20, 19);
            // Deep bark crevices
            ctx.fillStyle = '#1c0f04';
            ctx.fillRect(-6, -11, 2, 16);
            ctx.fillRect(3, -9, 2, 14);
            ctx.fillRect(-1, -6, 2, 10);

            // Creeping Green Moss & Vines
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(-9, -10, 3, 6);
            ctx.fillRect(5, -7, 4, 5);
            ctx.fillStyle = '#86efac';
            ctx.fillRect(-8, -8, 1, 2);
            ctx.fillRect(6, -5, 1, 2);

            // Branch Arms with Foliage
            ctx.fillStyle = '#573318';
            ctx.fillRect(-14, -8 + sway, 5, 4);
            ctx.fillRect(9, -8 - sway, 5, 4);
            ctx.fillStyle = '#15803d'; // leaves on knuckles
            ctx.fillRect(-16, -9 + sway, 3, 5);
            ctx.fillRect(13, -9 - sway, 3, 5);

            // Gnarled Antler Horn Branches & Foliage Canopy
            ctx.fillStyle = '#3f2512';
            ctx.fillRect(-9, -17, 3, 5);
            ctx.fillRect(6, -17, 3, 5);
            ctx.fillStyle = '#15803d';
            ctx.fillRect(-12, -21, 24, 6);
            ctx.fillStyle = '#22c55e'; // bright leaf highlights
            ctx.fillRect(-9, -23, 18, 4);
            ctx.fillRect(-5, -25, 10, 3);

            // Hollow Glowing Amber Eyes & Gaping Maw
            ctx.fillStyle = '#f97316';
            ctx.fillRect(-5, -7, 3, 2);
            ctx.fillRect(2, -7, 3, 2);
            ctx.fillStyle = '#fde047'; // eye pupils
            ctx.fillRect(-4, -7, 1, 1);
            ctx.fillRect(3, -7, 1, 1);
            // Jagged mouth
            ctx.fillStyle = '#0f0802';
            ctx.fillRect(-3, -2, 6, 3);
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(-2, -1, 4, 1);

        } else if (this.type === 'robot') {
            // ==========================================
            // 3. DETAILED HEAVY MECHA SLASHER
            // ==========================================
            const b = Math.round(Math.sin(this.walkAnim * 1.6) * 1.5);

            // Hydraulic Piston Legs & Steel Feet
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-6, 5 + b, 4, 5);
            ctx.fillRect(2, 5 - b, 4, 5);
            ctx.fillStyle = '#475569';
            ctx.fillRect(-7, 8 + b, 5, 3);
            ctx.fillRect(1, 8 - b, 5, 3);

            // Twin Exhaust Smokestacks on Back
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-7, -13 + b, 3, 5);
            ctx.fillRect(4, -13 + b, 3, 5);
            // Steam / exhaust particle
            if (Math.random() < 0.25) {
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-7, -15 + b, 2, 2);
            }

            // Armored Gunmetal Chassis
            ctx.fillStyle = '#334155';
            ctx.fillRect(-9, -9 + b, 18, 15);
            ctx.fillStyle = '#475569';
            ctx.fillRect(-8, -8 + b, 16, 13);
            // Rivets
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-7, -7 + b, 1, 1);
            ctx.fillRect(6, -7 + b, 1, 1);
            ctx.fillRect(-7, 3 + b, 1, 1);
            ctx.fillRect(6, 3 + b, 1, 1);

            // Diagonal Hazard Warning Stripes
            ctx.fillStyle = '#eab308'; // yellow
            ctx.fillRect(-6, 0 + b, 12, 3);
            ctx.fillStyle = '#0f172a'; // black stripes
            ctx.fillRect(-5, 0 + b, 2, 3);
            ctx.fillRect(-1, 0 + b, 2, 3);
            ctx.fillRect(3, 0 + b, 2, 3);

            // Scanning Cyan Eye Visor
            ctx.fillStyle = '#020617';
            ctx.fillRect(-6, -5 + b, 12, 3);
            ctx.fillStyle = '#06b6d4';
            const scan = Math.round(Math.sin(Date.now() * 0.009) * 4);
            ctx.fillRect(-1 + scan, -5 + b, 3, 3);
            ctx.fillStyle = '#ec4899'; // laser focal dot
            ctx.fillRect(0 + scan, -4 + b, 1, 1);

            // Left Arm: Steel Hydraulic Pincer
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-12, -4 + b, 4, 3);
            ctx.fillRect(-14, -6 + b, 3, 7);

            // Right Arm: Dynamic Rotating Diamond Sawblade!
            ctx.fillStyle = '#475569';
            ctx.fillRect(8, -4 + b, 3, 3);
            // Spinning blade disc
            const sawAng = (Date.now() * 0.02) % (Math.PI * 2);
            ctx.save();
            ctx.translate(13, -2 + b);
            ctx.rotate(sawAng);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-5, -5, 10, 10);
            ctx.fillStyle = '#f8fafc'; // blade teeth
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillRect(-2, -6, 4, 12);
            ctx.fillStyle = '#ef4444'; // red center hub
            ctx.fillRect(-2, -2, 4, 4);
            ctx.restore();

        } else if (this.type === 'minibot') {
            // ==========================================
            // 4. DETAILED NANO-DRONE / SPIDER-BOT
            // ==========================================
            const legWiggle = Math.round(Math.sin(this.walkAnim * 3) * 2);

            // 4 Scampering Spider Legs
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-7, 0 + legWiggle, 3, 4);
            ctx.fillRect(4, 0 - legWiggle, 3, 4);
            ctx.fillRect(-6, 3 - legWiggle, 2, 3);
            ctx.fillRect(4, 3 + legWiggle, 2, 3);

            // Metallic Chrome Sphere Core
            ctx.fillStyle = '#334155';
            ctx.fillRect(-5, -5, 10, 8);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-4, -4, 8, 6);

            // Blinking Red Sensor Eye
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-2, -3, 4, 3);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-1, -2, 2, 1);

            // Antenna & LED
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(1, -7, 1, 3);
            ctx.fillStyle = (Date.now() % 300 < 150) ? '#ef4444' : '#eab308';
            ctx.fillRect(0, -9, 3, 2);

        } else if (this.type === 'alien') {
            // ==========================================
            // 5. DETAILED ALIEN SHOCKTROOPER
            // ==========================================
            const h = Math.round(Math.sin(this.walkAnim * 1.4) * 1.5);

            // Hover Ion Exhaust
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-2, 7 + h, 4, 2);
            ctx.fillStyle = '#93c5fd';
            ctx.fillRect(-1, 8 + h, 2, 2);

            // Sleek Biomechanical Suit
            ctx.fillStyle = '#3b0764';
            ctx.fillRect(-4, -2 + h, 8, 9);
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(-3, -1 + h, 6, 7);
            // Glowing energy conduits
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(-1, 0 + h, 2, 5);

            // Elongated Alien Head & Dark Visor
            ctx.fillStyle = '#581c87';
            ctx.fillRect(-6, -11 + h, 12, 10);
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(-5, -13 + h, 10, 4);
            ctx.fillRect(-3, -15 + h, 6, 3);

            // Iridescent Obsidian Visor
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-5, -9 + h, 10, 4);
            ctx.fillStyle = '#c084fc'; // visor reflection
            ctx.fillRect(-4, -8 + h, 3, 2);
            ctx.fillRect(1, -8 + h, 3, 2);

            // Two-Handed Plasma Sniper Rifle
            ctx.fillStyle = '#18181b';
            ctx.fillRect(2, 0 + h, 11, 3);
            ctx.fillRect(4, -1 + h, 4, 2); // scope
            // Plasma coil
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(6, 1 + h, 3, 1);
            // Laser sight dot
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(13, 0 + h, 2, 2);

            // Quantum Barrier Field (hexagonal aura pulse)
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-9, -16 + h, 18, 26);

        } else if (this.type === 'wolf') {
            // ==========================================
            // 6. DETAILED SHADOW WOLF (FERAL PREDATOR)
            // ==========================================
            const wWalk = Math.round(Math.sin(this.walkAnim * 2) * 2);

            // Bounding Paws & Claws
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-8, 3 + wWalk, 3, 5);
            ctx.fillRect(5, 3 - wWalk, 3, 5);
            ctx.fillRect(-4, 3 - wWalk, 3, 4);
            ctx.fillRect(2, 3 + wWalk, 3, 4);

            // Arched Spine & Midnight Fur Coat
            ctx.fillStyle = '#090d16';
            ctx.fillRect(-9, -5 + wWalk, 18, 8);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-8, -4 + wWalk, 16, 6);
            ctx.fillStyle = '#334155'; // fur highlights
            ctx.fillRect(-6, -3 + wWalk, 12, 3);

            // Bushy Layered Tail
            ctx.fillStyle = '#090d16';
            ctx.fillRect(-13, -7 + wWalk, 4, 5);
            ctx.fillRect(-15, -9 + wWalk, 3, 4);

            // Snouted Wolf Head & Sharp Fangs
            ctx.fillStyle = '#090d16';
            ctx.fillRect(6, -8 + wWalk, 8, 7);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(7, -7 + wWalk, 6, 5);
            // Snout
            ctx.fillRect(12, -5 + wWalk, 4, 3);
            ctx.fillStyle = '#000000'; // black nose
            ctx.fillRect(15, -6 + wWalk, 2, 2);
            // Pointed Ears
            ctx.fillStyle = '#334155';
            ctx.fillRect(7, -11 + wWalk, 2, 4);
            ctx.fillRect(10, -11 + wWalk, 2, 4);

            // Glowing Sulfur Yellow Eyes & Fangs
            ctx.fillStyle = '#fde047';
            ctx.fillRect(10, -7 + wWalk, 2, 1);
            ctx.fillStyle = '#f8fafc'; // white fangs
            ctx.fillRect(13, -3 + wWalk, 1, 2);
            ctx.fillRect(15, -3 + wWalk, 1, 2);

            // Shadow aura wisps behind wolf
            if (Math.random() < 0.3) {
                ctx.fillStyle = '#7c3aed';
                ctx.fillRect(-11, -2 + wWalk, 2, 2);
            }

        } else if (this.type === 'bat') {
            // ==========================================
            // 7. GÖLGE YARASASI (KANATLI İBLİS) - FLYING
            // ==========================================
            const wingFlap = Math.round(Math.sin(this.walkAnim * 3) * 5);

            // Leathery Bat Wings (Left & Right)
            ctx.fillStyle = '#4a044e'; // dark magenta
            ctx.fillRect(-12, -8 + wingFlap, 8, 8);
            ctx.fillRect(4, -8 - wingFlap, 8, 8);
            ctx.fillStyle = '#701a75';
            ctx.fillRect(-14, -6 + wingFlap, 4, 4);
            ctx.fillRect(10, -6 - wingFlap, 4, 4);

            // Furry Body
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(-4, -4, 8, 8);

            // Bat Head, Pointed Ears & Red Glowing Eyes
            ctx.fillStyle = '#311042';
            ctx.fillRect(-3, -7, 6, 5);
            ctx.fillStyle = '#701a75'; // ears
            ctx.fillRect(-4, -10, 2, 4);
            ctx.fillRect(2, -10, 2, 4);
            ctx.fillStyle = '#ef4444'; // glowing red eyes
            ctx.fillRect(-2, -5, 1, 1);
            ctx.fillRect(1, -5, 1, 1);
            ctx.fillStyle = '#ffffff'; // tiny fangs
            ctx.fillRect(-1, -3, 1, 1);
            ctx.fillRect(0, -3, 1, 1);

        } else if (this.type === 'drake') {
            // ==========================================
            // 8. ALEV EJDERCİĞİ (FIRE WYVERN) - FLYING
            // ==========================================
            const wingFlap = Math.round(Math.sin(this.walkAnim * 2.2) * 6);

            // Scaled Beating Dragon Wings
            ctx.fillStyle = '#7f1d1d'; // dark crimson
            ctx.fillRect(-15, -10 + wingFlap, 11, 12);
            ctx.fillRect(4, -10 - wingFlap, 11, 12);
            ctx.fillStyle = '#ea580c'; // wing membrane
            ctx.fillRect(-14, -8 + wingFlap, 8, 8);
            ctx.fillRect(6, -8 - wingFlap, 8, 8);

            // Scaled Reptilian Body & Barbed Tail
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(-5, -5, 10, 10);
            ctx.fillStyle = '#b91c1c'; // spiky back
            ctx.fillRect(-1, -7, 2, 3);
            ctx.fillStyle = '#7f1d1d'; // tail
            ctx.fillRect(-10, -1, 6, 3);
            ctx.fillRect(-12, 1, 3, 3);

            // Horned Dragon Head
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(5, -6, 7, 6);
            ctx.fillStyle = '#fbbf24'; // yellow eye
            ctx.fillRect(8, -5, 2, 1);
            ctx.fillStyle = '#451a03'; // horns
            ctx.fillRect(4, -9, 2, 4);
            // Smoking Nostril
            if (Math.random() < 0.3) {
                ctx.fillStyle = '#f97316';
                ctx.fillRect(12, -4, 2, 2);
            }

        } else if (this.type === 'shaman') {
            // ==========================================
            // 9. ORK ŞAMANI (TRIBAL NECROMANCER)
            // ==========================================
            const bob = Math.round(Math.sin(this.walkAnim) * 1.5);

            // Rustic Brown Shamanic Robes
            ctx.fillStyle = '#451a03';
            ctx.fillRect(-6, -4 + bob, 12, 12);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-5, -2 + bob, 10, 8);
            ctx.fillStyle = '#f8fafc'; // bone bead necklace
            ctx.fillRect(-4, -1 + bob, 8, 2);

            // Wolf Skull Cowl Headdress
            ctx.fillStyle = '#e2e8f0'; // skull helmet
            ctx.fillRect(-5, -11 + bob, 10, 7);
            ctx.fillStyle = '#0f172a'; // hollow eye sockets
            ctx.fillRect(-3, -8 + bob, 2, 2);
            ctx.fillRect(1, -8 + bob, 2, 2);
            ctx.fillStyle = '#22c55e'; // glowing green spiritual pupils
            ctx.fillRect(-2, -7 + bob, 1, 1);
            ctx.fillRect(2, -7 + bob, 1, 1);
            ctx.fillStyle = '#cbd5e1'; // skull snout
            ctx.fillRect(-2, -5 + bob, 4, 2);

            // Shamanic Crooked Oak Staff with Glowing Emerald
            ctx.fillStyle = '#78350f'; // staff
            ctx.fillRect(7, -13 + bob, 2, 18);
            ctx.fillStyle = '#15803d'; // staff prongs
            ctx.fillRect(6, -15 + bob, 4, 3);
            ctx.fillStyle = '#4ade80'; // pulsating green spirit orb
            const orbPulse = (Date.now() % 400 < 200) ? 4 : 3;
            ctx.fillRect(6, -17 + bob, orbPulse, orbPulse);

        } else if (this.type === 'boss_sky') {
            // ==========================================
            // 10. GÖK KORSANI WYVERN (SKY TERROR BOSS)
            // ==========================================
            const wingFlap = Math.round(Math.sin(this.walkAnim * 2.0) * 9);

            // Giant Flying Demon Wings
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(-24, -16 + wingFlap, 18, 20);
            ctx.fillRect(6, -16 - wingFlap, 18, 20);
            ctx.fillStyle = '#dc2626'; // glowing fiery wing webbing
            ctx.fillRect(-22, -13 + wingFlap, 14, 14);
            ctx.fillRect(8, -13 - wingFlap, 14, 14);

            // Colossal Dragon Torso & Golden Spines
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(-9, -8, 18, 16);
            ctx.fillStyle = '#fbbf24'; // gold spine ridges
            ctx.fillRect(-3, -12, 6, 5);

            // Horned Dragon Skull with Burning Visor
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(9, -10, 11, 10);
            ctx.fillStyle = '#ef4444'; // fiery eyes
            ctx.fillRect(13, -8, 4, 2);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(14, -7, 2, 1);
            // Great Horns
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(8, -15, 3, 6);
            ctx.fillRect(11, -17, 3, 4);

            // Fire Embers falling from sky boss
            if (Math.random() < 0.4) {
                ctx.fillStyle = '#f97316';
                ctx.fillRect(-10 + Math.random() * 20, 8, 3, 3);
            }

        } else if (this.isBoss) {
            // ==========================================
            // 7. DETAILED FINAL BOSS: KARA ORK EFENDİSİ
            // ==========================================
            const bb = Math.round(Math.sin(this.walkAnim) * 1.5);

            // Heavy Demon Boots
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-9, 10 + bb, 6, 6);
            ctx.fillRect(3, 10 - bb, 6, 6);

            // Colossal Obsidian Demon Plate Armor
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(-15, -14 + bb, 30, 24);
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(-13, -12 + bb, 26, 20);

            // Crimson Cape Flowing in the Wind
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(-18, -10 + bb, 4, 20);
            ctx.fillRect(14, -10 + bb, 4, 20);

            // Spiked Skull Belt
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-6, 3 + bb, 12, 4);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-2, 3 + bb, 4, 4);

            // Massive Horned Crown of Dread
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-12, -18 + bb, 24, 5);
            ctx.fillRect(-12, -22 + bb, 4, 4);
            ctx.fillRect(-2, -24 + bb, 4, 6);
            ctx.fillRect(8, -22 + bb, 4, 4);

            // Burning Glowing Crimson Visor / Eyes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-8, -8 + bb, 16, 4);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-6, -7 + bb, 4, 2);
            ctx.fillRect(2, -7 + bb, 4, 2);

            // Flaming Demonic Greatsword
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(17, -24 + bb, 3, 36);
            ctx.fillStyle = '#ef4444'; // fiery blade edge
            ctx.fillRect(15, -22 + bb, 7, 24);
            ctx.fillStyle = '#fde047'; // core flame
            ctx.fillRect(17, -20 + bb, 3, 20);
        }

        // ==========================================
        // HEALTH & SHIELD BARS (DUAL TIER)
        // ==========================================
        const barW = Math.max(18, this.radius * 2 + 2);
        const hpPct = Math.max(0, this.hp / this.maxHp);
        const barY = -this.radius - 8;

        // 1. Regular Health Bar
        ctx.fillStyle = '#000000';
        ctx.fillRect(-barW / 2, barY, barW, 3);
        ctx.fillStyle = this.isBoss ? '#ef4444' : (hpPct > 0.45 ? '#22c55e' : (hpPct > 0.2 ? '#eab308' : '#ef4444'));
        ctx.fillRect(-barW / 2, barY, Math.round(barW * hpPct), 3);

        // 2. Cyan Shield Bar (If unit has a shield)
        if (this.maxShield > 0 && this.shield > 0) {
            const shieldPct = Math.max(0, this.shield / this.maxShield);
            const sY = barY - 4;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-barW / 2, sY, barW, 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-barW / 2, sY, Math.round(barW * shieldPct), 2);
        }

        ctx.restore();
    }
}
