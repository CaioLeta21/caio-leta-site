import sharp from 'sharp';

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#000000"/>

  <!-- Subtle accent line -->
  <rect x="100" y="200" width="60" height="4" rx="2" fill="#1E3A5F"/>

  <!-- Name -->
  <text x="100" y="280" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="bold" fill="#f0f0f0">
    Caio Leta
  </text>

  <!-- Subtitle -->
  <text x="100" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#a0a0a0">
    Bitcoin Researcher, PhD in Geology
  </text>

  <!-- Topics -->
  <text x="100" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#666666">
    Bitcoin  ·  Mining  ·  Energy  ·  Macroeconomics
  </text>

  <!-- Domain -->
  <text x="100" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#1E3A5F">
    caioleta.com
  </text>
</svg>
`;

await sharp(Buffer.from(svg))
  .png()
  .toFile('public/og-default.png');

console.log('og-default.png created (1200x630)');
