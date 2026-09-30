const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Regex covering common emoji ranges (Emoticons, Miscellaneous Symbols, Dingbats, Supplemental Symbols)
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function findEmojisInFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const occurrences = [];

  lines.forEach((line, idx) => {
    // Ignore lines that are comments explaining the anti-emoji rule
    if (line.includes('//') && line.toLowerCase().includes('emoji')) return;

    let match;
    const globalEmojiRegex = new RegExp(EMOJI_REGEX.source, 'gu');
    while ((match = globalEmojiRegex.exec(line)) !== null) {
      occurrences.push({
        line: idx + 1,
        char: match[0],
        snippet: line.trim()
      });
    }
  });

  return occurrences;
}

test('Anti-Slop & Design Quality Standards Audit (R1 / R4)', async (t) => {
  const sourceFiles = [
    { name: 'content/ui.js', path: path.join(ROOT_DIR, 'content', 'ui.js') },
    { name: 'content/autologin.js', path: path.join(ROOT_DIR, 'content', 'autologin.js') },
    { name: 'content/content.js', path: path.join(ROOT_DIR, 'content', 'content.js') },
    { name: 'popup/popup.html', path: path.join(ROOT_DIR, 'popup', 'popup.html') },
    { name: 'popup/popup.js', path: path.join(ROOT_DIR, 'popup', 'popup.js') }
  ];

  await t.test('Zero Emoji Policy Audit across all UI source files (R1 Anti-Slop)', () => {
    const violations = [];

    for (const file of sourceFiles) {
      const found = findEmojisInFile(file.path);
      if (found.length > 0) {
        violations.push({
          file: file.name,
          count: found.length,
          samples: found.slice(0, 5)
        });
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => 
        `\n  - ${v.file} (${v.count} emojis): ${v.samples.map(s => `[L${s.line}: ${s.char}] "${s.snippet}"`).join(', ')}`
      ).join('');
      assert.fail(`Zero-Emoji Policy Violation: UI source files must not use emojis as interface icons.${details}`);
    }
  });

  await t.test('Vector SVG Icon Validation in Dashboard and Popup', () => {
    // R1 requires: "Все иконки должны быть чистыми векторными SVG (Lucide/Feather/Heroicons стиль)"
    const uiContent = fs.readFileSync(path.join(ROOT_DIR, 'content', 'ui.js'), 'utf-8');
    const popupHtml = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.html'), 'utf-8');

    // In a clean anti-slop implementation, SVG icons or SVG helper functions are utilized
    const hasSvgInUi = uiContent.includes('<svg') || uiContent.includes('svgIcon');
    const hasSvgInPopup = popupHtml.includes('<svg');

    assert.ok(
      hasSvgInUi || hasSvgInPopup,
      'Interface icons must be implemented as clean vector SVGs (<svg viewBox="...">) rather than unicode emojis'
    );
  });

  await t.test('Neutral Styling & 1px Border Audit in CSS', () => {
    const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'content', 'styles.css'), 'utf-8');
    const popupCss = fs.readFileSync(path.join(ROOT_DIR, 'popup', 'popup.css'), 'utf-8');

    // Reject flashy/acidic rainbow gradients like linear-gradient(..., red, yellow, green)
    const acidicGradientRegex = /linear-gradient\s*\([^)]*(#ff00|#00ff|rainbow|red.*yellow)/i;
    assert.equal(
      acidicGradientRegex.test(stylesCss),
      false,
      'styles.css must not contain acidic neon gradients'
    );
    assert.equal(
      acidicGradientRegex.test(popupCss),
      false,
      'popup.css must not contain acidic neon gradients'
    );

    // Verify 1px border styling usage (strict engineering aesthetic)
    assert.ok(
      stylesCss.includes('1px solid'),
      'styles.css must follow 1px subtle border styling guidelines'
    );
    assert.ok(
      popupCss.includes('1px solid'),
      'popup.css must follow 1px subtle border styling guidelines'
    );
  });
});
