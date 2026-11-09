const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// VS Code extension standard icon size: 256x256
const svg = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient: Deep Slate -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>

    <!-- Folder Accent Gradient: Warm Amber/Gold -->
    <linearGradient id="folderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Inner Glow -->
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Squircle Base with subtle border -->
  <rect x="12" y="12" width="232" height="232" rx="52" ry="52" fill="url(#bgGrad)" stroke="#334155" stroke-width="2.5"/>

  <!-- Subtle warm glow around center -->
  <circle cx="128" cy="128" r="85" fill="url(#ambientGlow)"/>

  <!-- Codicon file-zip icon scaled & centered -->
  <!-- The Codicon viewbox is 16x16. Scaled by 9.5x = 152x152. Center offset: (256 - 152)/2 = 52 -->
  <g transform="translate(52, 52) scale(9.5)" fill="url(#folderGrad)">
    <path d="M2 6V4.5C2 3.67157 2.67157 3 3.5 3H5.58579C5.71839 3 5.84557 3.05268 5.93934 3.14645L7.29289 4.5L5.93934 5.85355C5.84557 5.94732 5.71839 6 5.58579 6H2ZM3.5 2C2.11929 2 1 3.11929 1 4.5V11.5C1 12.8807 2.11929 14 3.5 14H12.5C13.8807 14 15 12.8807 15 11.5V6.5C15 5.11929 13.8807 4 12.5 4H8.20711L6.64645 2.43934C6.36514 2.15804 5.98361 2 5.58579 2H3.5ZM9 5V7.5C9 7.77614 9.22386 8 9.5 8H10V9H9.5C9.22386 9 9 9.22386 9 9.5C9 9.77614 9.22386 10 9.5 10H10V11H9.5C9.22386 11 9 11.2239 9 11.5C9 11.7761 9.22386 12 9.5 12H10V13H3.5C2.67157 13 2 12.3284 2 11.5V7H5.58579C5.98361 7 6.36514 6.84197 6.64645 6.56066L8.20711 5H9ZM11 13V11H11.5C11.7761 11 12 10.7761 12 10.5C12 10.2239 11.7761 10 11.5 10H11V8H11.5C11.7761 8 12 7.77614 12 7.5V5H12.5C13.3284 5 14 5.67157 14 6.5V11.5C14 12.3284 13.3284 13 12.5 13H11ZM11 5V7H10V5H11Z"/>
  </g>
</svg>
`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 256 },
});

const pngBuffer = resvg.render().asPng();
const outputPath = path.join(__dirname, '..', 'icon.png');
fs.writeFileSync(outputPath, pngBuffer);
console.log('Successfully generated icon.png at ' + outputPath + ' (' + pngBuffer.length + ' bytes)');

