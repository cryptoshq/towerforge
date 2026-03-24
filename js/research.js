// ===== RESEARCH TREE SYSTEM — BRANCHING VISUAL SKILL TREE =====
// Jedi-style branching skill tree with 4 directional branches from a central START node.
// Offense (right), Defense (left), Economy (top), Knowledge (bottom).
// Uses absolute X,Y positioning with SVG connection lines and animated states.

const ResearchSystem = {
    // -------------------------------------------------------
    // Configuration
    // -------------------------------------------------------
    tooltip: null,
    animFrame: null,
    particlePool: [],
    purchaseParticles: [],
    treeContainer: null,
    svgLayer: null,
    nodeMap: {},          // id -> { el, x, y, data, branch }
    TREE_W: 3200,
    TREE_H: 2800,
    NODE_SIZE: 58,
    NODE_GAP_X: 260,
    NODE_GAP_Y: 220,
    CENTER_X: 1600,
    CENTER_Y: 1400,

    branchColors: {
        offense:   { main: '#ff6060', glow: 'rgba(255,96,96,0.45)',   bg: 'rgba(255,96,96,0.10)',   dark: '#802020' },
        defense:   { main: '#60b0ff', glow: 'rgba(96,176,255,0.45)',  bg: 'rgba(96,176,255,0.10)',  dark: '#204080' },
        economy:   { main: '#f5cc50', glow: 'rgba(245,204,80,0.45)', bg: 'rgba(245,204,80,0.10)', dark: '#806820' },
        knowledge: { main: '#c080ff', glow: 'rgba(192,128,255,0.45)', bg: 'rgba(192,128,255,0.10)', dark: '#502080' },
    },

    branchDirections: {
        offense:   { dx:  1, dy:  0 },   // right
        defense:   { dx: -1, dy:  0 },   // left
        economy:   { dx:  0, dy: -1 },   // up
        knowledge: { dx:  0, dy:  1 },   // down
    },

    branchIcons: {
        offense: '\u2694',
        defense: '\uD83D\uDEE1',
        economy: '\uD83D\uDCB0',
        knowledge: '\uD83D\uDCDA',
    },

    // -------------------------------------------------------
    // Initialization
    // -------------------------------------------------------
    // Drag state
    _drag: {
        active: false,
        startX: 0,
        startY: 0,
        scrollStartX: 0,
        scrollStartY: 0,
        moved: false,
    },

    init() {
        this._ensureTooltip();
        this.render();
        this._initDrag();
    },

    _initDrag() {
        const container = document.getElementById('research-tree');
        if (!container || container._dragInitialized) return;
        container._dragInitialized = true;

        container.style.cursor = 'grab';
        container.style.overflow = 'hidden';

        const drag = this._drag;

        container.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            drag.active = true;
            drag.moved = false;
            drag.startX = e.clientX;
            drag.startY = e.clientY;
            drag.scrollStartX = container.scrollLeft;
            drag.scrollStartY = container.scrollTop;
            container.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!drag.active) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
            container.scrollLeft = drag.scrollStartX - dx;
            container.scrollTop = drag.scrollStartY - dy;
        });

        document.addEventListener('mouseup', () => {
            if (drag.active) {
                drag.active = false;
                container.classList.remove('dragging');
            }
        });

        // Mouse wheel to scroll naturally
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            container.scrollLeft += e.deltaX || 0;
            container.scrollTop += e.deltaY || 0;
        }, { passive: false });

        // Center the tree initially
        requestAnimationFrame(() => {
            container.scrollLeft = (this.TREE_W - container.clientWidth) / 2;
            container.scrollTop = (this.TREE_H - container.clientHeight) / 2;
        });
    },

    _ensureTooltip() {
        this.tooltip = document.querySelector('.research-tooltip');
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'research-tooltip';
            document.body.appendChild(this.tooltip);
        }
    },

    // -------------------------------------------------------
    // Layout calculation — compute absolute X,Y for every node
    // -------------------------------------------------------
    _computeLayout() {
        const positions = {};
        const cx = this.CENTER_X;
        const cy = this.CENTER_Y;
        const gx = this.NODE_GAP_X;
        const gy = this.NODE_GAP_Y;

        // Generous spacing to eliminate all overlaps.
        // depthStep: distance between successive rows along the branch direction.
        // perpStep: distance between sibling nodes perpendicular to branch direction.
        const depthStepX = gx;            // 260 px between rows for horizontal branches
        const depthStepY = gy;            // 220 px between rows for vertical branches
        const horizPerpStep = this.NODE_SIZE + 90;  // 148 px perpendicular for horizontal branches
        const vertPerpStep  = this.NODE_SIZE + 90;  // 148 px perpendicular for vertical branches

        // Place a virtual "START" node at center
        positions['__start__'] = { x: cx, y: cy };

        for (const branchKey of Object.keys(RESEARCH)) {
            const branch = RESEARCH[branchKey];
            const dir = this.branchDirections[branchKey];

            for (let rowIdx = 0; rowIdx < branch.nodes.length; rowIdx++) {
                const row = branch.nodes[rowIdx];
                const depth = rowIdx + 1; // distance from center (1-based)
                const count = row.length;

                for (let colIdx = 0; colIdx < count; colIdx++) {
                    const node = row[colIdx];
                    // Spread offset perpendicular to branch direction
                    const spread = (colIdx - (count - 1) / 2);

                    let nx, ny;
                    if (dir.dx !== 0) {
                        // Horizontal branch (offense / defense)
                        nx = cx + dir.dx * depth * depthStepX;
                        ny = cy + spread * horizPerpStep;
                    } else {
                        // Vertical branch (economy / knowledge)
                        nx = cx + spread * vertPerpStep;
                        ny = cy + dir.dy * depth * depthStepY;
                    }
                    positions[node.id] = { x: Math.round(nx), y: Math.round(ny), node, branch: branchKey, rowIdx };
                }
            }
        }
        return positions;
    },

    // -------------------------------------------------------
    // Main render
    // -------------------------------------------------------
    render() {
        this._ensureTooltip();
        const container = document.getElementById('research-tree');
        if (!container) return;
        container.innerHTML = '';

        // Make the tree container scrollable with a large inner area
        container.style.position = 'relative';
        container.style.overflow = 'auto';

        const treeArea = document.createElement('div');
        treeArea.className = 'research-tree-area';
        treeArea.style.cssText = `
            position: relative;
            width: ${this.TREE_W}px;
            height: ${this.TREE_H}px;
            margin: 0 auto;
        `;
        container.appendChild(treeArea);
        this.treeContainer = treeArea;

        // Background grid pattern
        this._renderBackgroundGrid(treeArea);

        // SVG overlay for connection lines
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', this.TREE_W);
        svg.setAttribute('height', this.TREE_H);
        svg.style.cssText = `
            position: absolute; top: 0; left: 0;
            width: ${this.TREE_W}px; height: ${this.TREE_H}px;
            pointer-events: none; z-index: 1;
        `;
        // Add defs for filters and markers
        const defs = document.createElementNS(svgNS, 'defs');
        // Glow filter
        const glowFilter = document.createElementNS(svgNS, 'filter');
        glowFilter.setAttribute('id', 'line-glow');
        glowFilter.setAttribute('x', '-50%');
        glowFilter.setAttribute('y', '-50%');
        glowFilter.setAttribute('width', '200%');
        glowFilter.setAttribute('height', '200%');
        const blur = document.createElementNS(svgNS, 'feGaussianBlur');
        blur.setAttribute('stdDeviation', '1.5');
        blur.setAttribute('result', 'glow');
        glowFilter.appendChild(blur);
        const merge = document.createElementNS(svgNS, 'feMerge');
        const mn1 = document.createElementNS(svgNS, 'feMergeNode');
        mn1.setAttribute('in', 'glow');
        merge.appendChild(mn1);
        const mn2 = document.createElementNS(svgNS, 'feMergeNode');
        mn2.setAttribute('in', 'SourceGraphic');
        merge.appendChild(mn2);
        glowFilter.appendChild(merge);
        defs.appendChild(glowFilter);
        svg.appendChild(defs);

        treeArea.appendChild(svg);
        this.svgLayer = svg;

        // Compute positions
        const positions = this._computeLayout();
        this.nodeMap = {};

        // ---- Render the START hub node ----
        this._renderStartNode(treeArea, positions['__start__']);

        // ---- Render branch label badges ----
        this._renderBranchLabels(treeArea, positions);

        // ---- Render all research nodes ----
        for (const branchKey of Object.keys(RESEARCH)) {
            const branch = RESEARCH[branchKey];
            const colors = this.branchColors[branchKey];
            for (const row of branch.nodes) {
                for (const node of row) {
                    const pos = positions[node.id];
                    if (!pos) continue;
                    const el = this._createNode(node, branchKey, colors, pos.x, pos.y);
                    treeArea.appendChild(el);
                    this.nodeMap[node.id] = { el, x: pos.x, y: pos.y, data: node, branch: branchKey };
                }
            }
        }

        // ---- Draw connection lines (SVG) ----
        this._drawAllConnections(svg, positions);

        // ---- Update RP display ----
        const rpEl = document.getElementById('research-points');
        if (rpEl) rpEl.textContent = GameState.researchPoints;

        // Scroll to center on first render
        this._scrollToCenter(container);

        // Start ambient animation loop
        this._startAmbientLoop();
    },

    // -------------------------------------------------------
    // Background grid
    // -------------------------------------------------------
    _renderBackgroundGrid(parent) {
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            background-image:
                radial-gradient(circle at ${this.CENTER_X}px ${this.CENTER_Y}px,
                    rgba(50,50,120,0.10) 0%, transparent 40%),
                linear-gradient(rgba(35,35,80,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(35,35,80,0.06) 1px, transparent 1px);
            background-size: 100% 100%, 80px 80px, 80px 80px;
            pointer-events: none; z-index: 0;
        `;
        parent.appendChild(grid);
    },

    // -------------------------------------------------------
    // Central START node
    // -------------------------------------------------------
    _renderStartNode(parent, pos) {
        const el = document.createElement('div');
        const sz = 100;
        el.style.cssText = `
            position: absolute;
            left: ${pos.x - sz / 2}px;
            top: ${pos.y - sz / 2}px;
            width: ${sz}px; height: ${sz}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(245,204,80,0.20) 0%, rgba(30,30,60,0.95) 65%);
            border: 2.5px solid rgba(245,204,80,0.7);
            box-shadow: 0 0 40px rgba(245,204,80,0.25), 0 0 80px rgba(245,204,80,0.08), inset 0 0 25px rgba(245,204,80,0.08);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 5;
            font-family: 'Orbitron', sans-serif;
            color: #f5cc50; font-size: 11px; font-weight: 700;
            letter-spacing: 3px; text-shadow: 0 0 10px rgba(245,204,80,0.5);
            animation: startNodePulse 4s ease-in-out infinite;
            pointer-events: none;
        `;
        el.innerHTML = `<span style="font-size:28px;margin-bottom:3px;opacity:0.9">\u2726</span>START`;
        parent.appendChild(el);

        // Inject keyframe for start node if not already present
        if (!document.getElementById('research-tree-keyframes')) {
            const style = document.createElement('style');
            style.id = 'research-tree-keyframes';
            style.textContent = `
                @keyframes startNodePulse {
                    0%, 100% { box-shadow: 0 0 30px rgba(245,204,80,0.35), inset 0 0 20px rgba(245,204,80,0.1); }
                    50% { box-shadow: 0 0 50px rgba(245,204,80,0.55), inset 0 0 30px rgba(245,204,80,0.2); }
                }
                @keyframes nodeAvailablePulse {
                    0%, 100% { box-shadow: 0 0 12px rgba(96,204,96,0.3); }
                    50% { box-shadow: 0 0 24px rgba(96,204,96,0.6); }
                }
                @keyframes sparkFade {
                    0% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.3); }
                }
                @keyframes purchaseFlash {
                    0% { filter: brightness(2); }
                    100% { filter: brightness(1); }
                }
                @keyframes lineFlow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -20; }
                }
            `;
            document.head.appendChild(style);
        }
    },

    // -------------------------------------------------------
    // Branch direction labels
    // -------------------------------------------------------
    _renderBranchLabels(parent, positions) {
        const cx = this.CENTER_X;
        const cy = this.CENTER_Y;
        const labelsByBranch = {};

        // Keep branch labels out of active branch lanes so they never cover
        // nodes/links in the skill tree.
        const labelAnchor = {
            offense: { x: cx + 610, y: cy - 260 },
            defense: { x: cx - 610, y: cy - 260 },
            economy: { x: cx + 360, y: cy - 640 },
            knowledge: { x: cx + 360, y: cy + 640 },
        };

        for (const branchKey of Object.keys(RESEARCH)) {
            const branch = RESEARCH[branchKey];
            const colors = this.branchColors[branchKey];
            const progress = this._getBranchProgress(branch);
            const arrows = { offense: '\u25B6', defense: '\u25C0', economy: '\u25B2', knowledge: '\u25BC' };

            const lbl = document.createElement('div');
            lbl.className = `research-branch-label branch-${branchKey}`;
            lbl.style.cssText = `
                position: absolute; z-index: 3;
                font-family: 'Orbitron', sans-serif;
                font-size: 12px; font-weight: 600;
                letter-spacing: 3px;
                color: ${colors.main};
                text-shadow: 0 0 12px ${colors.glow};
                white-space: nowrap;
                pointer-events: none;
                text-align: center;
                background: rgba(12,12,28,0.15);
                padding: 6px 14px;
                border-radius: 6px;
                border: 1px solid ${colors.main}22;
                min-width: 196px;
            `;

            // Temporary placement for measurement pass.
            lbl.style.left = cx + 'px';
            lbl.style.top = cy + 'px';

            lbl.innerHTML = `<span style="opacity:0.5;font-size:9px;margin-right:4px">${arrows[branchKey]}</span> ${branch.icon} ${branch.name} <span style="opacity:0.45;font-size:9px;margin-left:4px">${progress}</span>`;
            parent.appendChild(lbl);
            labelsByBranch[branchKey] = lbl;
        }

        // Reposition labels on safe anchors away from branch content.
        for (const branchKey of Object.keys(labelsByBranch)) {
            const lbl = labelsByBranch[branchKey];
            const a = labelAnchor[branchKey];
            if (!lbl || !a) continue;
            const w = lbl.offsetWidth;
            const h = lbl.offsetHeight;
            lbl.style.left = `${Math.round(a.x - w / 2)}px`;
            lbl.style.top = `${Math.round(a.y - h / 2)}px`;
        }
    },

    // -------------------------------------------------------
    // Create a single research node DOM element
    // -------------------------------------------------------
    _createNode(node, branchKey, colors, x, y) {
        const sz = this.NODE_SIZE;
        const half = sz / 2;
        const purchased = GameState.purchasedResearch.has(node.id);
        const canBuy = this.canPurchase(node);
        const prereqsMet = this._prereqsMet(node);

        const el = document.createElement('div');
        el.className = 'research-node';
        el.dataset.nodeId = node.id;
        el.style.cssText = `
            position: absolute;
            left: ${x - half}px;
            top: ${y - half}px;
            width: ${sz}px; height: ${sz}px;
            background: linear-gradient(145deg, rgba(35,35,70,0.9), rgba(20,20,45,0.95));
            border: 2px solid rgba(70,70,130,0.45);
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.25s, border-color 0.25s, opacity 0.25s;
            font-size: 24px;
            z-index: 3;
            user-select: none;
        `;

        // ---- State classes ----
        if (purchased) {
            el.classList.add('purchased');
            el.style.borderColor = colors.main;
            el.style.background = `linear-gradient(145deg, ${colors.bg}, rgba(245,204,80,0.05))`;
            el.style.boxShadow = `0 0 16px ${colors.glow}, inset 0 0 10px rgba(245,204,80,0.04)`;
        } else if (canBuy) {
            el.classList.add('available');
            el.style.borderColor = '#60cc60';
            el.style.boxShadow = '0 0 14px rgba(96,204,96,0.25)';
            el.style.animation = 'nodeAvailablePulse 2.5s ease-in-out infinite';
        } else if (!prereqsMet) {
            el.classList.add('locked');
            el.style.opacity = '0.25';
            el.style.borderColor = 'rgba(60,60,90,0.35)';
            el.style.cursor = 'not-allowed';
        } else {
            // prereqs met but can't afford
            el.style.borderColor = 'rgba(90,90,150,0.45)';
            el.style.opacity = '0.55';
        }

        // ---- Icon ----
        const iconSpan = document.createElement('span');
        iconSpan.className = 'node-icon';
        iconSpan.textContent = node.icon;
        iconSpan.style.cssText = 'font-size:24px; line-height:1; pointer-events:none;';
        el.appendChild(iconSpan);

        // ---- Name label below node ----
        const nameLabel = document.createElement('div');
        nameLabel.style.cssText = `
            position: absolute;
            bottom: -22px; left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            font-family: 'Share Tech Mono', monospace;
            font-size: 9px;
            color: ${purchased ? colors.main : 'rgba(140,140,180,0.7)'};
            pointer-events: none;
            text-shadow: ${purchased ? '0 0 6px ' + colors.glow : 'none'};
            letter-spacing: 0.5px;
            max-width: 130px;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
            background: rgba(12,12,30,0.85);
            padding: 1px 6px;
            border-radius: 3px;
        `;
        nameLabel.textContent = node.name;
        el.appendChild(nameLabel);

        // ---- Cost badge ----
        if (!purchased) {
            const costBadge = document.createElement('span');
            costBadge.className = 'node-cost';
            costBadge.style.cssText = `
                position: absolute;
                top: -8px; right: -10px;
                font-family: 'Share Tech Mono', monospace;
                font-size: 9px;
                background: rgba(10,10,28,0.92);
                padding: 2px 5px;
                border-radius: 4px;
                border: 1px solid ${canBuy ? 'rgba(96,204,96,0.45)' : 'rgba(70,70,110,0.35)'};
                color: ${canBuy ? '#60cc60' : 'rgba(200,180,100,0.7)'};
                pointer-events: none;
                z-index: 4;
            `;
            costBadge.textContent = node.cost + ' RP';
            el.appendChild(costBadge);
        }

        // ---- Purchased checkmark overlay ----
        if (purchased) {
            const check = document.createElement('div');
            check.style.cssText = `
                position: absolute; top: -7px; right: -7px;
                width: 18px; height: 18px;
                background: ${colors.main};
                color: #1a1a2e;
                border-radius: 50%;
                font-size: 11px; font-weight: 700;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 8px ${colors.glow};
                pointer-events: none;
                z-index: 5;
            `;
            check.textContent = '\u2713';
            el.appendChild(check);
        }

        // ---- Branch color accent line on top ----
        const accent = document.createElement('div');
        accent.style.cssText = `
            position: absolute; top: 0; left: 20%; right: 20%; height: 2px;
            background: ${purchased ? colors.main : (canBuy ? '#60cc60' : 'transparent')};
            border-radius: 0 0 2px 2px;
            opacity: ${purchased ? 0.8 : 0.5};
            pointer-events: none;
        `;
        el.appendChild(accent);

        // ---- Click handler ----
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!purchased && canBuy) {
                this.purchase(node);
            } else if (!purchased && !canBuy) {
                this._showLockReason(node, el);
            }
        });

        // ---- Hover handlers for tooltip ----
        el.addEventListener('mouseenter', (e) => {
            this._showTooltip(node, e, colors, branchKey);
            if (!purchased && !el.classList.contains('locked')) {
                el.style.transform = 'scale(1.12)';
            }
        });
        el.addEventListener('mousemove', (e) => {
            this._positionTooltip(e);
        });
        el.addEventListener('mouseleave', () => {
            this._hideTooltip();
            el.style.transform = 'scale(1)';
        });

        return el;
    },

    // -------------------------------------------------------
    // SVG Connection lines between nodes
    // -------------------------------------------------------
    _drawAllConnections(svg, positions) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const cx = this.CENTER_X;
        const cy = this.CENTER_Y;

        for (const branchKey of Object.keys(RESEARCH)) {
            const branch = RESEARCH[branchKey];
            const colors = this.branchColors[branchKey];

            // Draw line from START to each row-0 node
            for (const node of branch.nodes[0]) {
                const pos = positions[node.id];
                if (!pos) continue;
                const nodePurchased = GameState.purchasedResearch.has(node.id);

                this._drawSvgLine(svg, svgNS, cx, cy, pos.x, pos.y,
                    nodePurchased ? 'purchased' : 'start',
                    colors
                );
            }

            // Draw lines from parent prerequisites to children
            for (let rowIdx = 1; rowIdx < branch.nodes.length; rowIdx++) {
                for (const node of branch.nodes[rowIdx]) {
                    if (!node.requires) continue;
                    const childPos = positions[node.id];
                    if (!childPos) continue;
                    const childPurchased = GameState.purchasedResearch.has(node.id);

                    for (const reqId of node.requires) {
                        const parentPos = positions[reqId];
                        if (!parentPos) continue;
                        const parentPurchased = GameState.purchasedResearch.has(reqId);

                        let state = 'locked';
                        if (childPurchased && parentPurchased) {
                            state = 'purchased';
                        } else if (parentPurchased) {
                            state = 'available';
                        }

                        this._drawSvgLine(svg, svgNS,
                            parentPos.x, parentPos.y,
                            childPos.x, childPos.y,
                            state, colors
                        );
                    }
                }
            }
        }
    },

    _drawSvgLine(svg, svgNS, x1, y1, x2, y2, state, colors) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return;

        const nodeRadius = this.NODE_SIZE / 2 + 4; // stop slightly outside node edge
        const ux = dx / dist;
        const uy = dy / dist;

        // Pull both endpoints inward by the node radius
        const sx1 = x1 + ux * nodeRadius;
        const sy1 = y1 + uy * nodeRadius;
        const sx2 = x2 - ux * nodeRadius;
        const sy2 = y2 - uy * nodeRadius;

        // Calculate control points for a subtle curve
        const mx = (sx1 + sx2) / 2;
        const my = (sy1 + sy2) / 2;
        const shortDist = Math.sqrt((sx2 - sx1) ** 2 + (sy2 - sy1) ** 2);

        const curveStrength = shortDist * 0.06;
        const nx = -dy / dist * curveStrength;
        const ny =  dx / dist * curveStrength;
        const cmx = mx + nx * 0.25;
        const cmy = my + ny * 0.25;

        const path = document.createElementNS(svgNS, 'path');
        const d = `M ${sx1} ${sy1} Q ${cmx} ${cmy} ${sx2} ${sy2}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');

        if (state === 'purchased') {
            path.setAttribute('stroke', colors.main);
            path.setAttribute('stroke-width', '2.5');
            path.setAttribute('filter', 'url(#line-glow)');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-opacity', '0.85');
        } else if (state === 'available' || state === 'start') {
            path.setAttribute('stroke', 'rgba(96,204,96,0.6)');
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('stroke-dasharray', '6,4');
            path.setAttribute('stroke-linecap', 'round');
            path.style.animation = 'lineFlow 5s linear infinite';
        } else {
            path.setAttribute('stroke', 'rgba(70,70,130,0.15)');
            path.setAttribute('stroke-width', '1');
            path.setAttribute('stroke-dasharray', '3,5');
        }

        svg.appendChild(path);
    },

    // -------------------------------------------------------
    // Scroll to center
    // -------------------------------------------------------
    _scrollToCenter(container) {
        if (this._skipScrollToCenter) return;
        requestAnimationFrame(() => {
            const scrollLeft = this.CENTER_X - container.clientWidth / 2;
            const scrollTop = this.CENTER_Y - container.clientHeight / 2;
            container.scrollLeft = Math.max(0, scrollLeft);
            container.scrollTop = Math.max(0, scrollTop);
        });
    },

    // -------------------------------------------------------
    // Ambient animation loop (particles on purchased nodes)
    // -------------------------------------------------------
    _startAmbientLoop() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);

        const loop = () => {
            this._updatePurchaseParticles();
            this.animFrame = requestAnimationFrame(loop);
        };
        this.animFrame = requestAnimationFrame(loop);
    },

    _updatePurchaseParticles() {
        // Remove expired particles
        for (let i = this.purchaseParticles.length - 1; i >= 0; i--) {
            const p = this.purchaseParticles[i];
            p.life -= 16;
            if (p.life <= 0) {
                if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
                this.purchaseParticles.splice(i, 1);
            } else if (p.el) {
                const progress = 1 - p.life / p.maxLife;
                p.el.style.opacity = (1 - progress).toFixed(2);
                p.el.style.left = (p.sx + p.vx * progress * 60) + 'px';
                p.el.style.top = (p.sy + p.vy * progress * 60 - progress * 20) + 'px';
            }
        }
    },

    // -------------------------------------------------------
    // Tooltip system
    // -------------------------------------------------------
    _showTooltip(node, e, colors, branchKey) {
        if (!this.tooltip) return;
        const purchased = GameState.purchasedResearch.has(node.id);
        const canBuy = this.canPurchase(node);
        const prereqsMet = this._prereqsMet(node);
        const mainColor = colors.main;

        let html = '';

        // Header
        html += `<h4 style="color:${mainColor}; display:flex; align-items:center; gap:6px;">`;
        html += `<span style="font-size:18px">${node.icon}</span> ${node.name}`;
        html += `</h4>`;

        // Branch indicator
        html += `<div style="font-size:9px; color:${mainColor}; opacity:0.55; letter-spacing:1.5px; margin-bottom:6px; font-family:'Orbitron',sans-serif;">`;
        html += `${RESEARCH[branchKey].name} BRANCH</div>`;

        // Description
        html += `<p style="font-size:12px; color:#bbc; line-height:1.5; margin:6px 0">${node.desc}</p>`;

        // Effect breakdown
        if (node.effect) {
            html += '<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08)">';
            for (const [key, val] of Object.entries(node.effect)) {
                const label = this._effectLabel(key);
                let valStr;
                if (typeof val === 'number') {
                    valStr = val > 0
                        ? `+${val < 1 ? Math.round(val * 100) + '%' : val}`
                        : String(val);
                } else {
                    valStr = val === true ? '\u2713 Enabled' : String(val);
                }
                html += `<div style="font-size:11px; color:#99a8cc; padding:2px 0; display:flex; justify-content:space-between;">`;
                html += `<span>${label}</span>`;
                html += `<span style="color:${mainColor}; font-weight:600">${valStr}</span>`;
                html += `</div>`;
            }
            html += '</div>';
        }

        // Cost / status
        if (purchased) {
            html += `<div class="rt-cost" style="color:#50ff90; text-align:center; margin-top:10px; font-size:13px;">\u2713 PURCHASED</div>`;
        } else {
            const affordable = GameState.researchPoints >= node.cost;
            html += `<div class="rt-cost" style="color:${affordable ? '#f5cc50' : '#ff5050'}; text-align:center; margin-top:10px;">`;
            html += `Cost: ${node.cost} RP`;
            if (!affordable) html += ` <span style="opacity:0.6">(have ${GameState.researchPoints})</span>`;
            html += `</div>`;
        }

        // Prerequisites
        if (node.requires && !purchased) {
            html += `<div class="rt-requires" style="margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.06);">`;
            html += `<div style="font-size:10px; color:#777; margin-bottom:3px; letter-spacing:1px;">PREREQUISITES:</div>`;
            for (const reqId of node.requires) {
                const reqNode = this._findNode(reqId);
                const met = GameState.purchasedResearch.has(reqId);
                const mark = met ? '\u2713' : '\u2717';
                const col = met ? '#50ff90' : '#ff5050';
                html += `<div style="font-size:11px; color:${col}; padding:1px 0;">${mark} ${reqNode ? reqNode.name : reqId}</div>`;
            }
            html += `</div>`;
        }

        // Purchase hint
        if (!purchased && canBuy) {
            html += `<div style="margin-top:10px; padding-top:6px; border-top:1px solid rgba(96,204,96,0.2); text-align:center; font-size:11px; color:#60cc60;">`;
            html += `\u25B6 Click to purchase</div>`;
        } else if (!purchased && prereqsMet && !canBuy) {
            html += `<div style="margin-top:8px; text-align:center; font-size:10px; color:#ff6060; opacity:0.7;">Not enough RP</div>`;
        } else if (!purchased && !prereqsMet) {
            html += `<div style="margin-top:8px; text-align:center; font-size:10px; color:#888; opacity:0.7;">Unlock prerequisites first</div>`;
        }

        this.tooltip.innerHTML = html;
        this.tooltip.style.display = 'block';
        this._positionTooltip(e);
    },

    _positionTooltip(e) {
        if (!this.tooltip) return;
        const ttW = 300;
        const ttH = this.tooltip.offsetHeight || 200;
        let left = e.clientX + 18;
        let top = e.clientY - 12;

        if (left + ttW > window.innerWidth - 10) left = e.clientX - ttW - 18;
        if (top + ttH > window.innerHeight - 10) top = window.innerHeight - ttH - 10;
        if (top < 10) top = 10;

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    },

    _hideTooltip() {
        if (this.tooltip) this.tooltip.style.display = 'none';
    },

    // -------------------------------------------------------
    // Effect label humanization
    // -------------------------------------------------------
    _effectLabel(key) {
        const labels = {
            dmgMult: 'Damage Bonus',
            rangeMult: 'Range Bonus',
            rateMult: 'Fire Rate Bonus',
            critChance: 'Crit Chance',
            critDmg: 'Crit Damage',
            costReduce: 'Build Cost Reduction',
            upgradeDiscount: 'Upgrade Discount',
            bonusGold: 'Starting Gold',
            bonusLives: 'Starting Lives',
            bonusRP: 'Bonus RP / Game',
            sellRefund: 'Sell Refund',
            interestRate: 'Interest Rate',
            interestCap: 'Interest Cap',
            secondChance: 'Second Chance',
            startShield: 'Starting Shields',
            reducedLeak: 'Reduced Leak Damage',
            overclockRecovery: 'Overclock Recovery',
            masteryMult: 'Mastery Multiplier',
            masteryBonus: 'Free Mastery Kills',
            synergyMult: 'Synergy Multiplier',
            achievementRP: 'RP from Achievements',
            lifeInsGold: 'Gold on Life Loss',
            omniscience: 'See Invisible Enemies',
            costMult: 'Cost Modifier',
            effectDuration: 'Effect Duration',
            armorPierce: 'Armor Pierce',
            dualMastery: 'Dual Path Mastery',
            towerImmune: 'Tower Immunity',
            lastStand: 'Last Stand',
            frostArmor: 'Frost Armor',
            emergencyCdr: 'Emergency Cooldown',
            invulnWindow: 'Invulnerable Window',
            phoenixChance: 'Phoenix Respawn',
            compoundInterest: 'Compound Interest',
            bossGold: 'Boss Gold Bonus',
            waveBonusMult: 'Wave Bonus Multiplier',
            goldRush: 'Gold Rush Bonus',
            scoutingReport: 'Scouting Report',
            blueprints: 'Blueprint Slots',
            endlessRP: 'Endless RP',
            tacticalDisplay: 'Tactical Display',
            killGoldBonus: 'Kill Gold Bonus',
            tomeDropMult: 'Tome Drop Multiplier',
            ultimateCdr: 'Ultimate Cooldown',
            draftReroll: 'Draft Rerolls',
            endlessMilestoneBoost: 'Endless Milestone Rewards',
            abilityCdOnEliteKill: 'Cooldown on Elite Kill',
            weeklyRpMult: 'Weekly RP Bonus',
        };
        return labels[key] || key;
    },

    // -------------------------------------------------------
    // Prerequisite check
    // -------------------------------------------------------
    _prereqsMet(node) {
        if (!node.requires) return true;
        for (const req of node.requires) {
            if (!GameState.purchasedResearch.has(req)) return false;
        }
        return true;
    },

    // -------------------------------------------------------
    // Can purchase check
    // -------------------------------------------------------
    canPurchase(node) {
        if (GameState.purchasedResearch.has(node.id)) return false;
        if (GameState.researchPoints < node.cost) return false;
        if (node.requires) {
            for (const req of node.requires) {
                if (!GameState.purchasedResearch.has(req)) return false;
            }
        }
        return true;
    },

    // -------------------------------------------------------
    // Purchase a node
    // -------------------------------------------------------
    purchase(node) {
        if (!this.canPurchase(node)) return;

        GameState.researchPoints -= node.cost;
        GameState.purchasedResearch.add(node.id);
        GameState.computeResearchBonuses();
        GameState.stats.researchCount = GameState.purchasedResearch.size;

        // Play upgrade sound
        if (typeof Audio !== 'undefined' && Audio.play) {
            Audio.play('upgrade');
        }

        // Spawn sparkle particle effect on the node
        const nodeInfo = this.nodeMap[node.id];
        if (nodeInfo && nodeInfo.el) {
            this._spawnPurchaseEffect(nodeInfo.el, nodeInfo.x, nodeInfo.y, this.branchColors[nodeInfo.branch]);
        }

        // Flash the RP counter
        this._flashRPCounter();

        // Re-render the entire tree, preserving scroll position
        const container = document.getElementById('research-tree');
        let savedScrollLeft = 0, savedScrollTop = 0;
        if (container) {
            savedScrollLeft = container.scrollLeft;
            savedScrollTop = container.scrollTop;
        }

        this._skipScrollToCenter = true;
        this.render();
        this._skipScrollToCenter = false;

        if (container) {
            container.scrollLeft = savedScrollLeft;
            container.scrollTop = savedScrollTop;
        }

        // Save
        if (typeof SaveSystem !== 'undefined' && SaveSystem.savePersistent) {
            SaveSystem.savePersistent();
        }
    },

    // -------------------------------------------------------
    // Purchase sparkle effect — particles burst from the node
    // -------------------------------------------------------
    _spawnPurchaseEffect(nodeEl, nx, ny, colors) {
        const rect = nodeEl.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        const particleCount = 16;

        for (let i = 0; i < particleCount; i++) {
            const spark = document.createElement('div');
            const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const speed = 35 + Math.random() * 30;
            const size = 3 + Math.random() * 4;
            const isGold = Math.random() > 0.4;
            const color = isGold ? '#f5cc50' : colors.main;

            spark.style.cssText = `
                position: fixed;
                z-index: 300;
                pointer-events: none;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${color};
                box-shadow: 0 0 ${size + 4}px ${color}, 0 0 ${size + 8}px ${color};
                left: ${startX}px;
                top: ${startY}px;
            `;
            document.body.appendChild(spark);

            const endX = startX + Math.cos(angle) * speed;
            const endY = startY + Math.sin(angle) * speed;

            spark.animate([
                {
                    left: startX + 'px',
                    top: startY + 'px',
                    opacity: 1,
                    transform: 'scale(1)'
                },
                {
                    left: endX + 'px',
                    top: endY + 'px',
                    opacity: 0,
                    transform: 'scale(0.2)'
                }
            ], {
                duration: 450 + Math.random() * 250,
                easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
                fill: 'forwards'
            });

            setTimeout(() => {
                if (spark.parentNode) spark.parentNode.removeChild(spark);
            }, 750);
        }

        // Ring expansion effect
        const ring = document.createElement('div');
        ring.style.cssText = `
            position: fixed;
            z-index: 299;
            pointer-events: none;
            left: ${startX}px;
            top: ${startY}px;
            width: 0px; height: 0px;
            border: 2px solid ${colors.main};
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 12px ${colors.glow};
        `;
        document.body.appendChild(ring);

        ring.animate([
            { width: '0px', height: '0px', opacity: 1, borderWidth: '3px' },
            { width: '100px', height: '100px', opacity: 0, borderWidth: '1px' }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });

        setTimeout(() => {
            if (ring.parentNode) ring.parentNode.removeChild(ring);
        }, 550);

        // Secondary smaller ring
        const ring2 = document.createElement('div');
        ring2.style.cssText = ring.style.cssText;
        ring2.style.borderColor = '#f5cc50';
        ring2.style.boxShadow = '0 0 10px rgba(245,204,80,0.4)';
        document.body.appendChild(ring2);

        ring2.animate([
            { width: '0px', height: '0px', opacity: 0.8, borderWidth: '2px' },
            { width: '60px', height: '60px', opacity: 0, borderWidth: '1px' }
        ], {
            duration: 350,
            easing: 'ease-out',
            fill: 'forwards',
            delay: 80
        });

        setTimeout(() => {
            if (ring2.parentNode) ring2.parentNode.removeChild(ring2);
        }, 500);
    },

    // -------------------------------------------------------
    // Flash the RP counter
    // -------------------------------------------------------
    _flashRPCounter() {
        const rpEl = document.getElementById('research-points');
        if (!rpEl) return;
        rpEl.style.transition = 'none';
        rpEl.style.textShadow = '0 0 14px rgba(245,204,80,1)';
        rpEl.style.transform = 'scale(1.3)';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                rpEl.style.transition = 'text-shadow 0.6s, transform 0.4s';
                rpEl.style.textShadow = 'none';
                rpEl.style.transform = 'scale(1)';
            });
        });
    },

    // -------------------------------------------------------
    // Lock feedback — flash red on unaffordable / locked node
    // -------------------------------------------------------
    _showLockReason(node, nodeEl) {
        const prereqsMet = this._prereqsMet(node);
        const color = prereqsMet ? '#ff8040' : '#ff4040';

        nodeEl.style.transition = 'none';
        nodeEl.style.boxShadow = `0 0 20px ${color}80`;
        nodeEl.style.borderColor = color;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                nodeEl.style.transition = 'box-shadow 0.4s, border-color 0.4s';
                nodeEl.style.boxShadow = '';
                nodeEl.style.borderColor = '';
            });
        });

        // Shake animation
        nodeEl.animate([
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(3px)' },
            { transform: 'translateX(-2px)' },
            { transform: 'translateX(2px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300, easing: 'ease-in-out' });

        if (typeof Audio !== 'undefined' && Audio.play) {
            Audio.play('click');
        }
    },

    // -------------------------------------------------------
    // Branch progress helpers
    // -------------------------------------------------------
    _getBranchProgress(branch) {
        const v = this._getBranchProgressValues(branch);
        return `${v.purchased}/${v.total}`;
    },

    _getBranchProgressValues(branch) {
        let total = 0, purchased = 0;
        for (const row of branch.nodes) {
            for (const node of row) {
                total++;
                if (GameState.purchasedResearch.has(node.id)) purchased++;
            }
        }
        return { total, purchased };
    },

    // -------------------------------------------------------
    // Find node by id across all branches
    // -------------------------------------------------------
    _findNode(id) {
        for (const branch of Object.values(RESEARCH)) {
            for (const row of branch.nodes) {
                for (const node of row) {
                    if (node.id === id) return node;
                }
            }
        }
        return null;
    },

    // -------------------------------------------------------
    // Show / hide tooltip (legacy API compatibility)
    // -------------------------------------------------------
    showTooltip(node, e, colors) {
        const branchKey = this._findBranchForNode(node.id);
        this._showTooltip(node, e, colors, branchKey || 'offense');
    },

    hideTooltip() {
        this._hideTooltip();
    },

    _findBranchForNode(id) {
        for (const [key, branch] of Object.entries(RESEARCH)) {
            for (const row of branch.nodes) {
                for (const node of row) {
                    if (node.id === id) return key;
                }
            }
        }
        return null;
    },

    // -------------------------------------------------------
    // Cleanup when leaving the research screen
    // -------------------------------------------------------
    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        // Clear remaining particles
        for (const p of this.purchaseParticles) {
            if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        }
        this.purchaseParticles = [];
        this._hideTooltip();
    },

    // -------------------------------------------------------
    // Total research stats (for external display)
    // -------------------------------------------------------
    getTotalProgress() {
        let total = 0, purchased = 0;
        for (const branch of Object.values(RESEARCH)) {
            for (const row of branch.nodes) {
                for (const node of row) {
                    total++;
                    if (GameState.purchasedResearch.has(node.id)) purchased++;
                }
            }
        }
        return { total, purchased, pct: total > 0 ? purchased / total : 0 };
    },

    // -------------------------------------------------------
    // Get all purchased node ids (for save system)
    // -------------------------------------------------------
    getPurchasedIds() {
        return [...GameState.purchasedResearch];
    },

    // -------------------------------------------------------
    // Check if a specific research has been purchased (public API)
    // -------------------------------------------------------
    has(id) {
        return GameState.purchasedResearch.has(id);
    },

    // -------------------------------------------------------
    // Reset all research (for debug / prestige)
    // -------------------------------------------------------
    resetAll() {
        GameState.purchasedResearch.clear();
        GameState.computeResearchBonuses();
        this.render();
    },
};
