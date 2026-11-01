// One optical size and stroke for public controls; decorative icons never replace labels.
const paths = {
  right: 'M4 12h16m-6-6 6 6-6 6',
  outward: 'M6 18 18 6M6 6h12v12',
  close: 'm6 6 12 12M18 6 6 18'
};

export function controlIcon(name) {
  if (!paths[name]) throw new Error(`Unknown control icon: ${name}`);
  return `<svg class="senz-control-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[name]}"/></svg>`;
}

// Existing editorial pages and generated pages pass through the same build.
// Only text inside controls is normalized; destinations, labels and handlers stay intact.
export function normalizeControlIcons(html) {
  const glyphs = { '→': 'right', '↗': 'outward', '×': 'close', '&times;': 'close' };
  return html.replace(/(<(a|button)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (_, open, tag, body, close) =>
    open + body.split(/(<[^>]+>)/g).map(part => part.startsWith('<') ? part :
      part.replace(/→|↗|×|&times;/g, glyph => controlIcon(glyphs[glyph]))).join('') + close);
}
