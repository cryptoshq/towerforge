// ===== MAP SYSTEM — TERRAIN, PATHS, DECORATIONS =====
const MapSystem = {
    init(mapIndex) {
        const mapDef = MAPS[mapIndex];
        const cols = CONFIG.CANVAS_TILES_X;
        const rows = CONFIG.CANVAS_TILES_Y;

        // Create grid
        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                grid[r][c] = 0; // buildable
            }
        }

        // Mark path tiles
        const pathTiles = new Set();
        const waypoints = mapDef.waypoints;
        const worldWaypoints = [];

        for (let i = 0; i < waypoints.length - 1; i++) {
            const [c1, r1] = waypoints[i];
            const [c2, r2] = waypoints[i + 1];

            const dc = Math.sign(c2 - c1);
            const dr = Math.sign(r2 - r1);

            if (dc !== 0 && dr === 0) {
                // Horizontal segment
                const startC = Math.min(c1, c2);
                const endC = Math.max(c1, c2);
                for (let c = startC; c <= endC; c++) {
                    this._markPath(grid, c, r1, pathTiles);
                }
            } else if (dr !== 0 && dc === 0) {
                // Vertical segment
                const startR = Math.min(r1, r2);
                const endR = Math.max(r1, r2);
                for (let r = startR; r <= endR; r++) {
                    this._markPath(grid, c1, r, pathTiles);
                }
            } else {
                // Diagonal
                let c = c1, r = r1;
                while (c !== c2 || r !== r2) {
                    this._markPath(grid, c, r, pathTiles);
                    if (c !== c2) c += dc;
                    if (r !== r2) r += dr;
                }
                this._markPath(grid, c2, r2, pathTiles);
            }
        }

        // Mark decoration tiles as unbuildable
        if (mapDef.decorations) {
            for (const deco of mapDef.decorations) {
                const w = deco.w || 1;
                const h = deco.h || 1;
                for (let dr = 0; dr < h; dr++) {
                    for (let dc = 0; dc < w; dc++) {
                        const r = deco.y + dr;
                        const c = deco.x + dc;
                        if (r >= 0 && r < rows && c >= 0 && c < cols) {
                            if (grid[r][c] === 0) grid[r][c] = 2; // decoration/blocked
                        }
                    }
                }
            }
        }

        // Create world-coordinate waypoints
        for (const [c, r] of waypoints) {
            worldWaypoints.push(gridToWorld(c, r));
        }

        // Create detailed path for enemies
        const detailedPath = this._buildDetailedPath(waypoints);

        // Calculate total path length for difficulty display
        let pathLength = 0;
        for (let i = 0; i < worldWaypoints.length - 1; i++) {
            pathLength += dist(worldWaypoints[i], worldWaypoints[i + 1]);
        }

        GameState.grid = grid;
        GameState.pathTiles = pathTiles;
        GameState.waypoints = worldWaypoints;
        GameState.detailedPath = detailedPath;
        GameState.mapIndex = mapIndex;
        GameState.maxWave = mapDef.waves;
        GameState.pathLength = pathLength;

        // Mark background as needing redraw
        bgDirty = true;
    },

    _markPath(grid, c, r, pathTiles) {
        if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
            grid[r][c] = 1;
            pathTiles.add(`${c},${r}`);
        }
    },

    _buildDetailedPath(waypoints) {
        const worldPts = [];
        for (let i = 0; i < waypoints.length; i++) {
            const [c, r] = waypoints[i];
            worldPts.push(gridToWorld(c, r));
        }
        return this._buildRoundedOrthogonalPath(worldPts, CONFIG.TILE_SIZE * 0.4, 5);
    },

    _buildRoundedOrthogonalPath(points, cornerRadius, cornerSteps) {
        if (!points || points.length < 2) return points || [];

        const out = [];
        const pushUnique = (pt) => {
            const last = out[out.length - 1];
            if (!last || dist(last, pt) > 0.5) out.push({ x: pt.x, y: pt.y });
        };

        const normalize = (v) => {
            const m = Math.hypot(v.x, v.y) || 1;
            return { x: v.x / m, y: v.y / m };
        };

        pushUnique(points[0]);

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const inVec = normalize({ x: curr.x - prev.x, y: curr.y - prev.y });
            const outVec = normalize({ x: next.x - curr.x, y: next.y - curr.y });
            const lenIn = dist(prev, curr);
            const lenOut = dist(curr, next);

            const dot = inVec.x * outVec.x + inVec.y * outVec.y;
            const isTurn = Math.abs(dot - 1) > 0.001;
            const isOrthogonal = Math.abs(dot) < 0.001;

            if (!isTurn || !isOrthogonal) {
                pushUnique(curr);
                continue;
            }

            const r = Math.max(2, Math.min(cornerRadius, lenIn * 0.45, lenOut * 0.45));
            const inPt = { x: curr.x - inVec.x * r, y: curr.y - inVec.y * r };
            const outPt = { x: curr.x + outVec.x * r, y: curr.y + outVec.y * r };

            pushUnique(inPt);

            for (let s = 1; s <= cornerSteps; s++) {
                const t = s / (cornerSteps + 1);
                const mt = 1 - t;
                const qx = mt * mt * inPt.x + 2 * mt * t * curr.x + t * t * outPt.x;
                const qy = mt * mt * inPt.y + 2 * mt * t * curr.y + t * t * outPt.y;
                pushUnique({ x: qx, y: qy });
            }

            pushUnique(outPt);
        }

        pushUnique(points[points.length - 1]);
        return out;
    },

    canBuild(col, row) {
        if (!GameState.grid) return false;
        if (row < 0 || row >= GameState.grid.length) return false;
        if (col < 0 || col >= GameState.grid[0].length) return false;
        if (GameState.grid[row][col] !== 0) return false;
        for (const t of GameState.towers) {
            if (t.gridCol === col && t.gridRow === row) return false;
        }
        return true;
    },

    // Free placement: check if world coordinate (x,y) is valid for a tower
    canBuildAt(x, y) {
        if (!GameState.grid) return false;
        const ts = CONFIG.TILE_SIZE;
        const r = CONFIG.TOWER_FOOTPRINT || 14;
        const cols = CONFIG.CANVAS_TILES_X;
        const rows = CONFIG.CANVAS_TILES_Y;

        // Must be within map bounds (with margin)
        if (x < r || y < r || x > cols * ts - r || y > rows * ts - r) return false;

        // Check grid tiles that the tower footprint overlaps
        const minCol = Math.max(0, Math.floor((x - r) / ts));
        const maxCol = Math.min(cols - 1, Math.floor((x + r) / ts));
        const minRow = Math.max(0, Math.floor((y - r) / ts));
        const maxRow = Math.min(rows - 1, Math.floor((y + r) / ts));

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (GameState.grid[row][col] !== 0) return false;
            }
        }

        // Check distance to smooth path (extra safety for curves)
        if (GameState.detailedPath) {
            for (let i = 0; i < GameState.detailedPath.length; i += 2) {
                const pt = GameState.detailedPath[i];
                const d = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
                if (d < ts * 0.6 + r) return false;
            }
        }

        // Check distance to other towers
        const minDist = (CONFIG.TOWER_FOOTPRINT || 14) * 2 + 4;
        for (const t of GameState.towers) {
            if (dist({x, y}, t) < minDist) return false;
        }
        return true;
    },

    // ===== MAIN DRAW =====
    draw(ctx) {
        const mapDef = MAPS[GameState.mapIndex];
        const ts = CONFIG.TILE_SIZE;
        const cols = CONFIG.CANVAS_TILES_X;
        const rows = CONFIG.CANVAS_TILES_Y;

        // Background
        ctx.fillStyle = mapDef.bgColor;
        ctx.fillRect(0, 0, cols * ts, rows * ts);

        // Draw terrain texture (subtle noise pattern)
        this._drawTerrainTexture(ctx, mapDef, cols, rows, ts);

        // Draw grid (non-path tiles only)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * ts;
                const y = r * ts;
                if (GameState.grid[r] && GameState.grid[r][c] === 2) {
                    // Decoration tile - slightly different shade
                    ctx.fillStyle = brighten(mapDef.bgColor, -5);
                    ctx.fillRect(x, y, ts, ts);
                } else if (!GameState.grid[r] || GameState.grid[r][c] !== 1) {
                    // Buildable grid lines (subtle)
                    ctx.strokeStyle = mapDef.gridColor;
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
                }
            }
        }

        // Draw rounded-corner orthogonal road
        this._drawSmoothPath(ctx, mapDef, ts);

        // Active map-pressure telegraph overlay
        this._drawMapPressureOverlay(ctx);

        // Draw decorations
        this._drawDecorations(ctx, mapDef, ts);

        // Path direction indicators
        this._drawPathArrows(ctx, mapDef);

        // Entrance/Exit markers
        this._drawEntryExit(ctx, mapDef);

        // Theme-specific ambient effects
        this._drawThemeEffects(ctx, mapDef);
    },

    _drawTerrainTexture(ctx, mapDef, cols, rows, ts) {
        // Subtle terrain variation
        ctx.globalAlpha = 0.03;
        const seed = GameState.mapIndex * 1000;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Simple hash for pseudo-random brightness
                const hash = ((c * 374761393 + r * 668265263 + seed) & 0x7FFFFFFF) % 256;
                if (hash > 200) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(c * ts, r * ts, ts, ts);
                } else if (hash < 30) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(c * ts, r * ts, ts, ts);
                }
            }
        }
        ctx.globalAlpha = 1;
    },

    _drawPathTile(ctx, mapDef, x, y, ts, col, row) {
        // Base path color
        ctx.fillStyle = mapDef.pathColor;
        ctx.fillRect(x, y, ts, ts);

        // Path texture - subtle stone/dirt pattern
        ctx.globalAlpha = 0.08;
        const hash = ((col * 97 + row * 83) & 0x7FFFFFFF) % 100;
        if (hash < 25) {
            ctx.fillStyle = '#fff';
            const cx = x + (hash % 5) * 7 + 5;
            const cy = y + ((hash * 3) % 5) * 7 + 5;
            ctx.beginPath();
            ctx.arc(cx, cy, 2 + (hash % 3), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Theme-specific path effects
        switch (mapDef.theme) {
            case 'forest':
                // Dirt with grass edges
                if (Math.random() < 0.005) {
                    ctx.fillStyle = '#3a5a20';
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(x, y, ts, 2);
                    ctx.globalAlpha = 1;
                }
                break;
            case 'ice':
                // Icy sheen on path
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.05;
                ctx.fillRect(x, y, ts, ts);
                ctx.globalAlpha = 1;
                break;
            case 'volcano':
                // Glowing cracks
                if (hash < 10) {
                    ctx.strokeStyle = '#ff4020';
                    ctx.globalAlpha = 0.15;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + ts * 0.2, y + ts * 0.3);
                    ctx.lineTo(x + ts * 0.8, y + ts * 0.7);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                break;
            case 'shadow':
                // Void shimmer
                if (hash < 8) {
                    ctx.fillStyle = '#6020a0';
                    ctx.globalAlpha = 0.1;
                    ctx.beginPath();
                    ctx.arc(x + ts / 2, y + ts / 2, ts * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                break;
        }
    },

    _drawSmoothPath(ctx, mapDef, ts) {
        const waypoints = MAPS[GameState.mapIndex].waypoints;
        if (!waypoints || waypoints.length < 2) return;

        // Convert waypoints to world coords
        const worldPts = waypoints.map(([c, r]) => gridToWorld(c, r));

        // Generate rounded orthogonal polyline for the visual road
        const smoothPts = this._buildRoundedOrthogonalPath(worldPts, ts * 0.4, 7);

        // Draw road shadow (slightly offset, darker)
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = ts + 6;
        ctx.strokeStyle = brighten(mapDef.pathColor, -20);
        ctx.beginPath();
        ctx.moveTo(smoothPts[0].x, smoothPts[0].y + 2);
        for (let i = 1; i < smoothPts.length; i++) {
            ctx.lineTo(smoothPts[i].x, smoothPts[i].y + 2);
        }
        ctx.stroke();

        // Draw main road body
        ctx.lineWidth = ts;
        ctx.strokeStyle = mapDef.pathColor;
        ctx.beginPath();
        ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
        for (let i = 1; i < smoothPts.length; i++) {
            ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
        }
        ctx.stroke();

        // Draw road edge highlight (top edge)
        ctx.lineWidth = ts - 4;
        ctx.strokeStyle = brighten(mapDef.pathColor, 8);
        ctx.beginPath();
        ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
        for (let i = 1; i < smoothPts.length; i++) {
            ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
        }
        ctx.stroke();

        // Draw road inner surface
        ctx.lineWidth = ts - 8;
        ctx.strokeStyle = mapDef.pathColor;
        ctx.beginPath();
        ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
        for (let i = 1; i < smoothPts.length; i++) {
            ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
        }
        ctx.stroke();

        // Draw center dashes (road markings)
        ctx.setLineDash([8, 16]);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = brighten(mapDef.pathColor, 30);
        ctx.beginPath();
        ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
        for (let i = 1; i < smoothPts.length; i++) {
            ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Theme-specific path textures along the rounded line
        this._drawPathThemeTexture(ctx, mapDef, smoothPts, ts);

        ctx.restore();
    },

    _drawPathThemeTexture(ctx, mapDef, smoothPts, ts) {
        const theme = mapDef.theme;
        // Sample points along the spline for decorative textures
        for (let i = 0; i < smoothPts.length; i += 3) {
            const pt = smoothPts[i];
            const hash = ((Math.floor(pt.x) * 97 + Math.floor(pt.y) * 83) & 0x7FFFFFFF) % 100;

            if (theme === 'forest' && hash < 15) {
                // Dirt specks
                ctx.globalAlpha = 0.06;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(pt.x + (hash % 7) - 3, pt.y + ((hash * 3) % 7) - 3, 1.5 + (hash % 2), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else if (theme === 'volcano' && hash < 10) {
                // Lava cracks
                ctx.globalAlpha = 0.12;
                ctx.strokeStyle = '#ff4020';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(pt.x - 5, pt.y - 3);
                ctx.lineTo(pt.x + 5, pt.y + 3);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (theme === 'shadow' && hash < 8) {
                // Void wisps
                ctx.globalAlpha = 0.08;
                ctx.fillStyle = '#6020a0';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, ts * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    },

    _drawMapPressureOverlay(ctx) {
        if (typeof WaveSystem === 'undefined' || !WaveSystem.currentMapPressure) return;
        if (!GameState.detailedPath || GameState.detailedPath.length < 2) return;

        const pressure = WaveSystem.currentMapPressure;
        const t = GameState.time || 0;
        const path = GameState.detailedPath;

        const styleById = {
            forest_roots: { color: '#7ad17a', alt: '#4ea84e', dash: [6, 14] },
            desert_haze: { color: '#ffba74', alt: '#ff8f45', dash: [8, 12] },
            ice_blackice: { color: '#9fd8ff', alt: '#60b8ff', dash: [5, 10] },
            volcano_embers: { color: '#ff8f66', alt: '#ff5c30', dash: [7, 11] },
            shadow_voiddrift: { color: '#c090ff', alt: '#8b5bff', dash: [4, 9] },
        };
        const style = styleById[pressure.id] || { color: '#9fb0ff', alt: '#6f84d8', dash: [6, 12] };

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const pulse = 0.55 + Math.sin(t * 2.2) * 0.15;

        // Soft corridor glow
        ctx.strokeStyle = colorAlpha(style.color, 0.08 * pulse);
        ctx.lineWidth = CONFIG.TILE_SIZE * 0.9;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();

        // Animated pressure trace
        ctx.setLineDash(style.dash);
        ctx.lineDashOffset = -t * 20;
        ctx.strokeStyle = colorAlpha(style.alt, 0.35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulse beacons
        for (let i = 0; i < path.length; i += 10) {
            const p = path[i];
            const r = 1.8 + (Math.sin(t * 3 + i * 0.4) + 1) * 1.2;
            ctx.fillStyle = colorAlpha(style.color, 0.28);
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    _drawPathEdges(ctx, mapDef, ts) {
        // Draw 3D-effect edges on path tiles
        const pathTiles = GameState.pathTiles;
        const lightColor = brighten(mapDef.pathColor, 20);
        const shadowColor = brighten(mapDef.pathColor, -15);

        for (const key of pathTiles) {
            const [col, row] = key.split(',').map(Number);
            const x = col * ts;
            const y = row * ts;

            // Check adjacent non-path tiles for edge drawing
            const above = pathTiles.has(`${col},${row - 1}`);
            const below = pathTiles.has(`${col},${row + 1}`);
            const left = pathTiles.has(`${col - 1},${row}`);
            const right = pathTiles.has(`${col + 1},${row}`);

            ctx.lineWidth = 1;

            // Top edge (light if no path above)
            if (!above) {
                ctx.strokeStyle = lightColor;
                ctx.beginPath();
                ctx.moveTo(x, y + 0.5);
                ctx.lineTo(x + ts, y + 0.5);
                ctx.stroke();
            }
            // Bottom edge (shadow)
            if (!below) {
                ctx.strokeStyle = shadowColor;
                ctx.beginPath();
                ctx.moveTo(x, y + ts - 0.5);
                ctx.lineTo(x + ts, y + ts - 0.5);
                ctx.stroke();
            }
            // Left edge
            if (!left) {
                ctx.strokeStyle = lightColor;
                ctx.beginPath();
                ctx.moveTo(x + 0.5, y);
                ctx.lineTo(x + 0.5, y + ts);
                ctx.stroke();
            }
            // Right edge
            if (!right) {
                ctx.strokeStyle = shadowColor;
                ctx.beginPath();
                ctx.moveTo(x + ts - 0.5, y);
                ctx.lineTo(x + ts - 0.5, y + ts);
                ctx.stroke();
            }
        }
    },

    _drawDecorations(ctx, mapDef, ts) {
        if (!mapDef.decorations) return;

        for (const deco of mapDef.decorations) {
            const x = deco.x * ts + ts / 2;
            const y = deco.y * ts + ts / 2;
            const w = (deco.w || 1) * ts;
            const h = (deco.h || 1) * ts;

            ctx.save();

            switch (deco.type) {
                case 'tree':
                    this._drawTree(ctx, x, y, ts, mapDef.theme);
                    break;
                case 'bush':
                    this._drawBush(ctx, x, y, ts);
                    break;
                case 'rock':
                    this._drawRock(ctx, x, y, ts);
                    break;
                case 'flowers':
                    this._drawFlowers(ctx, x, y, ts);
                    break;
                case 'mushroom':
                    this._drawMushroom(ctx, x, y, ts);
                    break;
                case 'stump':
                    this._drawStump(ctx, x, y, ts);
                    break;
                case 'grass_tall':
                    this._drawTallGrass(ctx, x, y, ts);
                    break;
                case 'butterfly':
                    this._drawButterfly(ctx, x, y, ts);
                    break;
                case 'pond':
                    this._drawPond(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'cactus':
                    this._drawCactus(ctx, x, y, ts);
                    break;
                case 'dune':
                    this._drawDune(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'skull':
                    this._drawSkull(ctx, x, y, ts);
                    break;
                case 'oasis':
                    this._drawOasis(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'bones':
                    this._drawBones(ctx, x, y, ts);
                    break;
                case 'tumbleweed':
                    this._drawTumbleweed(ctx, x, y, ts);
                    break;
                case 'sandstone':
                    this._drawSandstone(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'scorpion':
                    this._drawScorpion(ctx, x, y, ts);
                    break;
                case 'mirage':
                    this._drawMirage(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'vulture':
                    this._drawVulture(ctx, x, y, ts);
                    break;
                case 'icicle':
                    this._drawIcicle(ctx, x, y, ts);
                    break;
                case 'snowpile':
                    this._drawSnowpile(ctx, x, y, ts);
                    break;
                case 'frozenpool':
                    this._drawFrozenPool(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'crystal':
                    this._drawCrystal(ctx, x, y, ts);
                    break;
                case 'snowflake':
                    this._drawSnowflake(ctx, x, y, ts);
                    break;
                case 'frostpine':
                    this._drawFrostpine(ctx, x, y, ts);
                    break;
                case 'iceberg':
                    this._drawIceberg(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'penguins':
                    this._drawPenguins(ctx, x, y, ts);
                    break;
                case 'aurora':
                    this._drawAurora(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'lava':
                    this._drawLavaPool(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'volcano':
                    this._drawVolcano(ctx, x, y, ts);
                    break;
                case 'embers':
                    this._drawEmbers(ctx, x, y, ts);
                    break;
                case 'charred':
                    this._drawCharred(ctx, x, y, ts);
                    break;
                case 'crack':
                    this._drawCrack(ctx, x, y, ts);
                    break;
                case 'lavaspout':
                    this._drawLavaSpout(ctx, x, y, ts);
                    break;
                case 'obsidian':
                    this._drawObsidian(ctx, x, y, ts);
                    break;
                case 'ashcloud':
                    this._drawAshCloud(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'firefly':
                    this._drawFirefly(ctx, x, y, ts);
                    break;
                case 'portal':
                    this._drawPortal(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'shadowrift':
                    this._drawShadowRift(ctx, x, y, ts);
                    break;
                case 'rune':
                    this._drawRune(ctx, x, y, ts);
                    break;
                case 'voidcrystal':
                    this._drawVoidCrystal(ctx, x, y, ts);
                    break;
                case 'soultorch':
                    this._drawSoulTorch(ctx, x, y, ts);
                    break;
                case 'darkpool':
                    this._drawDarkPool(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'specter':
                    this._drawSpecter(ctx, x, y, ts);
                    break;
                case 'voidrift':
                    this._drawVoidRift(ctx, deco.x * ts, deco.y * ts, w, h);
                    break;
                case 'eyeball':
                    this._drawEyeball(ctx, x, y, ts);
                    break;
            }

            ctx.restore();
        }
    },

    // ===== DECORATION DRAWING FUNCTIONS =====
    _drawTree(ctx, x, y, ts, theme) {
        const scale = ts / 40;

        // Trunk
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x - 3 * scale, y - 2 * scale, 6 * scale, 14 * scale);

        // Canopy (3 layers for depth)
        const green = theme === 'shadow' ? '#2a3a2a' : '#2a6a2a';
        ctx.fillStyle = brighten(green, 20);
        ctx.beginPath();
        ctx.arc(x, y - 8 * scale, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = green;
        ctx.beginPath();
        ctx.arc(x - 4 * scale, y - 5 * scale, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5 * scale, y - 6 * scale, 9 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Highlights
        ctx.fillStyle = brighten(green, 30);
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(x - 2 * scale, y - 10 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawBush(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#3a7a2a';
        ctx.beginPath();
        ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a9a3a';
        ctx.beginPath();
        ctx.arc(x - 3 * scale, y - 2 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4 * scale, y - 1 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawRock(ctx, x, y, ts) {
        const scale = ts / 40;
        // Large rock
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.moveTo(x - 10 * scale, y + 5 * scale);
        ctx.lineTo(x - 8 * scale, y - 6 * scale);
        ctx.lineTo(x + 2 * scale, y - 8 * scale);
        ctx.lineTo(x + 10 * scale, y - 3 * scale);
        ctx.lineTo(x + 8 * scale, y + 5 * scale);
        ctx.closePath();
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.moveTo(x - 6 * scale, y - 4 * scale);
        ctx.lineTo(x + 1 * scale, y - 7 * scale);
        ctx.lineTo(x + 5 * scale, y - 3 * scale);
        ctx.lineTo(x - 2 * scale, y - 1 * scale);
        ctx.closePath();
        ctx.fill();
    },

    _drawFlowers(ctx, x, y, ts) {
        const scale = ts / 40;
        const colors = ['#ff6080', '#ffb060', '#ff80ff', '#ffff60', '#60b0ff'];
        for (let i = 0; i < 5; i++) {
            const fx = x + (i - 2) * 6 * scale + (i % 2) * 3 * scale;
            const fy = y + ((i * 7) % 5 - 2) * 4 * scale;
            // Stem
            ctx.strokeStyle = '#3a6a2a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(fx, fy + 5 * scale);
            ctx.lineTo(fx, fy);
            ctx.stroke();
            // Petals
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(fx, fy, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Center
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(fx, fy, 1.2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    _drawMushroom(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#d9d1c0';
        ctx.fillRect(x - 2 * scale, y - 1 * scale, 4 * scale, 8 * scale);
        ctx.fillStyle = '#d45a4a';
        ctx.beginPath();
        ctx.ellipse(x, y - 2 * scale, 8 * scale, 5 * scale, 0, Math.PI, 0, true);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f5e8df';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x - 3 * scale + i * 3 * scale, y - 3 * scale, 1.2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    _drawStump(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#6c4a2a';
        ctx.beginPath();
        ctx.ellipse(x, y + 2 * scale, 6 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#86613d';
        ctx.beginPath();
        ctx.ellipse(x, y - 1 * scale, 5 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#52361f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 1 * scale, 2.2 * scale, 0, Math.PI * 2);
        ctx.stroke();
    },

    _drawTallGrass(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.strokeStyle = '#4f9a4d';
        ctx.lineWidth = 1.2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 1.5 * scale, y + 6 * scale);
            ctx.quadraticCurveTo(x + i * 2.2 * scale, y - 2 * scale, x + i * 1.1 * scale, y - 7 * scale);
            ctx.stroke();
        }
        ctx.strokeStyle = '#7acb74';
        ctx.beginPath();
        ctx.moveTo(x, y + 5 * scale);
        ctx.lineTo(x + 2 * scale, y - 5 * scale);
        ctx.stroke();
    },

    _drawButterfly(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        const flap = 0.55 + Math.sin(t * 12 + x * 0.02 + y * 0.01) * 0.35;
        ctx.save();
        ctx.translate(x, y - 2 * scale);
        ctx.fillStyle = '#ff8ed9';
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.ellipse(-2.2 * scale, 0, 3.2 * scale, 2.1 * scale * flap, -0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(2.2 * scale, 0, 3.2 * scale, 2.1 * scale * flap, 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cce8ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -2 * scale);
        ctx.lineTo(0, 3 * scale);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
    },

    _drawTumbleweed(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        const rot = t * 1.8 + (x + y) * 0.01;
        ctx.save();
        ctx.translate(x, y + 3 * scale);
        ctx.rotate(rot);
        ctx.strokeStyle = '#9b7b4e';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(-5 * scale, 0);
            ctx.lineTo(5 * scale, 0);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    _drawSandstone(ctx, x, y, w, h) {
        ctx.fillStyle = '#8b6c43';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.fillStyle = '#a98457';
        ctx.fillRect(x + 2, y + 2, Math.max(2, w * 0.4), Math.max(2, h - 4));
        ctx.strokeStyle = '#5a4329';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    },

    _drawScorpion(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#4a2d1e';
        ctx.beginPath();
        ctx.ellipse(x, y, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#70412a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3 * scale, y - 1 * scale);
        ctx.quadraticCurveTo(x + 8 * scale, y - 5 * scale, x + 5 * scale, y - 9 * scale);
        ctx.stroke();
        ctx.fillStyle = '#70412a';
        ctx.beginPath();
        ctx.arc(x + 5 * scale, y - 9 * scale, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawMirage(ctx, x, y, w, h) {
        const t = GameState.time;
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(t * 3 + x * 0.05) * 0.08;
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgba(180,220,255,0.35)');
        grad.addColorStop(1, 'rgba(255,240,180,0.08)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.max(2, w * 0.55), Math.max(2, h * 0.46), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    _drawVulture(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        const wing = 1 + Math.sin(t * 6 + x * 0.03) * 0.25;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-7 * scale, 0);
        ctx.quadraticCurveTo(-2 * scale, -3 * scale * wing, 0, 0);
        ctx.quadraticCurveTo(2 * scale, -3 * scale * wing, 7 * scale, 0);
        ctx.stroke();
        ctx.restore();
    },

    _drawSnowflake(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        ctx.save();
        ctx.translate(x, y + Math.sin(t * 2 + x * 0.02) * 1.5 * scale);
        ctx.rotate(t * 0.6 + x * 0.01);
        ctx.strokeStyle = '#cde7ff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(-5 * scale, 0);
            ctx.lineTo(5 * scale, 0);
            ctx.stroke();
        }
        ctx.restore();
    },

    _drawFrostpine(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#5a4430';
        ctx.fillRect(x - 2 * scale, y + 2 * scale, 4 * scale, 10 * scale);
        ctx.fillStyle = '#7fb8c8';
        ctx.beginPath();
        ctx.moveTo(x, y - 12 * scale);
        ctx.lineTo(x - 10 * scale, y + 4 * scale);
        ctx.lineTo(x + 10 * scale, y + 4 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#dbefff';
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(x, y - 10 * scale);
        ctx.lineTo(x - 4 * scale, y - 2 * scale);
        ctx.lineTo(x + 4 * scale, y - 2 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawIceberg(ctx, x, y, w, h) {
        ctx.fillStyle = '#80b7d8';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h - 2);
        ctx.lineTo(x + w * 0.25, y + h * 0.2);
        ctx.lineTo(x + w * 0.52, y + h * 0.34);
        ctx.lineTo(x + w * 0.78, y + h * 0.12);
        ctx.lineTo(x + w - 2, y + h - 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cbe8ff';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x + w * 0.28, y + h * 0.28, w * 0.3, h * 0.25);
        ctx.globalAlpha = 1;
    },

    _drawPenguins(ctx, x, y, ts) {
        const scale = ts / 40;
        for (let i = -1; i <= 1; i++) {
            const px = x + i * 4 * scale;
            ctx.fillStyle = '#1b1f28';
            ctx.beginPath();
            ctx.ellipse(px, y + 2 * scale, 2.2 * scale, 3.4 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f2f4ff';
            ctx.beginPath();
            ctx.ellipse(px, y + 2.4 * scale, 1.1 * scale, 2.1 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    _drawAurora(ctx, x, y, w, h) {
        const t = GameState.time;
        ctx.save();
        ctx.globalAlpha = 0.22 + Math.sin(t * 1.4 + x * 0.03) * 0.07;
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, 'rgba(126,220,255,0.65)');
        grad.addColorStop(0.5, 'rgba(160,255,200,0.45)');
        grad.addColorStop(1, 'rgba(180,140,255,0.35)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.8);
        ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.2, x + w * 0.5, y + h * 0.7);
        ctx.quadraticCurveTo(x + w * 0.75, y + h * 1.2, x + w, y + h * 0.45);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    _drawLavaSpout(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        const h = 7 * scale + Math.sin(t * 7 + x * 0.03) * 3 * scale;
        ctx.fillStyle = '#ff6a2c';
        ctx.beginPath();
        ctx.moveTo(x - 2 * scale, y + 6 * scale);
        ctx.lineTo(x, y - h);
        ctx.lineTo(x + 2 * scale, y + 6 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd18a';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y - h, 1.8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawObsidian(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#2d2238';
        ctx.beginPath();
        ctx.moveTo(x, y - 10 * scale);
        ctx.lineTo(x - 6 * scale, y + 4 * scale);
        ctx.lineTo(x, y + 8 * scale);
        ctx.lineTo(x + 6 * scale, y + 4 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5a4a70';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(x, y - 10 * scale);
        ctx.lineTo(x + 6 * scale, y + 4 * scale);
        ctx.lineTo(x + 1 * scale, y + 1 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawAshCloud(ctx, x, y, w, h) {
        const t = GameState.time;
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(t * 1.8 + x * 0.04) * 0.06;
        ctx.fillStyle = '#6d5d66';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.28, y + h * 0.58, w * 0.3, h * 0.38, 0, 0, Math.PI * 2);
        ctx.ellipse(x + w * 0.54, y + h * 0.42, w * 0.34, h * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(x + w * 0.78, y + h * 0.6, w * 0.24, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    _drawFirefly(ctx, x, y, ts) {
        const t = GameState.time;
        const glow = 0.2 + (Math.sin(t * 7 + x * 0.07 + y * 0.03) + 1) * 0.3;
        ctx.save();
        ctx.globalAlpha = glow;
        ctx.fillStyle = '#ffd44f';
        ctx.shadowColor = '#ffd44f';
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    },

    _drawSoulTorch(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        ctx.fillStyle = '#3d2f28';
        ctx.fillRect(x - 1.5 * scale, y - 2 * scale, 3 * scale, 11 * scale);
        ctx.fillStyle = '#64d0ff';
        ctx.globalAlpha = 0.45 + Math.sin(t * 9 + x * 0.05) * 0.16;
        ctx.beginPath();
        ctx.moveTo(x, y - 8 * scale);
        ctx.quadraticCurveTo(x - 4 * scale, y - 3 * scale, x, y);
        ctx.quadraticCurveTo(x + 4 * scale, y - 3 * scale, x, y - 8 * scale);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawDarkPool(ctx, x, y, w, h) {
        const t = GameState.time;
        const grad = ctx.createRadialGradient(x + w * 0.5, y + h * 0.5, 0, x + w * 0.5, y + h * 0.5, Math.max(w, h) * 0.55);
        grad.addColorStop(0, '#2e2050');
        grad.addColorStop(0.7, '#1a1132');
        grad.addColorStop(1, '#0d0820');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.46, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(150,110,220,${0.2 + Math.sin(t * 2.3) * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    _drawSpecter(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        const floatY = Math.sin(t * 2.4 + x * 0.03) * 2 * scale;
        ctx.save();
        ctx.translate(x, y + floatY);
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = '#bca8ff';
        ctx.beginPath();
        ctx.arc(0, -4 * scale, 5 * scale, Math.PI, 0);
        ctx.lineTo(5 * scale, 6 * scale);
        ctx.quadraticCurveTo(2 * scale, 4 * scale, 0, 6 * scale);
        ctx.quadraticCurveTo(-2 * scale, 4 * scale, -5 * scale, 6 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = '#1a1128';
        ctx.beginPath();
        ctx.arc(-1.6 * scale, -5 * scale, 0.9 * scale, 0, Math.PI * 2);
        ctx.arc(1.6 * scale, -5 * scale, 0.9 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
    },

    _drawVoidRift(ctx, x, y, w, h) {
        const t = GameState.time;
        const cx = x + w * 0.5;
        const cy = y + h * 0.5;
        const r = Math.max(4, Math.min(w, h) * 0.45);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
        grad.addColorStop(0, '#3d1b73');
        grad.addColorStop(0.65, '#1f0f43');
        grad.addColorStop(1, '#080412');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * (0.9 + Math.sin(t * 2 + x * 0.01) * 0.06), r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(178,122,255,0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    },

    _drawEyeball(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        const pupilShift = Math.sin(t * 1.9 + x * 0.03) * 1.2 * scale;
        ctx.fillStyle = '#e8d7c8';
        ctx.beginPath();
        ctx.ellipse(x, y, 7 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a3cb8';
        ctx.beginPath();
        ctx.arc(x + pupilShift, y, 2.3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1020';
        ctx.beginPath();
        ctx.arc(x + pupilShift, y, 1.1 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,80,130,0.45)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 7 * scale, y);
        ctx.lineTo(x - 10 * scale, y - 3 * scale);
        ctx.moveTo(x + 7 * scale, y + 1 * scale);
        ctx.lineTo(x + 10 * scale, y + 3 * scale);
        ctx.stroke();
    },

    _drawPond(ctx, x, y, w, h) {
        // Water body
        const gradient = ctx.createRadialGradient(
            x + w / 2, y + h / 2, 0,
            x + w / 2, y + h / 2, Math.max(w, h) / 2
        );
        gradient.addColorStop(0, '#2060a0');
        gradient.addColorStop(0.7, '#1a4a80');
        gradient.addColorStop(1, '#0a2a50');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + w / 3, y + h / 3, w / 6, h / 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Lily pads
        ctx.fillStyle = '#2a8a4a';
        ctx.beginPath();
        ctx.arc(x + w * 0.6, y + h * 0.6, 4, 0, Math.PI * 1.8);
        ctx.fill();
    },

    _drawCactus(ctx, x, y, ts) {
        const scale = ts / 40;
        // Main body
        ctx.fillStyle = '#3a7a3a';
        ctx.fillRect(x - 4 * scale, y - 10 * scale, 8 * scale, 20 * scale);
        // Arms
        ctx.fillRect(x - 12 * scale, y - 6 * scale, 8 * scale, 4 * scale);
        ctx.fillRect(x - 12 * scale, y - 10 * scale, 4 * scale, 8 * scale);
        ctx.fillRect(x + 4 * scale, y - 2 * scale, 8 * scale, 4 * scale);
        ctx.fillRect(x + 8 * scale, y - 8 * scale, 4 * scale, 10 * scale);
        // Highlight
        ctx.fillStyle = '#4a9a4a';
        ctx.fillRect(x - 2 * scale, y - 8 * scale, 3 * scale, 16 * scale);
    },

    _drawDune(ctx, x, y, w, h) {
        ctx.fillStyle = '#c0a050';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.quadraticCurveTo(x + w / 2, y - h * 0.3, x + w, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawSkull(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#d0c8b0';
        // Head
        ctx.beginPath();
        ctx.arc(x, y - 2 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        // Jaw
        ctx.fillRect(x - 4 * scale, y + 2 * scale, 8 * scale, 4 * scale);
        // Eyes
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x - 2.5 * scale, y - 3 * scale, 1.8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 2.5 * scale, y - 3 * scale, 1.8 * scale, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawOasis(ctx, x, y, w, h) {
        // Water
        this._drawPond(ctx, x, y, w, h);
        // Palm tree
        const px = x + w * 0.8;
        const py = y + h * 0.3;
        const scale = w / 80;
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(px - 2 * scale, py - 15 * scale, 4 * scale, 18 * scale);
        // Fronds
        ctx.fillStyle = '#3a8a3a';
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.translate(px, py - 15 * scale);
            ctx.rotate(-Math.PI / 3 + (Math.PI * 2 / 6) * i);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(5 * scale, -3 * scale, 15 * scale, 3 * scale);
            ctx.quadraticCurveTo(5 * scale, -1 * scale, 0, 0);
            ctx.fill();
            ctx.restore();
        }
    },

    _drawBones(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.strokeStyle = '#d0c0a0';
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = 'round';
        // Crossed bones
        ctx.beginPath();
        ctx.moveTo(x - 6 * scale, y - 4 * scale);
        ctx.lineTo(x + 6 * scale, y + 4 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 6 * scale, y - 4 * scale);
        ctx.lineTo(x - 6 * scale, y + 4 * scale);
        ctx.stroke();
        // Knobs
        for (const [dx, dy] of [[-6, -4], [6, 4], [6, -4], [-6, 4]]) {
            ctx.fillStyle = '#d0c0a0';
            ctx.beginPath();
            ctx.arc(x + dx * scale, y + dy * scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    _drawIcicle(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#80c0e0';
        ctx.globalAlpha = 0.7;
        // Cluster of icicles
        for (let i = 0; i < 3; i++) {
            const ix = x + (i - 1) * 5 * scale;
            const len = 12 + i * 4;
            ctx.beginPath();
            ctx.moveTo(ix - 2 * scale, y - 5 * scale);
            ctx.lineTo(ix, y + len * scale);
            ctx.lineTo(ix + 2 * scale, y - 5 * scale);
            ctx.closePath();
            ctx.fill();
        }
        // Shine
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y - 2 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _drawSnowpile(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#e0e8f0';
        ctx.beginPath();
        ctx.arc(x, y + 3 * scale, 10 * scale, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#f0f4f8';
        ctx.beginPath();
        ctx.arc(x - 3 * scale, y + 2 * scale, 7 * scale, Math.PI, 0);
        ctx.fill();
    },

    _drawFrozenPool(ctx, x, y, w, h) {
        ctx.fillStyle = '#3060a0';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Ice surface
        ctx.fillStyle = 'rgba(200,230,255,0.3)';
        ctx.fill();
        // Cracks
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.3);
        ctx.lineTo(x + w * 0.6, y + h * 0.5);
        ctx.lineTo(x + w * 0.5, y + h * 0.7);
        ctx.stroke();
    },

    _drawCrystal(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#80d0ff';
        ctx.shadowColor = '#80d0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, y - 14 * scale);
        ctx.lineTo(x - 6 * scale, y + 2 * scale);
        ctx.lineTo(x - 2 * scale, y + 8 * scale);
        ctx.lineTo(x + 2 * scale, y + 8 * scale);
        ctx.lineTo(x + 6 * scale, y + 2 * scale);
        ctx.closePath();
        ctx.fill();
        // Facet
        ctx.fillStyle = '#a0e0ff';
        ctx.beginPath();
        ctx.moveTo(x, y - 14 * scale);
        ctx.lineTo(x + 6 * scale, y + 2 * scale);
        ctx.lineTo(x + 1 * scale, y - 2 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawLavaPool(ctx, x, y, w, h) {
        const t = GameState.time;
        // Lava gradient
        const gradient = ctx.createRadialGradient(
            x + w / 2, y + h / 2, 0,
            x + w / 2, y + h / 2, Math.max(w, h) / 2
        );
        gradient.addColorStop(0, '#ff6020');
        gradient.addColorStop(0.5, '#cc3010');
        gradient.addColorStop(1, '#801a08');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Bright spots
        ctx.fillStyle = '#ffaa40';
        ctx.globalAlpha = 0.3 + Math.sin(t * 2) * 0.15;
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h * 0.4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.7, y + h * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Glow
        ctx.shadowColor = '#ff4020';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ff4020';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    },

    _drawVolcano(ctx, x, y, ts) {
        const scale = ts / 40;
        // Mountain shape
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(x - 15 * scale, y + 15 * scale);
        ctx.lineTo(x - 5 * scale, y - 12 * scale);
        ctx.lineTo(x + 5 * scale, y - 12 * scale);
        ctx.lineTo(x + 15 * scale, y + 15 * scale);
        ctx.closePath();
        ctx.fill();
        // Crater
        ctx.fillStyle = '#ff4020';
        ctx.shadowColor = '#ff4020';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y - 10 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Snow cap
        ctx.fillStyle = '#8a6a4a';
        ctx.beginPath();
        ctx.moveTo(x - 8 * scale, y - 5 * scale);
        ctx.lineTo(x - 5 * scale, y - 12 * scale);
        ctx.lineTo(x + 5 * scale, y - 12 * scale);
        ctx.lineTo(x + 8 * scale, y - 5 * scale);
        ctx.closePath();
        ctx.fill();
    },

    _drawEmbers(ctx, x, y, ts) {
        // Spawn ember particles
        if (Math.random() < 0.02) {
            GameState.particles.push(new Particle(
                x + rand(-ts / 2, ts / 2), y,
                { vx: rand(-0.3, 0.3), vy: rand(-1, -0.5), life: rand(1, 2), size: rand(1, 3), color: choose(['#ff4020', '#ff8020', '#ffaa40']), friction: 1.0 }
            ));
        }
    },

    _drawCharred(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#1a1a1a';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Charred stump
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(x - 3 * scale, y - 5 * scale, 6 * scale, 8 * scale);
    },

    _drawCrack(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.strokeStyle = '#ff3020';
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 8 * scale, y - 6 * scale);
        ctx.lineTo(x - 2 * scale, y);
        ctx.lineTo(x + 3 * scale, y - 3 * scale);
        ctx.lineTo(x + 8 * scale, y + 5 * scale);
        ctx.stroke();
        // Glow
        ctx.shadowColor = '#ff4020';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    },

    _drawPortal(ctx, x, y, w, h) {
        const t = GameState.time;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 2;

        // Outer ring
        ctx.strokeStyle = '#8040c0';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#a060e0';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner void
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, '#200040');
        gradient.addColorStop(0.7, '#100020');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
        ctx.fill();

        // Spinning particles
        for (let i = 0; i < 6; i++) {
            const angle = t * 1.5 + (Math.PI * 2 / 6) * i;
            const pr = r * 0.6;
            const px = cx + Math.cos(angle) * pr;
            const py = cy + Math.sin(angle) * pr;
            ctx.fillStyle = '#c080ff';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    },

    _drawShadowRift(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        ctx.fillStyle = '#200040';
        ctx.globalAlpha = 0.5 + Math.sin(t * 1.5) * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6020a0';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
    },

    _drawRune(ctx, x, y, ts) {
        const scale = ts / 40;
        const t = GameState.time;
        ctx.strokeStyle = '#8060c0';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.2;
        // Rune circle
        ctx.beginPath();
        ctx.arc(x, y, 7 * scale, 0, Math.PI * 2);
        ctx.stroke();
        // Inner symbol
        ctx.beginPath();
        ctx.moveTo(x, y - 5 * scale);
        ctx.lineTo(x - 4 * scale, y + 3 * scale);
        ctx.lineTo(x + 4 * scale, y + 3 * scale);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1;
    },

    _drawVoidCrystal(ctx, x, y, ts) {
        const scale = ts / 40;
        ctx.fillStyle = '#6040a0';
        ctx.shadowColor = '#8060c0';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, y - 12 * scale);
        ctx.lineTo(x - 5 * scale, y);
        ctx.lineTo(x, y + 8 * scale);
        ctx.lineTo(x + 5 * scale, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8060c0';
        ctx.beginPath();
        ctx.moveTo(x, y - 12 * scale);
        ctx.lineTo(x + 5 * scale, y);
        ctx.lineTo(x + 2 * scale, y - 4 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    // ===== PATH ARROWS =====
    _drawPathArrows(ctx, mapDef) {
        const path = GameState.detailedPath;
        if (!path || path.length < 2) return;

        ctx.fillStyle = colorAlpha(brighten(mapDef.pathColor, 40), 0.4);
        // Draw arrows at regular intervals along the smooth path
        const step = Math.max(4, Math.floor(path.length / 15));
        for (let i = 0; i < path.length - step; i += step) {
            const a = path[i];
            const b = path[Math.min(i + step, path.length - 1)];
            const angle = angleBetween(a, b);

            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    },

    // ===== ENTRY/EXIT MARKERS =====
    _drawEntryExit(ctx, mapDef) {
        if (GameState.waypoints.length < 2) return;

        const entry = GameState.waypoints[0];
        const exit = GameState.waypoints[GameState.waypoints.length - 1];
        const t = GameState.time;
        const ts = CONFIG.TILE_SIZE;

        // Entry marker — pulsing green
        ctx.save();
        ctx.fillStyle = '#40ff80';
        ctx.shadowColor = '#40ff80';
        ctx.shadowBlur = 8 + Math.sin(t * 3) * 4;
        ctx.font = `bold ${Math.round(ts * 0.3)}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.fillText('START', entry.x, entry.y - ts * 0.45);
        // Animated circle
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#40ff80';
        ctx.beginPath();
        ctx.arc(entry.x, entry.y, 8 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#40ff80';
        ctx.beginPath();
        ctx.arc(entry.x, entry.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Exit marker — pulsing red
        ctx.save();
        ctx.fillStyle = '#ff4040';
        ctx.shadowColor = '#ff4040';
        ctx.shadowBlur = 8 + Math.sin(t * 3 + 1) * 4;
        ctx.font = `bold ${Math.round(ts * 0.3)}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', exit.x, exit.y - ts * 0.45);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff4040';
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 8 + Math.sin(t * 4 + 1) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff4040';
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // ===== THEME EFFECTS =====
    _drawThemeEffects(ctx, mapDef) {
        const t = GameState.time;
        switch (mapDef.theme) {
            case 'forest':
                if (Math.random() < 0.02) {
                    GameState.particles.push(new Particle(
                        Math.random() * logicalWidth, -5,
                        { vx: rand(0.3, 1), vy: rand(0.5, 1.5), life: rand(3, 6), size: 2, color: '#4a8a2a', gravity: 0.1, friction: 1.0 }
                    ));
                }
                break;
            case 'desert':
                if (Math.random() < 0.03) {
                    GameState.particles.push(new Particle(
                        -5, rand(0, logicalHeight),
                        { vx: rand(1, 3), vy: rand(-0.2, 0.2), life: rand(3, 5), size: 1, color: '#8a7a50', friction: 1.0 }
                    ));
                }
                break;
            case 'ice':
                if (Math.random() < 0.04) {
                    GameState.particles.push(new Particle(
                        rand(0, logicalWidth), -5,
                        { vx: rand(-0.5, 0.5), vy: rand(0.5, 1.5), life: rand(4, 8), size: rand(1, 2), color: '#c0e0ff', gravity: 0.05, friction: 1.0 }
                    ));
                }
                break;
            case 'volcano':
                if (Math.random() < 0.02) {
                    GameState.particles.push(new Particle(
                        rand(0, logicalWidth), logicalHeight + 5,
                        { vx: rand(-0.3, 0.3), vy: rand(-1.5, -0.5), life: rand(2, 4), size: rand(1, 3), color: choose(['#ff4020', '#ff8020']), friction: 1.0 }
                    ));
                }
                // Heat haze effect
                ctx.globalAlpha = 0.02;
                ctx.fillStyle = '#ff4020';
                ctx.fillRect(0, logicalHeight - 30, logicalWidth, 30);
                ctx.globalAlpha = 1;
                break;
            case 'shadow':
                if (Math.random() < 0.015) {
                    GameState.particles.push(new Particle(
                        rand(0, logicalWidth), rand(0, logicalHeight),
                        { vx: rand(-0.3, 0.3), vy: rand(-1, -0.3), life: rand(2, 5), size: rand(2, 4), color: '#6020a0', glow: true, friction: 1.0 }
                    ));
                }
                // Darkness vignette
                const gradient = ctx.createRadialGradient(
                    logicalWidth / 2, logicalHeight / 2, logicalWidth * 0.3,
                    logicalWidth / 2, logicalHeight / 2, logicalWidth * 0.7
                );
                gradient.addColorStop(0, 'rgba(0,0,0,0)');
                gradient.addColorStop(1, 'rgba(10,5,21,0.3)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, logicalWidth, logicalHeight);
                break;
        }
    },

    // ===== MINI MAP FOR MAP SELECT =====
    drawMiniMap(previewCtx, mapIndex, w, h) {
        const mapDef = MAPS[mapIndex];
        const ts = Math.min(w / CONFIG.CANVAS_TILES_X, h / CONFIG.CANVAS_TILES_Y);
        const offsetX = (w - CONFIG.CANVAS_TILES_X * ts) / 2;
        const offsetY = (h - CONFIG.CANVAS_TILES_Y * ts) / 2;

        previewCtx.clearRect(0, 0, w, h);

        // Background
        const bgGrad = previewCtx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, brighten(mapDef.bgColor, 10));
        bgGrad.addColorStop(1, brighten(mapDef.bgColor, -14));
        previewCtx.fillStyle = bgGrad;
        previewCtx.fillRect(0, 0, w, h);

        // Terrain micro-grid / texture
        previewCtx.save();
        previewCtx.globalAlpha = 0.08;
        previewCtx.strokeStyle = mapDef.gridColor;
        previewCtx.lineWidth = 1;
        for (let c = 0; c <= CONFIG.CANVAS_TILES_X; c += 2) {
            const x = offsetX + c * ts;
            previewCtx.beginPath();
            previewCtx.moveTo(x, offsetY);
            previewCtx.lineTo(x, offsetY + CONFIG.CANVAS_TILES_Y * ts);
            previewCtx.stroke();
        }
        for (let r = 0; r <= CONFIG.CANVAS_TILES_Y; r += 2) {
            const y = offsetY + r * ts;
            previewCtx.beginPath();
            previewCtx.moveTo(offsetX, y);
            previewCtx.lineTo(offsetX + CONFIG.CANVAS_TILES_X * ts, y);
            previewCtx.stroke();
        }
        previewCtx.restore();

        // Draw simplified decorations for map identity/readability.
        if (Array.isArray(mapDef.decorations)) {
            const decoColor = (type) => {
                switch (type) {
                    case 'tree':
                    case 'bush':
                    case 'grass_tall':
                    case 'frostpine':
                        return '#5bbf74';
                    case 'flowers':
                    case 'butterfly':
                        return '#ff86d8';
                    case 'rock':
                    case 'stump':
                    case 'sandstone':
                    case 'obsidian':
                    case 'iceberg':
                        return '#9ea7bf';
                    case 'pond':
                    case 'oasis':
                    case 'frozenpool':
                    case 'darkpool':
                        return '#54a8ff';
                    case 'lava':
                    case 'lavaspout':
                    case 'embers':
                    case 'crack':
                        return '#ff7f4f';
                    case 'portal':
                    case 'voidrift':
                    case 'shadowrift':
                    case 'rune':
                    case 'voidcrystal':
                    case 'soultorch':
                    case 'specter':
                    case 'eyeball':
                        return '#b07cff';
                    case 'icicle':
                    case 'snowpile':
                    case 'snowflake':
                    case 'crystal':
                    case 'aurora':
                    case 'penguins':
                        return '#9dd7ff';
                    default:
                        return '#d0b27a';
                }
            };

            previewCtx.save();
            for (const deco of mapDef.decorations) {
                if (!deco) continue;
                const dw = (deco.w || 1) * ts;
                const dh = (deco.h || 1) * ts;
                const cx = offsetX + deco.x * ts + dw / 2;
                const cy = offsetY + deco.y * ts + dh / 2;
                previewCtx.fillStyle = decoColor(deco.type);

                const areaType = (deco.w && deco.w > 1) || (deco.h && deco.h > 1) ||
                    deco.type === 'pond' || deco.type === 'lava' || deco.type === 'oasis' ||
                    deco.type === 'frozenpool' || deco.type === 'portal' || deco.type === 'voidrift' ||
                    deco.type === 'darkpool' || deco.type === 'aurora' || deco.type === 'mirage';

                if (areaType) {
                    previewCtx.globalAlpha = 0.24;
                    previewCtx.beginPath();
                    previewCtx.ellipse(cx, cy, Math.max(2, dw * 0.42), Math.max(2, dh * 0.42), 0, 0, Math.PI * 2);
                    previewCtx.fill();
                } else {
                    previewCtx.globalAlpha = 0.38;
                    previewCtx.beginPath();
                    previewCtx.arc(cx, cy, Math.max(1.6, ts * 0.22), 0, Math.PI * 2);
                    previewCtx.fill();
                }
            }
            previewCtx.restore();
        }

        // Draw path from waypoints (orthogonal with rounded corners)
        const waypoints = mapDef.waypoints;
        if (waypoints.length >= 2) {
            const miniPts = waypoints.map(([c, r]) => ({
                x: offsetX + c * ts + ts / 2,
                y: offsetY + r * ts + ts / 2
            }));
            const smoothMini = this._buildRoundedOrthogonalPath(miniPts, ts * 0.45, 5);

            // Path shadow
            previewCtx.strokeStyle = brighten(mapDef.pathColor, -10);
            previewCtx.lineWidth = ts * 1.2;
            previewCtx.lineCap = 'round';
            previewCtx.lineJoin = 'round';
            previewCtx.beginPath();
            previewCtx.moveTo(smoothMini[0].x, smoothMini[0].y + 2);
            for (let i = 1; i < smoothMini.length; i++) {
                previewCtx.lineTo(smoothMini[i].x, smoothMini[i].y + 2);
            }
            previewCtx.stroke();

            // Main path
            previewCtx.strokeStyle = brighten(mapDef.pathColor, 30);
            previewCtx.lineWidth = ts * 0.8;
            previewCtx.beginPath();
            previewCtx.moveTo(smoothMini[0].x, smoothMini[0].y);
            for (let i = 1; i < smoothMini.length; i++) {
                previewCtx.lineTo(smoothMini[i].x, smoothMini[i].y);
            }
            previewCtx.stroke();

            // Start/end dots
            previewCtx.fillStyle = '#40ff80';
            previewCtx.shadowColor = '#40ff80';
            previewCtx.shadowBlur = 4;
            previewCtx.beginPath();
            previewCtx.arc(
                offsetX + waypoints[0][0] * ts + ts / 2,
                offsetY + waypoints[0][1] * ts + ts / 2,
                ts * 0.8, 0, Math.PI * 2
            );
            previewCtx.fill();

            previewCtx.fillStyle = '#ff4040';
            previewCtx.shadowColor = '#ff4040';
            const last = waypoints[waypoints.length - 1];
            previewCtx.beginPath();
            previewCtx.arc(
                offsetX + last[0] * ts + ts / 2,
                offsetY + last[1] * ts + ts / 2,
                ts * 0.8, 0, Math.PI * 2
            );
            previewCtx.fill();
            previewCtx.shadowBlur = 0;
        }

        // Border vignette for depth
        const vignette = previewCtx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.65);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.32)');
        previewCtx.fillStyle = vignette;
        previewCtx.fillRect(0, 0, w, h);
    },
};
