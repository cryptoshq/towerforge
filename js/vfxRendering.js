// ===== VFX RENDERING — PROJECTILES, EFFECTS, SCREEN OVERLAYS =====
// Orchestrates all visual effects: particles, beams, weather, decals,
// environmental particles, ring waves, and screen-wide tint overlays.
//
// IMPORTANT: Effects.updateAll() already handles GroundDecals, RingWaves,
// and ScreenEffects updates. VFXRenderer.update() only handles the
// systems NOT covered by Effects (Weather, EnvironmentalParticles).

const VFXRenderer = {
    draw(ctx) {
        // Draw projectiles
        for (const p of GameState.projectiles) {
            p.draw(ctx);
        }

        // Draw all effects (beams, particles, floating text, ground decals, ring waves)
        // Effects.drawAll handles: GroundDecals, RingWaves, beams, particles, floating text
        Effects.drawAll(ctx);

        // Draw environmental particles (dust motes, map-specific ambience)
        if (typeof EnvironmentalParticles !== 'undefined') {
            EnvironmentalParticles.draw(ctx);
        }

        // Draw weather overlay (rain, snow, embers, fog)
        if (typeof Weather !== 'undefined') {
            Weather.draw(ctx);
        }

        // Screen-wide VFX overlays (tints, flashes)
        this._drawScreenEffects(ctx);
    },

    update(dt) {
        // Only update systems NOT already handled by Effects.updateAll()
        // Effects.updateAll handles: particles, floatingTexts, beams,
        //   GroundDecals, RingWaves, ScreenEffects

        // Update weather
        if (typeof Weather !== 'undefined') {
            Weather.update(dt);
        }

        // Update environmental particles
        if (typeof EnvironmentalParticles !== 'undefined') {
            EnvironmentalParticles.update(dt);
        }
    },

    _drawScreenEffects(ctx) {
        // Global slow — blue tint
        if (GameState.globalSlow > 0) {
            ctx.save();
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = '#4080ff';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
            ctx.restore();
        }

        // Global damage buff — orange tint
        if (GameState.globalDmgBuff > 0) {
            ctx.save();
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = '#ff8040';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
            ctx.restore();
        }

        // Supernova — golden tint
        if (GameState.supernovaTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.1 * (GameState.supernovaTimer / 3);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
            ctx.restore();
        }

        // Screen effects (zoom, slow-motion, flash from ScreenEffects system)
        if (typeof ScreenEffects !== 'undefined') {
            ScreenEffects.draw(ctx);
        }
    },
};
