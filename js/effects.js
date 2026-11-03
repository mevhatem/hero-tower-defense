// 16-Bit Pixel Effects, Square Particles, Floating Numbers, and Pixel Meteors

class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'square') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = Math.max(1, Math.round(size));
        this.maxLife = life;
        this.life = life;
        this.shape = shape;
        this.gravity = 0;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vy += this.gravity * dt * 60;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        const px = Math.round(this.x);
        const py = Math.round(this.y);
        ctx.fillStyle = this.color;
        const s = Math.max(1, Math.round(this.size * (this.life / this.maxLife)));
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
        ctx.restore();
    }
}

class FloatingText {
    constructor(text, x, y, color = '#ffffff', fontSize = 9, life = 0.9) {
        this.text = text;
        this.x = Math.round(x + (Math.random() - 0.5) * 6);
        this.y = Math.round(y);
        this.color = color;
        this.fontSize = fontSize;
        this.maxLife = life;
        this.life = life;
        this.vy = -0.7;
    }

    update(dt) {
        this.y += this.vy * dt * 60;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.font = `bold ${this.fontSize}px 'Silkscreen', monospace`;
        ctx.textAlign = 'center';
        // Black outline
        ctx.fillStyle = '#000000';
        ctx.fillText(this.text, this.x + 1, this.y + 1);
        ctx.fillText(this.text, this.x - 1, this.y - 1);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Meteor {
    constructor(targetX, targetY, onImpact) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.startX = targetX + 90 + (Math.random() - 0.5) * 30;
        this.startY = -50;
        this.x = this.startX;
        this.y = this.startY;
        this.speed = 460;
        this.onImpact = onImpact;
        this.arrived = false;

        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        this.angle = Math.atan2(dy, dx);
    }

    update(dt, effects) {
        if (this.arrived) return false;

        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Pixel Fire Trail
        for (let i = 0; i < 2; i++) {
            effects.particles.push(new Particle(
                this.x + (Math.random() - 0.5) * 6,
                this.y + (Math.random() - 0.5) * 6,
                -Math.cos(this.angle) * (1 + Math.random()),
                -Math.sin(this.angle) * (1 + Math.random()),
                Math.random() > 0.4 ? '#f97316' : '#ef4444',
                Math.random() * 3 + 2, 0.25, 'square'
            ));
        }

        const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        if (this.y >= this.targetY || dist < 12) {
            this.arrived = true;
            if (typeof this.onImpact === 'function') {
                try {
                    this.onImpact(this.targetX, this.targetY);
                } catch (err) {
                    console.error("Meteor onImpact error:", err);
                }
            }
            return false;
        }

        return true;
    }

    draw(ctx) {
        const mx = Math.round(this.x);
        const my = Math.round(this.y);
        const tx = Math.round(this.targetX);
        const ty = Math.round(this.targetY);

        ctx.save();
        // Target indicator on ground
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx - 30, ty - 30, 60, 60);

        // Meteor Rock
        ctx.fillStyle = '#fde047';
        ctx.fillRect(mx - 6, my - 6, 12, 12);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(mx - 4, my - 4, 8, 8);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(mx - 2, my - 2, 4, 4);

        ctx.restore();
    }
}

class GroundDecal {
    constructor(x, y, radius = 45, duration = 5.0) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.radius = Math.round(radius);
        this.maxLife = duration;
        this.life = duration;
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#1c1917';
        const r = this.radius;
        // Pixel Scorched Diamond
        ctx.fillRect(this.x - r * 0.7, this.y - r * 0.3, r * 1.4, r * 0.6);
        ctx.fillRect(this.x - r * 0.5, this.y - r * 0.5, r, r);
        ctx.restore();
    }
}

class EffectsManager {
    constructor() {
        this.particles = [];
        this.texts = [];
        this.meteors = [];
        this.decals = [];
        this.screenShakeTime = 0;
        this.shakeMagnitude = 0;
    }

    shake(amount = 4, duration = 0.25) {
        this.shakeMagnitude = Math.max(this.shakeMagnitude, amount);
        this.screenShakeTime = Math.max(this.screenShakeTime, duration);
    }

    addText(text, x, y, color = '#ffffff', fontSize = 9, life = 0.9) {
        this.texts.push(new FloatingText(text, x, y, color, fontSize, life));
    }

    spawnBlood(x, y, amount = 6) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            const p = new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.3 ? '#b91c1c' : '#7f1d1d',
                Math.random() * 2 + 1, 0.25, 'square'
            );
            p.gravity = 0.1;
            this.particles.push(p);
        }
    }

    spawnSparks(x, y, color = '#fbbf24', amount = 6) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2.5 + 1;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color, 2, 0.2, 'square'
            ));
        }
    }

    spawnSlashArc(x, y, angle, radius = 22) {
        for (let i = -0.5; i <= 0.5; i += 0.18) {
            const a = angle + i * 1.1;
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            this.particles.push(new Particle(
                px, py,
                Math.cos(a) * 0.8,
                Math.sin(a) * 0.8,
                '#67e8f9', 2, 0.15, 'square'
            ));
        }
    }

    spawnExplosion(x, y, radius = 50) {
        this.shake(5, 0.35);
        this.decals.push(new GroundDecal(x, y, radius));

        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.5 ? '#f97316' : '#eab308',
                Math.random() * 4 + 2, 0.35, 'square'
            ));
        }
    }

    launchMeteor(targetX, targetY, onImpact) {
        this.meteors.push(new Meteor(targetX, targetY, onImpact));
    }

    update(dt) {
        if (this.screenShakeTime > 0) {
            this.screenShakeTime -= dt;
            if (this.screenShakeTime <= 0) {
                this.shakeMagnitude = 0;
            }
        }

        try { this.decals = this.decals.filter(d => d.update(dt)); } catch (e) {}
        try { this.particles = this.particles.filter(p => p.update(dt)); } catch (e) {}
        try { this.texts = this.texts.filter(t => t.update(dt)); } catch (e) {}
        try { this.meteors = this.meteors.filter(m => m.update(dt, this)); } catch (e) {}
    }

    drawDecals(ctx) {
        try { this.decals.forEach(d => d.draw(ctx)); } catch (e) {}
    }

    draw(ctx) {
        try { this.meteors.forEach(m => m.draw(ctx)); } catch (e) {}
        try { this.particles.forEach(p => p.draw(ctx)); } catch (e) {}
        try { this.texts.forEach(t => t.draw(ctx)); } catch (e) {}
    }

    applyShake(ctx) {
        if (this.screenShakeTime > 0) {
            const ox = Math.round((Math.random() - 0.5) * 2 * this.shakeMagnitude);
            const oy = Math.round((Math.random() - 0.5) * 2 * this.shakeMagnitude);
            ctx.translate(ox, oy);
        }
    }
}
