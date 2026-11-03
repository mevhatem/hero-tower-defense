// Terraria & Stardew Valley Inspired 16/32-Bit Pixel Map with 3 Distinct Biomes:
// 1. Infernal Hell / Nether (Left: Volcanic Ash, Lava Fissures, Charred Trees & Demonic Portal)
// 2. Lush Meadow (Middle: Emerald Grass, Babbling Stream, Apple & Birch Trees, Flowers, Waterlilies)
// 3. Village Entrance (Right: Cozy Cottages with Smoking Chimneys, Warm Windows, Wishing Well & Village Signpost)

class GameMap {
    constructor(width = 640, height = 360) {
        this.width = width;
        this.height = height;

        // Path waypoints for 640x360 native pixel space
        this.path = [
            { x: -25, y: 180 },
            { x: 110, y: 180 },
            { x: 110, y: 90 },
            { x: 280, y: 90 },
            { x: 280, y: 265 },
            { x: 460, y: 265 },
            { x: 460, y: 155 },
            { x: 665, y: 155 }
        ];

        // Tower spots placed strategically along the road curves
        this.towerSpots = [
            { id: 1,  x: 70,  y: 135, radius: 15, tower: null, rallyPoint: { x: 70,  y: 180 }, biome: 'infernal' },
            { id: 2,  x: 150, y: 135, radius: 15, tower: null, rallyPoint: { x: 110, y: 135 }, biome: 'infernal' },
            { id: 3,  x: 195, y: 50,  radius: 15, tower: null, rallyPoint: { x: 195, y: 90  }, biome: 'meadow'   },
            { id: 4,  x: 240, y: 135, radius: 15, tower: null, rallyPoint: { x: 280, y: 135 }, biome: 'meadow'   },
            { id: 5,  x: 320, y: 135, radius: 15, tower: null, rallyPoint: { x: 280, y: 135 }, biome: 'meadow'   },
            { id: 6,  x: 240, y: 220, radius: 15, tower: null, rallyPoint: { x: 280, y: 220 }, biome: 'meadow'   },
            { id: 7,  x: 370, y: 305, radius: 15, tower: null, rallyPoint: { x: 370, y: 265 }, biome: 'meadow'   },
            { id: 8,  x: 420, y: 225, radius: 15, tower: null, rallyPoint: { x: 460, y: 225 }, biome: 'village'  },
            { id: 9,  x: 500, y: 225, radius: 15, tower: null, rallyPoint: { x: 460, y: 225 }, biome: 'village'  },
            { id: 10, x: 530, y: 115, radius: 15, tower: null, rallyPoint: { x: 500, y: 155 }, biome: 'village'  }
        ];

        this.scenery = this.generateScenery();
    }

    generateScenery() {
        return [
            // ================= INFERNAL NETHER SCENERY (Left: x < 170) =================
            { x: 35,  y: 55,  type: 'charred_tree', size: 24 },
            { x: 75,  y: 35,  type: 'brimstone_crystal' },
            { x: 35,  y: 270, type: 'bone_spikes' },
            { x: 80,  y: 310, type: 'charred_tree', size: 22 },
            { x: 50,  y: 225, type: 'lava_crack' },
            { x: 135, y: 45,  type: 'charred_stump' },

            // ================= LUSH MEADOW SCENERY (Middle: 170 <= x < 470) =================
            { x: 195, y: 200, type: 'apple_tree', size: 22 },
            { x: 360, y: 45,  type: 'oak_tree',   size: 26 },
            { x: 410, y: 55,  type: 'birch_tree', size: 20 },
            { x: 445, y: 40,  type: 'apple_tree', size: 23 },
            
            // Mushrooms & Mossy Stumps
            { x: 355, y: 190, type: 'mushrooms' },
            { x: 160, y: 245, type: 'mossy_stump' },
            { x: 235, y: 60,  type: 'mossy_stump' },

            // Wildflowers
            { x: 340, y: 310, type: 'flowers' },
            { x: 175, y: 140, type: 'flowers' },
            { x: 445, y: 120, type: 'flowers' },
            { x: 295, y: 190, type: 'flowers' },

            // Fences & Lanterns
            { x: 140, y: 215, type: 'fence' },
            { x: 156, y: 215, type: 'lantern_post' },
            { x: 390, y: 135, type: 'fence' },
            { x: 406, y: 135, type: 'lantern_post' }
        ];
    }

    getSpotAt(x, y) {
        for (let spot of this.towerSpots) {
            const dist = Math.hypot(spot.x - x, spot.y - y);
            if (dist <= spot.radius + 6) {
                return spot;
            }
        }
        return null;
    }

    draw(ctx, hoveredSpot = null) {
        const time = Date.now() * 0.003;

        // ========================================================
        // 1. BIOME BACKGROUNDS WITH DITHERED BLENDING
        // ========================================================
        this.drawBiomeGround(ctx, time);

        // ========================================================
        // 2. INFERNAL LAVA CRACKS & ASH GLOW (Left Zone)
        // ========================================================
        this.drawLavaFissures(ctx, time);

        // ========================================================
        // 3. SPARKLING BABBLING STREAM & LILIES (Middle-South Zone)
        // ========================================================
        this.drawWaterStream(ctx, time);

        // ========================================================
        // 4. BIOME-ADAPTIVE ROAD (Nether Ash -> Golden Dirt -> Village Cobblestones)
        // ========================================================
        this.drawRoad(ctx);

        // ========================================================
        // 5. INFERNAL PORTAL & KINGDOM TOWN GATE
        // ========================================================
        this.drawEntranceAndExit(ctx, time);

        // ========================================================
        // 6. COZY VILLAGE HOUSES & PROPS (Right Zone)
        // ========================================================
        this.drawVillageBuildings(ctx, time);

        // ========================================================
        // 7. TREES, CHARRED SPIKES, MUSHROOMS & DETAILS
        // ========================================================
        this.drawScenery(ctx);

        // ========================================================
        // 8. TOWER PLOT FOUNDATIONS (Infernal / Meadow / Village Styles)
        // ========================================================
        this.drawTowerSpots(ctx, hoveredSpot);
    }

    drawBiomeGround(ctx, time) {
        // Step 1: Base Lush Green for Middle & Right
        ctx.fillStyle = '#2d6325';
        ctx.fillRect(0, 0, this.width, this.height);

        // Step 2: Infernal Volcanic Dark Red / Ash Ground (x: 0 to 180)
        ctx.fillStyle = '#1c0707';
        ctx.fillRect(0, 0, 160, this.height);

        // Smooth Dithered Transition from Nether to Lush Grass (x: 150 to 195)
        for (let py = 0; py < this.height; py += 8) {
            for (let px = 150; px < 195; px += 8) {
                const factor = (px - 150) / 45; // 0 (nether) to 1 (grass)
                const hash = ((px * 17 + py * 31) % 100) / 100;
                if (hash > factor) {
                    ctx.fillStyle = '#220808';
                    ctx.fillRect(px, py, 8, 8);
                }
            }
        }

        // Texture Details across all 3 Biomes
        for (let py = 0; py < this.height; py += 16) {
            for (let px = 0; px < this.width; px += 16) {
                const seed = (px * 37 + py * 59) % 19;

                if (px < 165) {
                    // --- NETHER ASH & VOLCANIC CRUST DETAILS ---
                    if (seed === 0) {
                        ctx.fillStyle = '#3a0c0c'; // red basalt
                        ctx.fillRect(px + 3, py + 4, 4, 3);
                    } else if (seed === 3) {
                        ctx.fillStyle = '#140404'; // dark obsidian crater
                        ctx.fillRect(px + 5, py + 8, 5, 3);
                    } else if (seed === 7) {
                        // Glowing ember fleck
                        const emberAlpha = 0.5 + Math.sin(time * 3 + px) * 0.4;
                        ctx.fillStyle = `rgba(249, 115, 22, ${emberAlpha})`;
                        ctx.fillRect(px + 7, py + 6, 2, 2);
                    }
                } else if (px < 470) {
                    // --- LUSH STARDEW MEADOW DETAILS ---
                    if (seed === 0) {
                        ctx.fillStyle = '#397d31'; // bright blade
                        ctx.fillRect(px + 3, py + 4, 3, 4);
                        ctx.fillRect(px + 7, py + 8, 2, 3);
                    } else if (seed === 3) {
                        ctx.fillStyle = '#25521e'; // shadow blade
                        ctx.fillRect(px + 5, py + 9, 4, 2);
                    } else if (seed === 7) {
                        // Cute clover tuft
                        ctx.fillStyle = '#469b3c';
                        ctx.fillRect(px + 6, py + 6, 4, 3);
                        ctx.fillRect(px + 7, py + 5, 2, 5);
                    }
                } else {
                    // --- VILLAGE ENTRANCE LAWN & COBBLE FLECK DETAILS ---
                    if (seed === 0 || seed === 5) {
                        ctx.fillStyle = '#346d2a'; // manicured village grass
                        ctx.fillRect(px + 4, py + 4, 3, 3);
                    } else if (seed === 2) {
                        ctx.fillStyle = '#64748b'; // stone flagstone peeking
                        ctx.fillRect(px + 6, py + 7, 3, 2);
                    }
                }
            }
        }
    }

    drawLavaFissures(ctx, time) {
        ctx.save();
        // Fiery pulsing magma glow
        const glowPhase = Math.sin(time * 2);
        const lavaCore = '#fde047';
        const lavaOrange = '#ea580c';
        const lavaDark = '#991b1b';

        const cracks = [
            // Crack 1: Top near demonic entrance
            { x: 30, y: 110, pts: [[30,110], [42,118], [55,115], [68,124], [78,122]] },
            // Crack 2: Bottom nether field
            { x: 60, y: 220, pts: [[60,220], [70,228], [82,225], [92,236]] },
            // Crack 3: Near road bend
            { x: 95, y: 55, pts: [[95,55], [105,62], [118,60], [128,68]] }
        ];

        for (let crack of cracks) {
            // Hot Crust Shadow
            ctx.strokeStyle = lavaDark;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(crack.pts[0][0], crack.pts[0][1]);
            for (let i = 1; i < crack.pts.length; i++) ctx.lineTo(crack.pts[i][0], crack.pts[i][1]);
            ctx.stroke();

            // Molten Orange
            ctx.strokeStyle = lavaOrange;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Sizzling Yellow Core
            if (glowPhase > -0.2) {
                ctx.strokeStyle = lavaCore;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawWaterStream(ctx, time) {
        // Gentle winding creek in the meadow (x: 170-275, y: 325-360)
        ctx.save();
        // Creek Bed
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(170, 360);
        ctx.bezierCurveTo(180, 335, 205, 330, 230, 338);
        ctx.bezierCurveTo(250, 345, 265, 335, 275, 360);
        ctx.fill();

        // Shimmering Water
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(175, 360);
        ctx.bezierCurveTo(185, 340, 205, 335, 230, 342);
        ctx.bezierCurveTo(250, 348, 260, 342, 270, 360);
        ctx.fill();

        // Water Ripple Highlights
        const timeWave = Math.sin(time) * 2;
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(195 + timeWave, 343, 6, 2);
        ctx.fillRect(235 - timeWave, 348, 8, 2);

        // Lily Pads with Pink Lotus Flower
        ctx.fillStyle = '#15803d'; // lilypad
        ctx.fillRect(205, 344, 6, 5);
        ctx.fillStyle = '#2f6828';
        ctx.fillRect(208, 345, 2, 1);
        ctx.fillStyle = '#f472b6'; // pink lotus
        ctx.fillRect(207, 343, 3, 3);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(208, 344, 1, 1);

        // Cattails / Reeds on Bank
        ctx.fillStyle = '#15803d';
        ctx.fillRect(172, 336, 1, 8);
        ctx.fillRect(174, 334, 1, 10);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(171, 333, 3, 3);
        ctx.fillRect(173, 331, 3, 3);

        ctx.restore();
    }

    drawRoad(ctx) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Road Soil Trench Shadow
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 32;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y);
        ctx.stroke();

        // 2. Base Ground Underlayer
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 28;
        ctx.stroke();

        // 3. Golden Cobblestone Dirt Road
        ctx.strokeStyle = '#996838';
        ctx.lineWidth = 22;
        ctx.stroke();

        // 4. Center Well-Trod Path
        ctx.strokeStyle = '#b8864e';
        ctx.lineWidth = 14;
        ctx.stroke();

        // 5. Biome-Specific Cobblestones, Charred Rocks & Village Pavers
        for (let i = 0; i < this.path.length - 1; i++) {
            const p1 = this.path[i];
            const p2 = this.path[i + 1];
            const steps = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 7;

            for (let s = 0; s < steps; s++) {
                const rx = p1.x + (p2.x - p1.x) * (s / steps) + ((s * 7) % 10 - 5);
                const ry = p1.y + (p2.y - p1.y) * (s / steps) + ((s * 13) % 10 - 5);
                const roundX = Math.round(rx);
                const roundY = Math.round(ry);

                if (rx < 165) {
                    // Nether Road: Volcanic Basalt, Ash & Glowing Embers
                    if (s % 3 === 0) {
                        ctx.fillStyle = '#1e0505'; // obsidian chunk
                        ctx.fillRect(roundX, roundY, 3, 2);
                    } else if (s % 3 === 1) {
                        ctx.fillStyle = '#450a0a'; // bloodstone pebble
                        ctx.fillRect(roundX, roundY, 2, 2);
                    } else {
                        ctx.fillStyle = '#ea580c'; // hot cinder ember
                        ctx.fillRect(roundX, roundY, 2, 1);
                    }
                } else if (rx < 470) {
                    // Meadow Road: Stardew Dirt Cobblestones & River Pebbles
                    if (s % 3 === 0) {
                        ctx.fillStyle = '#64748b'; // stone grey
                        ctx.fillRect(roundX, roundY, 3, 2);
                    } else if (s % 3 === 1) {
                        ctx.fillStyle = '#784d28'; // dark loam
                        ctx.fillRect(roundX, roundY, 2, 2);
                    } else {
                        ctx.fillStyle = '#d6a36c'; // light pebble
                        ctx.fillRect(roundX, roundY, 2, 1);
                    }
                } else {
                    // Village Road: Neatly Paved Grey Flagstones & Curb Bricks
                    ctx.fillStyle = (s % 2 === 0) ? '#475569' : '#64748b';
                    ctx.fillRect(roundX, roundY, 4, 3);
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(roundX, roundY, 3, 1);
                }
            }
        }

        ctx.restore();
    }

    drawEntranceAndExit(ctx, time) {
        // ========================================================
        // DEMONIC INFERNAL PORTAL (Left: Nether Monster Entrance)
        // ========================================================
        ctx.save();
        // Deep obsidian rift
        ctx.fillStyle = '#0f0505';
        ctx.fillRect(0, 145, 20, 70);

        // Pulsating Demonic Crimson Vortex
        const portalPulse = Math.sin(time * 3);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(2, 149, 14, 62);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(4, 153, 10, 54);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(6 + Math.round(portalPulse), 160, 6, 40);
        ctx.fillStyle = '#fde047'; // White-hot infernal heart
        ctx.fillRect(8, 172, 2, 16);

        // Obsidian Portal Gate Horns & Pillars
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(16, 142, 6, 76); // Right obsidian pillar
        ctx.fillStyle = '#450a0a'; // Demonic runes
        ctx.fillRect(17, 155, 4, 3);
        ctx.fillRect(17, 175, 4, 3);
        ctx.fillRect(17, 195, 4, 3);

        // Demonic Spire Horns (Curving outward)
        ctx.fillStyle = '#292524';
        ctx.fillRect(14, 138, 10, 4);
        ctx.fillRect(18, 132, 6, 6);
        ctx.fillRect(22, 126, 4, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(23, 125, 2, 2); // Red eye gem

        ctx.restore();

        // ========================================================
        // KINGDOM TOWN GATEWAY (Right: Village / Castle Exit)
        // ========================================================
        ctx.save();
        // Gate House Stone Arch
        ctx.fillStyle = '#334155';
        ctx.fillRect(612, 120, 28, 72);
        ctx.fillStyle = '#475569';
        ctx.fillRect(610, 116, 6, 80); // Stone guard pillar

        // Terracotta Red Shingled Gate Canopy
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(606, 114, 34, 5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(608, 111, 30, 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(620, 107, 4, 4); // Gold finial

        // Warm Golden Post Lantern
        ctx.fillStyle = '#78350f';
        ctx.fillRect(608, 130, 4, 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(606, 132, 4, 5);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(607, 133, 2, 3);

        // Royal Kingdom Azure & Gold Banner
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(624, 132, 14, 22);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(629, 138, 4, 4); // Gold crest crown
        ctx.restore();
    }

    drawVillageBuildings(ctx, time) {
        // ========================================================
        // 1. NORTH COTTAGE (Top Right: x: 550-625, y: 30-85)
        // Cozy Terraria / Stardew Cottage with smoking stone chimney
        // ========================================================
        ctx.save();
        const h1x = 555;
        const h1y = 35;

        // Ground Foundation Shadow
        ctx.fillStyle = '#1c3d18';
        ctx.fillRect(h1x - 2, h1y + 46, 68, 6);

        // Stone Base Foundation
        ctx.fillStyle = '#475569';
        ctx.fillRect(h1x, h1y + 36, 64, 12);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(h1x + 2, h1y + 38, 10, 4);
        ctx.fillRect(h1x + 20, h1y + 40, 12, 4);
        ctx.fillRect(h1x + 44, h1y + 38, 10, 4);

        // Timber Framed House Walls (Warm wood planks)
        ctx.fillStyle = '#d97706';
        ctx.fillRect(h1x + 4, h1y + 16, 56, 22);
        ctx.fillStyle = '#78350f'; // Dark wood timber framing beams
        ctx.fillRect(h1x + 4, h1y + 16, 4, 22);
        ctx.fillRect(h1x + 56, h1y + 16, 4, 22);
        ctx.fillRect(h1x + 30, h1y + 16, 4, 22);
        ctx.fillRect(h1x + 4, h1y + 16, 56, 3);

        // Warm Lit Windows (Golden Glow with timber cross)
        ctx.fillStyle = '#fde047'; // warm glow
        ctx.fillRect(h1x + 12, h1y + 22, 12, 10);
        ctx.fillRect(h1x + 38, h1y + 22, 12, 10);
        ctx.fillStyle = '#78350f'; // window mullions
        ctx.fillRect(h1x + 17, h1y + 22, 2, 10);
        ctx.fillRect(h1x + 12, h1y + 26, 12, 2);
        ctx.fillRect(h1x + 43, h1y + 22, 2, 10);
        ctx.fillRect(h1x + 38, h1y + 26, 12, 2);

        // Window Flower Boxes (Red & Pink Petunias)
        ctx.fillStyle = '#5c3a21'; // wooden planter box
        ctx.fillRect(h1x + 10, h1y + 32, 16, 3);
        ctx.fillRect(h1x + 36, h1y + 32, 16, 3);
        ctx.fillStyle = '#ef4444'; // red flowers
        ctx.fillRect(h1x + 12, h1y + 30, 3, 3);
        ctx.fillRect(h1x + 20, h1y + 30, 3, 3);
        ctx.fillStyle = '#f472b6'; // pink flowers
        ctx.fillRect(h1x + 38, h1y + 30, 3, 3);
        ctx.fillRect(h1x + 46, h1y + 30, 3, 3);

        // Cozy Wooden Door
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(h1x + 26, h1y + 29, 12, 18);
        ctx.fillStyle = '#fde047'; // Brass doorknob
        ctx.fillRect(h1x + 34, h1y + 38, 2, 2);

        // Terracotta Red Shingle Roof (Gabled)
        ctx.fillStyle = '#991b1b'; // Dark shadow overhang
        ctx.fillRect(h1x - 4, h1y + 13, 72, 5);
        ctx.fillStyle = '#dc2626'; // Red roof shingles
        ctx.fillRect(h1x - 2, h1y + 8, 68, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(h1x + 4, h1y + 3, 56, 6);
        ctx.fillStyle = '#f87171'; // Roof ridge highlight
        ctx.fillRect(h1x + 12, h1y, 40, 4);

        // Stone Chimney with Animated Smoke Puffs!
        ctx.fillStyle = '#334155';
        ctx.fillRect(h1x + 48, h1y - 8, 8, 14);
        ctx.fillStyle = '#475569';
        ctx.fillRect(h1x + 46, h1y - 10, 12, 3);

        // Smoke particles curling up
        const smokeOffset = (Date.now() * 0.002) % 4;
        ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
        ctx.fillRect(h1x + 50 + Math.sin(time) * 2, h1y - 14 - smokeOffset * 3, 4, 4);
        ctx.fillStyle = 'rgba(203, 213, 225, 0.5)';
        ctx.fillRect(h1x + 52 + Math.cos(time) * 3, h1y - 22 - smokeOffset * 4, 6, 5);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.fillRect(h1x + 54 + Math.sin(time * 0.7) * 4, h1y - 32 - smokeOffset * 5, 8, 6);

        // ========================================================
        // 2. SOUTH COTTAGE (Bottom Right: x: 545-620, y: 280-340)
        // Thatched Rustic House with porch lantern & wood logs
        // ========================================================
        const h2x = 550;
        const h2y = 285;

        // Shadow
        ctx.fillStyle = '#1c3d18';
        ctx.fillRect(h2x - 2, h2y + 44, 64, 6);

        // Timber Walls
        ctx.fillStyle = '#a16207';
        ctx.fillRect(h2x, h2y + 14, 60, 32);
        ctx.fillStyle = '#713f12';
        ctx.fillRect(h2x, h2y + 14, 4, 32);
        ctx.fillRect(h2x + 56, h2y + 14, 4, 32);

        // Cozy Windows
        ctx.fillStyle = '#fde047';
        ctx.fillRect(h2x + 10, h2y + 22, 10, 10);
        ctx.fillStyle = '#713f12';
        ctx.fillRect(h2x + 14, h2y + 22, 2, 10);
        ctx.fillRect(h2x + 10, h2y + 26, 10, 2);

        // Wooden Door & Porch
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(h2x + 34, h2y + 24, 12, 22);

        // Hanging Porch Lantern
        ctx.fillStyle = '#78350f';
        ctx.fillRect(h2x + 48, h2y + 22, 4, 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(h2x + 47, h2y + 24, 3, 4);

        // Green Slate / Shingle Roof
        ctx.fillStyle = '#166534';
        ctx.fillRect(h2x - 4, h2y + 10, 68, 5);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(h2x - 2, h2y + 5, 64, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(h2x + 6, h2y + 1, 48, 5);

        // Stacked Firewood Logs next to south house
        ctx.fillStyle = '#78350f';
        ctx.fillRect(h2x - 14, h2y + 36, 10, 10);
        ctx.fillStyle = '#d97706'; // log ends
        ctx.fillRect(h2x - 13, h2y + 37, 3, 3);
        ctx.fillRect(h2x - 9,  h2y + 37, 3, 3);
        ctx.fillRect(h2x - 11, h2y + 42, 3, 3);

        // ========================================================
        // 3. VILLAGE WISHING WELL (x: 505, y: 55)
        // Stone well with wooden roof, crank and bucket
        // ========================================================
        const wx = 508;
        const wy = 56;
        // Stone Curb
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx - 7, wy + 8, 14, 10);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(wx - 6, wy + 9, 12, 3);
        ctx.fillStyle = '#0284c7'; // Water inside
        ctx.fillRect(wx - 5, wy + 11, 10, 3);

        // Wooden Roof Posts
        ctx.fillStyle = '#78350f';
        ctx.fillRect(wx - 6, wy, 2, 9);
        ctx.fillRect(wx + 4, wy, 2, 9);

        // Wooden Shingled Canopy
        ctx.fillStyle = '#92400e';
        ctx.fillRect(wx - 9, wy - 3, 18, 4);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(wx - 7, wy - 6, 14, 4);

        // Tiny Rope & Bucket
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(wx - 1, wy + 1, 2, 4);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(wx - 2, wy + 5, 4, 3);

        // ========================================================
        // 4. RUSTIC WOODEN VILLAGE SIGNPOST: "KÖY GİRİŞİ ➔"
        // ========================================================
        const sx = 480;
        const sy = 125;
        // Wooden Post
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(sx, sy, 3, 18);

        // Signboard Board Plaque (Pointing right)
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(sx - 14, sy - 8, 28, 9);
        ctx.fillStyle = '#a16207';
        ctx.fillRect(sx - 13, sy - 7, 26, 7);

        // Arrow ➔ & Text Representation
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx - 11, sy - 5, 14, 3); // "KÖY" glyphs
        // Arrow pointing right
        ctx.fillRect(sx + 5, sy - 5, 5, 2);
        ctx.fillRect(sx + 8, sy - 6, 2, 4);

        ctx.restore();
    }

    drawScenery(ctx) {
        for (let s of this.scenery) {
            ctx.save();
            const sx = Math.round(s.x);
            const sy = Math.round(s.y);

            if (s.type === 'charred_tree') {
                // Infernal Burnt Tree with glowing ember tips
                ctx.fillStyle = '#0f0505'; // ash shadow
                ctx.fillRect(sx - 6, sy + s.size * 0.45, 12, 4);
                // Black Gnarled Trunk
                ctx.fillStyle = '#1c1917';
                ctx.fillRect(sx - 3, sy - s.size * 0.4, 6, s.size * 0.85);
                ctx.fillRect(sx - 7, sy - s.size * 0.1, 5, 3); // Branch left
                ctx.fillRect(sx + 3, sy - s.size * 0.2, 6, 3); // Branch right
                // Hot orange embers on burnt branches
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(sx - 7, sy - s.size * 0.1 - 1, 2, 2);
                ctx.fillRect(sx + 8, sy - s.size * 0.2 - 1, 2, 2);
                ctx.fillRect(sx - 1, sy - s.size * 0.4 - 2, 2, 2);

            } else if (s.type === 'bone_spikes') {
                // Demonic Ribcage Bone Spikes
                ctx.fillStyle = '#e2e8f0'; // bleached bone
                ctx.fillRect(sx - 4, sy - 8, 2, 10);
                ctx.fillRect(sx, sy - 12, 2, 14);
                ctx.fillRect(sx + 4, sy - 7, 2, 9);
                // Red gore stain at base
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(sx - 5, sy + 1, 12, 2);

            } else if (s.type === 'brimstone_crystal') {
                // Jagged Crimson Brimstone Crystals
                ctx.fillStyle = '#7f1d1d';
                ctx.fillRect(sx - 4, sy - 10, 4, 12);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(sx - 3, sy - 12, 3, 10);
                ctx.fillStyle = '#f87171'; // crystal shine
                ctx.fillRect(sx - 2, sy - 11, 1, 8);
                // Smaller adjacent shard
                ctx.fillStyle = '#b91c1c';
                ctx.fillRect(sx + 2, sy - 7, 3, 8);

            } else if (s.type === 'charred_stump') {
                ctx.fillStyle = '#1c1917';
                ctx.fillRect(sx - 4, sy - 2, 8, 6);
                ctx.fillStyle = '#ea580c'; // glowing ember in center
                ctx.fillRect(sx - 1, sy - 1, 2, 2);

            } else if (s.type === 'apple_tree' || s.type === 'oak_tree' || s.type === 'birch_tree') {
                // Soft Ground Shadow
                ctx.fillStyle = '#1b3f17';
                ctx.fillRect(sx - s.size * 0.5, sy + s.size * 0.45, s.size, 6);

                // Tree Trunk
                if (s.type === 'birch_tree') {
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(sx - 2, sy + 2, 5, s.size * 0.55);
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(sx - 2, sy + 5, 2, 2);
                    ctx.fillRect(sx + 1, sy + 9, 2, 2);
                } else {
                    ctx.fillStyle = '#5c3a21';
                    ctx.fillRect(sx - 3, sy + 2, 6, s.size * 0.55);
                    ctx.fillStyle = '#3f2512';
                    ctx.fillRect(sx - 1, sy + 4, 2, s.size * 0.4);
                }

                // Stardew Fluffy Multi-Tone Canopy Layers
                const r = s.size * 0.5;
                ctx.fillStyle = (s.type === 'birch_tree') ? '#15803d' : '#14532d';
                ctx.fillRect(sx - r, sy - r * 0.6, s.size, s.size * 0.7);

                ctx.fillStyle = (s.type === 'birch_tree') ? '#22c55e' : '#16a34a';
                ctx.fillRect(sx - r * 0.85, sy - r * 0.85, s.size * 0.85, s.size * 0.85);

                ctx.fillStyle = (s.type === 'birch_tree') ? '#86efac' : '#4ade80';
                ctx.fillRect(sx - r * 0.65, sy - r * 1.1, s.size * 0.6, s.size * 0.45);
                ctx.fillRect(sx - r * 0.3, sy - r * 1.25, s.size * 0.35, s.size * 0.35);

                // Red Apples
                if (s.type === 'apple_tree') {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(sx - 6, sy - 4, 3, 3);
                    ctx.fillRect(sx + 5, sy - 8, 3, 3);
                    ctx.fillRect(sx - 2, sy - 12, 3, 3);
                    ctx.fillRect(sx + 7, sy, 3, 3);
                    ctx.fillStyle = '#fef08a';
                    ctx.fillRect(sx - 5, sy - 4, 1, 1);
                    ctx.fillRect(sx + 6, sy - 8, 1, 1);
                }

            } else if (s.type === 'mushrooms') {
                // Amanita Red Mushroom
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(sx - 1, sy - 1, 2, 4);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(sx - 4, sy - 5, 8, 4);
                ctx.fillRect(sx - 3, sy - 6, 6, 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(sx - 2, sy - 4, 1, 1);
                ctx.fillRect(sx + 1, sy - 5, 1, 1);

                // Small Brown Chantrelle
                ctx.fillStyle = '#d97706';
                ctx.fillRect(sx + 5, sy - 3, 4, 3);

            } else if (s.type === 'mossy_stump') {
                ctx.fillStyle = '#5c3a21';
                ctx.fillRect(sx - 5, sy - 3, 10, 7);
                ctx.fillStyle = '#a2713e';
                ctx.fillRect(sx - 4, sy - 5, 8, 3);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(sx - 5, sy - 2, 3, 3);

            } else if (s.type === 'flowers') {
                ctx.fillStyle = '#fde047';
                ctx.fillRect(sx, sy, 2, 2);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(sx + 5, sy - 4, 2, 2);
                ctx.fillStyle = '#c084fc';
                ctx.fillRect(sx - 5, sy + 3, 2, 3);
                ctx.fillStyle = '#60a5fa';
                ctx.fillRect(sx + 3, sy + 4, 2, 2);

            } else if (s.type === 'fence') {
                ctx.fillStyle = '#78350f';
                ctx.fillRect(sx, sy - 6, 3, 10);
                ctx.fillRect(sx - 8, sy - 4, 16, 2);
                ctx.fillRect(sx - 8, sy - 1, 16, 2);

            } else if (s.type === 'lantern_post') {
                ctx.fillStyle = '#45220c';
                ctx.fillRect(sx, sy - 14, 3, 18);
                ctx.fillRect(sx - 3, sy - 14, 6, 2);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(sx - 4, sy - 11, 4, 5);
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(sx - 3, sy - 10, 2, 3);
            }

            ctx.restore();
        }
    }

    drawTowerSpots(ctx, hoveredSpot) {
        for (let spot of this.towerSpots) {
            if (spot.tower) continue;

            const isHovered = (hoveredSpot && hoveredSpot.id === spot.id);
            const sx = Math.round(spot.x);
            const sy = Math.round(spot.y);

            ctx.save();

            if (spot.biome === 'infernal') {
                // ================= INFERNAL OBSIDIAN SOCKET =================
                ctx.fillStyle = '#0a0303';
                ctx.fillRect(sx - 15, sy + 10, 30, 5);

                ctx.fillStyle = isHovered ? '#450a0a' : '#1c1917';
                ctx.fillRect(sx - 13, sy - 13, 26, 26);
                ctx.fillStyle = isHovered ? '#7f1d1d' : '#292524';
                ctx.fillRect(sx - 12, sy - 12, 24, 24);

                // Crimson Rune Corners
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(sx - 14, sy - 14, 3, 3);
                ctx.fillRect(sx + 11, sy - 14, 3, 3);
                ctx.fillRect(sx - 14, sy + 11, 3, 3);
                ctx.fillRect(sx + 11, sy + 11, 3, 3);

                // Center Rune Hammer
                ctx.fillStyle = isHovered ? '#f97316' : '#991b1b';
                ctx.fillRect(sx - 5, sy - 1, 10, 2);
                ctx.fillRect(sx - 1, sy - 5, 2, 10);

            } else {
                // ================= STARDEW / VILLAGE COBBLESTONE SOCKET =================
                ctx.fillStyle = '#1b3f17';
                ctx.fillRect(sx - 15, sy + 10, 30, 5);

                ctx.fillStyle = isHovered ? '#64748b' : '#334155';
                ctx.fillRect(sx - 13, sy - 13, 26, 26);
                ctx.fillStyle = isHovered ? '#94a3b8' : '#475569';
                ctx.fillRect(sx - 12, sy - 12, 24, 24);

                // Wooden Corner Posts
                ctx.fillStyle = '#78350f';
                ctx.fillRect(sx - 14, sy - 14, 3, 3);
                ctx.fillRect(sx + 11, sy - 14, 3, 3);
                ctx.fillRect(sx - 14, sy + 11, 3, 3);
                ctx.fillRect(sx + 11, sy + 11, 3, 3);

                // Center Golden Hammer/Rune
                ctx.fillStyle = isHovered ? '#fde047' : '#cbd5e1';
                ctx.fillRect(sx - 5, sy - 1, 10, 2);
                ctx.fillRect(sx - 1, sy - 5, 2, 10);
                ctx.fillStyle = isHovered ? '#f59e0b' : '#94a3b8';
                ctx.fillRect(sx - 2, sy - 2, 4, 4);

                // Corner Flower Pot
                ctx.fillStyle = '#ca8a04';
                ctx.fillRect(sx + 8, sy - 10, 3, 3);
                ctx.fillStyle = '#f472b6';
                ctx.fillRect(sx + 9, sy - 12, 2, 2);
            }

            ctx.restore();
        }
    }
}
