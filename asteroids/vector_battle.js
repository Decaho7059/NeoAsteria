/*
 * vector_battle.js – lightweight fallback for Canvas Asteroids text
 * Provides a face object and a safe Text.renderText() override that
 * uses Canvas native text when glyph outlines aren’t available.
 *
 * Works with Doug McInnes' 2010 Canvas Asteroids code.
 * You can later replace this file with a full glyph set.
 */

(function (global) {
  // Minimal face so Game can assign: Text.face = vector_battle
  var vector_battle = {
    familyName: "Vector Battle (Fallback)",
    resolution: 1000,     // used by original scaling math
    // Optionally, you can define a couple of glyphs here if you ever add outlines
    glyphs: {
      // Example of a space glyph advance (no outline needed)
      ' ': { ha: 250, o: '' }
      // You could add real outline glyphs later: { o: "m ... l ...", ha: 700 }
    }
  };

  // Ensure the face is globally accessible
  global.vector_battle = vector_battle;

  // If Text object is already defined (because asteroids.js loaded first),
  // we patch its renderText to use native canvas text as a fallback.
  function installFallback() {
    if (!global.Text || !global.Text.context) {
      // Text not initialized yet—try again shortly
      setTimeout(installFallback, 50);
      return;
    }

    // Keep original methods (in case you later add real glyphs)
    var _renderGlyph = global.Text.renderGlyph;
    var _renderText  = global.Text.renderText;

    // Override renderText so it never crashes if a glyph is missing.
    global.Text.renderText = function (str, size, x, y) {
      var ctx = this.context;
      if (!ctx) return;

      // If you later load a real glyph set and want to use it, set this to true.
      var preferVectorOutlines = false;

      if (preferVectorOutlines) {
        // Try vector path mode; fallback to native if any char is missing.
        var allHaveGlyphs = true;
        for (var i = 0; i < str.length; i++) {
          if (!this.face || !this.face.glyphs[str[i]]) {
            allHaveGlyphs = false;
            break;
          }
        }
        if (allHaveGlyphs) {
          return _renderText.call(this, str, size, x, y);
        }
      }

      // Native Canvas text fallback
      ctx.save();
      // Original engine expects the y-axis inverted for outlines; for native text
      // we keep the standard orientation and position visually similar.
      ctx.fillStyle = "#0f0";              // retro green look; tweak if you like
      ctx.font = size + "px monospace";    // consistent crisp pixel-ish font
      ctx.textBaseline = "alphabetic";
      ctx.fillText(str, x, y);
      ctx.restore();
    };

    // Also guard renderGlyph against missing glyphs (no-ops instead of errors)
    global.Text.renderGlyph = function (ctx, face, ch) {
      var glyph = face && face.glyphs && face.glyphs[ch];
      if (!glyph || !glyph.o) {
        // no outline – do nothing and advance if ha is set
        if (glyph && glyph.ha) {
          ctx.translate(glyph.ha, 0);
        }
        return;
      }
      return _renderGlyph.call(this, ctx, face, ch);
    };
  }

  // Install once scripts have initialized Text/context
  installFallback();

})(window);
