// Procedural 16-bit retro pixel-art canvas drawing helpers
// Set in nocturnal Tehran streets with glowing Persian neon signs, Milad Tower, and cool characters.

import { WeaponType } from './types';

// Helper for drawing pixelated textures
function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  outlineColor?: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(w) - 1, Math.floor(h) - 1);
  }
}

// 1. Draw Parallax Background
export function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollX: number,
  groundY: number
) {
  // Deep twilight night sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#090714'); // ultra-dark indigo
  skyGrad.addColorStop(0.5, '#0d0c24'); // deep purple-blue
  skyGrad.addColorStop(1, '#1b1429'); // warm twilight amethyst
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw twinkling stars (static relative to scroll)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 30; i++) {
    const starX = (i * 143) % width;
    const starY = (i * 79) % (height * 0.4);
    const size = ((i % 3) === 0) ? 2 : 1;
    ctx.fillRect(starX, starY, size, size);
  }

  // Draw Crescent Moon
  ctx.fillStyle = '#fffae3';
  ctx.shadowColor = '#e6b23c';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(width * 0.82, height * 0.15, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0; // reset shadow

  // Subtract shadow arc to make it a crescent
  ctx.fillStyle = '#090714';
  ctx.beginPath();
  ctx.arc(width * 0.82 - 6, height * 0.15 - 3, 18, 0, Math.PI * 2);
  ctx.fill();

  // Distant Mountain Horizon (Parallax Factor: 0.05)
  const mountainScroll = -(scrollX * 0.05) % width;
  ctx.fillStyle = '#141026';
  ctx.beginPath();
  for (let offset = -1; offset <= 1; offset++) {
    const base = mountainScroll + offset * width;
    ctx.lineTo(base, height);
    ctx.lineTo(base, height * 0.65);
    ctx.lineTo(base + width * 0.25, height * 0.45);
    ctx.lineTo(base + width * 0.5, height * 0.58);
    ctx.lineTo(base + width * 0.75, height * 0.4);
    ctx.lineTo(base + width, height * 0.65);
    ctx.lineTo(base + width, height);
  }
  ctx.closePath();
  ctx.fill();

  // Distant Tehran Skyline with detailed Milad Tower (Parallax Factor: 0.15)
  const skylineScroll = -(scrollX * 0.15) % width;
  ctx.fillStyle = '#1b1836';
  
  // Render Skyline silhouettes
  for (let offset = -1; offset <= 1; offset++) {
    const startX = skylineScroll + offset * width;
    
    // Draw Milad Tower Silhouette (centered at offset * width + width * 0.4)
    const towerX = startX + width * 0.45;
    const towerBaseY = groundY;
    
    // Tower stem
    drawPixelRect(ctx, towerX - 3, towerBaseY - 140, 6, 140, '#1c173d');
    drawPixelRect(ctx, towerX - 2, towerBaseY - 180, 4, 40, '#1c173d');
    
    // Tower observation deck pod
    drawPixelRect(ctx, towerX - 10, towerBaseY - 195, 20, 15, '#2e265c');
    drawPixelRect(ctx, towerX - 7, towerBaseY - 198, 14, 3, '#1c173d');
    // Tower antenna tip
    drawPixelRect(ctx, towerX - 1, towerBaseY - 240, 2, 42, '#2e265c');
    
    // Glow lights on Milad Tower
    ctx.fillStyle = '#6ef5ff'; // Cyan signal light
    ctx.fillRect(Math.floor(towerX - 1), Math.floor(towerBaseY - 190), 2, 2);
    ctx.fillStyle = '#ff6e6e'; // Red flashing beacon at top
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillRect(Math.floor(towerX - 1), Math.floor(towerBaseY - 240), 2, 2);
    }
    
    // Draw some random building block silhouettes
    ctx.fillStyle = '#15122e';
    for (let b = 0; b < 10; b++) {
      const bx = startX + 50 + b * 75;
      const bw = 35 + (b % 3) * 15;
      const bh = 50 + (b % 4) * 20;
      drawPixelRect(ctx, bx, groundY - bh, bw, bh, '#15122e');
      
      // Little yellow/cyan skyscraper glowing windows
      ctx.fillStyle = (b % 2 === 0) ? '#ffda5c' : '#6effb6';
      for (let wx = bx + 5; wx < bx + bw - 6; wx += 10) {
        for (let wy = groundY - bh + 8; wy < groundY - 10; wy += 12) {
          if ((wx + wy) % 3 === 0) {
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
    }
  }

  // Midground Architecture: Old brick facades, alleys & arches (Parallax Factor: 0.4)
  const midScroll = -(scrollX * 0.4) % width;
  for (let offset = -1; offset <= 1; offset++) {
    const startX = midScroll + offset * width;
    
    // Draw dark stone facades, archways
    // Left tall brick building
    drawPixelRect(ctx, startX + 20, groundY - 180, 80, 180, '#211c38', '#110e1f');
    // Brick lines
    ctx.fillStyle = '#292445';
    for (let by = groundY - 170; by < groundY; by += 15) {
      ctx.fillRect(startX + 20, by, 80, 2);
    }
    
    // Archway & Gate
    drawPixelRect(ctx, startX + 160, groundY - 120, 70, 120, '#1c1830', '#110e1f');
    ctx.fillStyle = '#0f0c1c';
    ctx.beginPath();
    ctx.arc(startX + 195, groundY - 70, 25, Math.PI, 0);
    ctx.fill();
    drawPixelRect(ctx, startX + 170, groundY - 70, 50, 70, '#0f0c1c');

    // Right brick shop
    drawPixelRect(ctx, startX + 320, groundY - 140, 100, 140, '#2e284a', '#18142b');
    ctx.fillStyle = '#39325c';
    for (let by = groundY - 130; by < groundY; by += 20) {
      ctx.fillRect(startX + 320, by, 100, 1);
    }
  }

  // Ground level texture (brick footpaths, stones layout)
  ctx.fillStyle = '#0f0d14';
  ctx.fillRect(0, groundY, width, height - groundY);
  
  // Grey concrete road top border
  drawPixelRect(ctx, 0, groundY, width, 6, '#3a3a4a');
  drawPixelRect(ctx, 0, groundY + 6, width, 14, '#1b1b22');

  // Road grid lines (classic scrolling stone blocks)
  const roadScroll = -scrollX % 60;
  ctx.fillStyle = '#14141a';
  for (let rx = roadScroll - 60; rx < width + 60; rx += 40) {
    ctx.fillRect(rx, groundY + 12, 4, height - groundY - 12);
  }
}

// 2. Draw Persian Neon signs
export function drawPersianNeons(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollX: number,
  groundY: number
) {
  const midScroll = -(scrollX * 0.4) % width;
  
  const textFlash = Math.floor(Date.now() / 500) % 2 === 0;
  
  for (let offset = -1; offset <= 1; offset++) {
    const startX = midScroll + offset * width;

    // NEON 1: "تهران" - TEHRAN (Hot red neon above left building)
    const neon1X = startX + 35;
    const neon1Y = groundY - 215;
    
    // Billboard frame
    drawPixelRect(ctx, neon1X, neon1Y, 50, 30, '#100c14', '#fa3c3c');
    
    // Neon text glow effect using traditional canvas shadow or overlapping thick lines
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.shadowColor = '#ff2b2b';
    ctx.shadowBlur = textFlash ? 12 : 4;
    ctx.fillStyle = textFlash ? '#ff8080' : '#b31b1b';
    ctx.fillText('تهران', neon1X + 25, neon1Y + 10);
    
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TEHRAN', neon1X + 25, neon1Y + 22);
    ctx.shadowBlur = 0; // reset

    // NEON 2: "چایخانه" - TEA HOUSE (Amber neon above archway)
    const neon2X = startX + 165;
    const neon2Y = groundY - 145;
    drawPixelRect(ctx, neon2X, neon2Y, 60, 20, '#0f0a05', '#f0a31a');
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Inter"';
    ctx.shadowColor = '#f0a31a';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffdfa3';
    ctx.fillText('چایی خانه', neon2X + 30, neon2Y + 10);
    ctx.shadowBlur = 0;

    // NEON 3: "هتل نادری" - HOTEL NADERI (Magenta/purple neon on right building)
    const neon3X = startX + 335;
    const neon3Y = groundY - 165;
    drawPixelRect(ctx, neon3X, neon3Y, 70, 22, '#120514', '#e041cf');
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Inter"';
    ctx.shadowColor = '#e041cf';
    ctx.shadowBlur = textFlash ? 15 : 6;
    ctx.fillStyle = textFlash ? '#ffbefa' : '#a82c9b';
    ctx.fillText('هتل نادری', neon3X + 35, neon3Y + 11);
    ctx.shadowBlur = 0;

    // Direct signs: Traffic / Forbidden zone ("منطقه ممنوعه")
    const signX = startX + 270;
    const signY = groundY - 80;
    // Post
    drawPixelRect(ctx, signX + 4, signY, 2, 80, '#555566');
    // Signboard
    drawPixelRect(ctx, signX - 12, signY - 20, 34, 20, '#ffffff', '#000000');
    // Red border
    ctx.strokeStyle = '#d62424';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX + 259, groundY - 99, 32, 18);
    // Tiny Persian writing
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 6px "Inter"';
    ctx.textAlign = 'center';
    ctx.fillText('ممنوع', signX + 5, signY - 10);
  }
}

// 3. Draw The Commando Player
export function drawCommandoPlayer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  dir: 1 | -1,
  state: 'idle' | 'running' | 'jumping' | 'crouching' | 'hurt' | 'sliding',
  weaponAngle: number,
  activeWeapon: WeaponType,
  frame: number,
  damageCooldown: number,
  camoColor?: 'GREEN' | 'BLUE' | 'RED' | 'GOLD'
) {
  // If flashing from damage code
  if (damageCooldown > 0 && Math.floor(damageCooldown / 4) % 2 === 0) {
    return; // skip drawing to flicker
  }

  // Resolve custom themed colors for commando outfit
  let camoColorHex = '#3a4a2a'; // Trousers
  let harnessColorHex = '#5d704d'; // Vest/Harness straps

  if (camoColor === 'BLUE') {
    camoColorHex = '#1e3a8a';
    harnessColorHex = '#3b82f6';
  } else if (camoColor === 'RED') {
    camoColorHex = '#991b1b';
    harnessColorHex = '#ef4444';
  } else if (camoColor === 'GOLD') {
    camoColorHex = '#a16207';
    harnessColorHex = '#fbbf24';
  }

  ctx.save();
  // Standard player bounds: width: 32, height: 48 (~offset x: 16, y: 48)
  ctx.translate(px, py);

  // Is flipped?
  const flip = dir === -1;
  ctx.scale(flip ? -1 : 1, 1);

  // Bobbing offset for organic Idle / Running loop
  let bobY = 0;
  let legFrame = Math.floor(frame / 6) % 4;
  if (state === 'running') {
    bobY = Math.sin(frame * 0.4) * 3;
  } else if (state === 'idle') {
    bobY = Math.sin(frame * 0.1) * 1.5;
  } else if (state === 'crouching') {
    bobY = 12;
  } else if (state === 'sliding') {
    bobY = 18; // drawn very low
  }

  // 1. LEGS
  if (state === 'sliding') {
    // Beautiful sliding tackling style legs stretched flat on floor
    drawPixelRect(ctx, -16, -6, 14, 6, camoColorHex); // back leg flat
    drawPixelRect(ctx, -6, -8, 12, 6, harnessColorHex); // front leg bent
    drawPixelRect(ctx, -19, -5, 4, 5, '#181c15'); // Left brown boot flat
    drawPixelRect(ctx, 5, -7, 4, 5, '#181c15');  // Right brown boot flat
  } else if (state === 'jumping') {
    // Drawn with legs tucked in
    drawPixelRect(ctx, -6, -14, 5, 8, camoColorHex);
    drawPixelRect(ctx, 1, -16, 5, 8, camoColorHex);
    // Boots
    drawPixelRect(ctx, -7, -6, 5, 6, '#181c15');
    drawPixelRect(ctx, 1, -8, 5, 6, '#181c15');
  } else if (state === 'crouching') {
    // Tight squeezed horizontal leg look
    drawPixelRect(ctx, -10, -8, 18, 8, camoColorHex);
    drawPixelRect(ctx, -11, -4, 6, 4, '#181c15'); // Boot left
    drawPixelRect(ctx, 4, -4, 6, 4, '#181c15');  // Boot right
  } else if (state === 'running') {
    // Leg cycling frames
    if (legFrame === 0) {
      drawPixelRect(ctx, -8, -12, 5, 12, camoColorHex); // back leg forward-angled
      drawPixelRect(ctx, 3, -12, 5, 12, camoColorHex);  // front leg back-angled
      drawPixelRect(ctx, -9, 0, 5, 4, '#181c15');   // Boot 1
      drawPixelRect(ctx, 4, 0, 5, 4, '#181c15');    // Boot 2
    } else if (legFrame === 1) {
      drawPixelRect(ctx, -6, -12, 5, 12, camoColorHex);
      drawPixelRect(ctx, 0, -12, 5, 12, camoColorHex);
      drawPixelRect(ctx, -6, 0, 5, 4, '#181c15');
      drawPixelRect(ctx, 0, 0, 5, 4, '#181c15');
    } else if (legFrame === 2) {
      drawPixelRect(ctx, 2, -12, 5, 12, camoColorHex);
      drawPixelRect(ctx, -8, -12, 5, 12, camoColorHex);
      drawPixelRect(ctx, 2, 0, 5, 4, '#181c15');
      drawPixelRect(ctx, -8, 0, 5, 4, '#181c15');
    } else {
      drawPixelRect(ctx, -3, -12, 4, 12, camoColorHex);
      drawPixelRect(ctx, -2, -12, 4, 12, camoColorHex);
      drawPixelRect(ctx, -3, 0, 4, 4, '#181c15');
      drawPixelRect(ctx, -2, 0, 4, 4, '#181c15');
    }
  } else {
    // IDLE
    drawPixelRect(ctx, -7, -12, 5, 12, camoColorHex); // Leg 1
    drawPixelRect(ctx, 2, -12, 5, 12, camoColorHex);  // Leg 2
    drawPixelRect(ctx, -8, 0, 6, 4, '#181c15');    // Boot 1
    drawPixelRect(ctx, 1, 0, 6, 4, '#181c15');     // Boot 2
  }

  // 2. TORSO / BODY
  const torsoY = (state === 'crouching' || state === 'sliding') ? -24 : (-32 + bobY);
  const torsoH = (state === 'crouching' || state === 'sliding') ? 14 : 20;

  // Cream/tan chest muscles & custom themed vest straps
  drawPixelRect(ctx, -8, torsoY, 15, torsoH, '#edd1b1'); // Muscle skin background
  // Tactical vest harness straps
  drawPixelRect(ctx, -6, torsoY, 3, torsoH, harnessColorHex);
  drawPixelRect(ctx, 3, torsoY, 3, torsoH, harnessColorHex);
  // Metallic belt buckle
  drawPixelRect(ctx, -4, torsoY + torsoH - 3, 7, 3, '#abbaba');

  // 3. HEAD
  const headY = torsoY - 14;
  // Face skin
  drawPixelRect(ctx, -5, headY, 10, 11, '#edd1b1');
  
  // Dynamic Red bandana (Bandana wrap)
  drawPixelRect(ctx, -6, headY + 1, 12, 3, '#e62424');
  
  // Waving bandana tail in wind
  const tailWave1 = Math.sin(frame * 0.2) * 4;
  const tailWave2 = Math.cos(frame * 0.18) * 3;
  drawPixelRect(ctx, -12, headY + 1 + Math.floor(tailWave1), 6, 2, '#d11b1b');
  drawPixelRect(ctx, -15, headY + 2 + Math.floor(tailWave2), 4, 2, '#9e1111');

  // Black hair spikes popping out on top
  drawPixelRect(ctx, -5, headY - 2, 10, 2, '#1a1103');
  drawPixelRect(ctx, -3, headY - 4, 6, 2, '#1a1103');
  // Sunglasses/eyes
  drawPixelRect(ctx, 1, headY + 4, 4, 2, '#1c1c1c');

  // 4. ARMS & WEAPON (Rotated relative to player aim angle)
  ctx.save();
  // Pivot point for shoulder arm rotation
  const shoulderX = 0;
  const shoulderY = torsoY + 6;
  ctx.translate(shoulderX, shoulderY);

  // Account for parent flip in rotation calculation
  const aimAngleRad = flip ? -weaponAngle : weaponAngle;
  ctx.rotate(aimAngleRad);

  // Draw muscles arm holding weapon
  drawPixelRect(ctx, 0, -3, 8, 5, '#edd1b1'); // Shoulder/bicep
  drawPixelRect(ctx, 6, -2, 6, 4, '#edd1b1'); // Forearm

  // RED WRISTBAND
  drawPixelRect(ctx, 9, -2, 2, 4, '#e62424');

  // Weapons pixel rendering
  if (activeWeapon === 'PISTOL') {
    // Classic heavy Colt 1911 dark grey automatic pistol
    drawPixelRect(ctx, 11, -4, 7, 3, '#4d5059'); // Slide
    drawPixelRect(ctx, 11, -1, 2, 4, '#303238'); // Grip
  } else if (activeWeapon === 'SMG') {
    // Metal Slug Heavy machine gun profile
    drawPixelRect(ctx, 10, -5, 14, 4, '#5d6473'); // Receiver & Barrel
    drawPixelRect(ctx, 13, -1, 3, 5, '#9e6231');  // Wood style stock/grip
    drawPixelRect(ctx, 19, -1, 2, 6, '#303038');  // Ammo clip banana magazine CURVED!
    drawPixelRect(ctx, 24, -3, 2, 1, '#ffce47');  // Brass barrel nozzle
  } else if (activeWeapon === 'GRENADE') {
    // Pineapple style grenade in hand, ready to lob!
    drawPixelRect(ctx, 9, -4, 5, 6, '#283319');
    drawPixelRect(ctx, 11, -6, 2, 2, '#cfb53c'); // Brass fuse cap
  } else if (activeWeapon === 'KNIFE') {
    // Shining silver bayonet blade
    drawPixelRect(ctx, 11, -1, 3, 2, '#333333');  // Grip
    drawPixelRect(ctx, 14, -2, 8, 3, '#e3eef5');  // Shining silver steel
    drawPixelRect(ctx, 16, -1, 6, 1, '#ffffff');  // Blade highlight
  }

  ctx.restore();
  ctx.restore();
}

// 4. Draw Mafia Patrol Enemy
export function drawMafiaEnemy(
  ctx: CanvasRenderingContext2D,
  ex: number,
  ey: number,
  dir: 1 | -1,
  state: 'idle' | 'patrolling' | 'shooting' | 'dead',
  frame: number,
  type: 'patrol' | 'sniper' | 'heavy'
) {
  ctx.save();
  ctx.translate(ex, ey);

  // Flipped?
  const flip = dir === -1;
  ctx.scale(flip ? -1 : 1, 1);

  if (state === 'dead') {
    // Laying flat on floor, dropped hat
    ctx.rotate(-Math.PI / 2);
    // Draw simplified flattened shape
    drawPixelRect(ctx, -12, -4, 25, 8, '#1e1a24'); // Suit
    drawPixelRect(ctx, -5, -6, 8, 4, '#d8baa1');  // Face
    ctx.restore();
    return;
  }

  // Bobbing animation
  let bobY = Math.sin(frame * 0.15) * 1.5;
  let runCycle = Math.floor(frame / 6) % 4;

  // Legs
  ctx.fillStyle = '#18161f'; // Black suit pants
  if (state === 'patrolling') {
    if (runCycle === 0) {
      drawPixelRect(ctx, -6, -12, 4, 12, '#18161f');
      drawPixelRect(ctx, 2, -12, 4, 12, '#282433');
    } else if (runCycle === 1) {
      drawPixelRect(ctx, -3, -12, 4, 12, '#18161f');
      drawPixelRect(ctx, -1, -12, 4, 12, '#282433');
    } else if (runCycle === 2) {
      drawPixelRect(ctx, 1, -12, 4, 12, '#18161f');
      drawPixelRect(ctx, -5, -12, 4, 12, '#282433');
    } else {
      drawPixelRect(ctx, -2, -12, 3, 11, '#18161f');
    }
    // Black shoes
    drawPixelRect(ctx, -7, 0, 5, 3, '#0c0b0f');
    drawPixelRect(ctx, 1, 0, 5, 3, '#0c0b0f');
  } else {
    // IDLE/SHOOTING standing still
    drawPixelRect(ctx, -5, -12, 4, 12, '#18161f');
    drawPixelRect(ctx, 1, -12, 4, 12, '#282433');
    drawPixelRect(ctx, -6, 0, 5, 3, '#0c0b0f');
    drawPixelRect(ctx, 1, 0, 5, 3, '#0c0b0f');
  }

  // Torso / Suit Jacket
  const coatColor = type === 'heavy' ? '#3d251d' : (type === 'sniper' ? '#213328' : '#23222e');
  drawPixelRect(ctx, -8, -30 + bobY, 15, 18, coatColor);
  // Red tie popping from collar
  drawPixelRect(ctx, -1, -28 + bobY, 2, 8, '#d62020');
  // White undershirt slice
  drawPixelRect(ctx, -2, -30 + bobY, 4, 3, '#ffffff');

  // Head & Fedora Hat
  const headY = -41 + bobY;
  // Face
  drawPixelRect(ctx, -4, headY, 8, 11, '#edd1b1');
  // Dark shades
  drawPixelRect(ctx, 1, headY + 3, 3, 2, '#111014');
  
  // Fedora hat (16-bit mafia!)
  const hatColor = coatColor;
  drawPixelRect(ctx, -7, headY - 1, 14, 2, hatColor);      // Brim
  drawPixelRect(ctx, -5, headY - 5, 10, 4, hatColor);      // Crown
  drawPixelRect(ctx, -5, headY - 2, 10, 1, '#111115');     // Hat band

  // Gun Arm shooting forward
  ctx.save();
  ctx.translate(2, -22 + bobY);
  if (state === 'shooting') {
    // Arm extended forward rigidly
    drawPixelRect(ctx, 0, -3, 11, 5, coatColor);             // Sleeve
    drawPixelRect(ctx, 10, -2, 3, 3, '#edd1b1');             // Hand
    
    // Weapon
    if (type === 'sniper') {
      // Long Rifle with green scope
      drawPixelRect(ctx, 12, -4, 16, 3, '#4f4f4f');          // Wood/barrel rifle
      drawPixelRect(ctx, 14, -6, 5, 2, '#2bc93e');           // Green laser scope
    } else {
      // Handgun/Tommy-Style SMG
      drawPixelRect(ctx, 12, -4, 7, 3, '#333');              // Handgun
    }
  } else {
    // Normal patrolling: arm swaying in sequence
    ctx.rotate(Math.sin(frame * 0.1) * 0.4);
    drawPixelRect(ctx, -2, 0, 5, 12, coatColor);
    drawPixelRect(ctx, -1, 10, 4, 3, '#edd1b1');
  }
  ctx.restore();

  ctx.restore();
}

// 5. Draw THE KINGPIN Black SUV Boss
export function drawKingpinSUV(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  hp: number,
  maxHp: number,
  frame: number,
  flashCooldown: number
) {
  // Size: Width: 180, Height: 90
  const width = 180;
  const height = 90;

  ctx.save();
  ctx.translate(bx, by);

  // Boss white damaged flash styling
  const isFlashing = flashCooldown > 0 && Math.floor(flashCooldown / 3) % 2 === 0;

  // Wheel animation frames
  const wheelRotate = (frame * 0.15) % (Math.PI * 2);

  // Bottom tires shadow (dark blend)
  drawPixelRect(ctx, -10, height - 8, width + 10, 6, 'rgba(0, 0, 0, 0.4)');

  // Bulletproof dark metallic paint gradient
  const carColor = isFlashing ? '#ffffff' : '#212229';
  const highlightColor = isFlashing ? '#e0e0e0' : '#31343d';
  const darkMetalColor = isFlashing ? '#cccccc' : '#14151a';

  // 1. MAIN UPPER BODY CABIN (Toyota Land Cruiser 4x4 rugged outline)
  drawPixelRect(ctx, 20, 10, 115, 35, carColor, darkMetalColor);              // Main cabin glass outline
  drawPixelRect(ctx, 2, 40, width - 4, 38, carColor, darkMetalColor);         // Lower thick chunk body
  drawPixelRect(ctx, 130, 42, 45, 36, carColor, darkMetalColor);             // Front sloping hood/bonnet

  // 2. HIGHLIGHT ROOF RAILS / ACCENTS
  drawPixelRect(ctx, 30, 7, 90, 3, '#4d505c');                               // Roof rail
  drawPixelRect(ctx, 5, 45, width - 10, 4, highlightColor);                  // Side belt trim

  // 3. DARK TINTED GLASS WINDOWS
  drawPixelRect(ctx, 35, 15, 32, 20, '#091524');                             // Rear side window
  drawPixelRect(ctx, 72, 15, 35, 20, '#091524');                             // Driver seat door window
  drawPixelRect(ctx, 112, 15, 18, 20, '#0f0f0f');                            // Windshield trim angled

  // Front glass shine diagonal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(40, 15, 6, 20);
  ctx.fillRect(78, 15, 8, 20);

  // 4. FRONT CHROME GRILLE & LIGHTS
  // Glowing headlights (bright golden yellow)
  ctx.shadowColor = '#ffe359';
  ctx.shadowBlur = (frame % 30 < 15) ? 25 : 12;
  drawPixelRect(ctx, width - 5, 48, 5, 10, '#fff49e');                       // Headlight
  
  // Right side light beam effect dynamically drawn
  const beamOpacity = 0.1 + Math.sin(frame * 0.2) * 0.05;
  ctx.fillStyle = `rgba(255, 230, 120, ${beamOpacity})`;
  ctx.beginPath();
  ctx.lineTo(width, 50);
  ctx.lineTo(width + 250, 15);
  ctx.lineTo(width + 250, 95);
  ctx.lineTo(width, 57);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0; // reset glow

  // Toyoda/Tehran license plate
  drawPixelRect(ctx, width - 30, 68, 22, 8, '#ffffff', '#111');
  ctx.fillStyle = '#0164c4'; // Blue IR slice
  ctx.fillRect(width - 29, 69, 3, 6);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 5px "Inter"';
  ctx.textAlign = 'center';
  ctx.fillText('TEH-313', width - 18, 74);

  // Front massive heavy steel bumper bar (fights barricades!)
  drawPixelRect(ctx, width - 8, 58, 8, 24, '#5d606b', '#222');               // Heavy steel bull bar

  // 5. THE BOSS POPPING OUT (The Kingpin Mafia boss himself!)
  // Sits inside the driver/passenger open window frame
  const bossPulse = Math.sin(frame * 0.1) * 2;
  const bossX = 80;
  const bossY = 16 + Math.floor(bossPulse);
  
  // Suit shoulder
  drawPixelRect(ctx, bossX, bossY + 10, 18, 10, '#100e17');
  // Red tie
  drawPixelRect(ctx, bossX + 8, bossY + 12, 2, 6, '#e03636');
  // Head
  drawPixelRect(ctx, bossX + 4, bossY, 10, 11, '#edd1b1');
  // Dark shades
  drawPixelRect(ctx, bossX + 6, bossY + 3, 5, 2, '#000000');
  // Sleek black hair
  drawPixelRect(ctx, bossX + 3, bossY - 3, 12, 3, '#221c11');
  // Armed golden pistol hand
  drawPixelRect(ctx, bossX - 10, bossY + 7, 10, 4, '#edd1b1');
  drawPixelRect(ctx, bossX - 14, bossY + 5, 6, 3, '#e6be12');                 // Gold pistol slide

  // 6. TWO ROOFTOP MOUNTED ROTATING MACHINE GUNS
  // Gun 1: Back roof (x: 45)
  // Gun 2: Front roof (x: 105)
  for (let t = 0; t < 2; t++) {
    const gx = t === 0 ? 45 : 105;
    const gy = 4;
    
    // Stand mount
    drawPixelRect(ctx, gx - 4, gy, 8, 6, '#3c3e47', '#111');
    
    // Gun body rotated to follow player
    // Track target: compute automatic angle pointing down left-ish
    const aimAngle = Math.PI + 0.25 + Math.sin(frame * 0.05 + t) * 0.15;
    
    ctx.save();
    ctx.translate(gx, gy + 1);
    ctx.rotate(aimAngle);
    
    // Gun receiver box
    drawPixelRect(ctx, -12, -4, 20, 7, '#24252b', '#000');
    // Heavy dual barrel barrels
    drawPixelRect(ctx, 8, -3, 16, 2, '#707482');
    drawPixelRect(ctx, 8, 0, 16, 2, '#50535e');
    // Muzzle flash when firing (pulsing yellow circles)
    if (Math.floor(frame / 4) % 3 === 0) {
      ctx.fillStyle = '#ffb31a';
      ctx.beginPath();
      ctx.arc(28, -1, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. MASSIVE ALL-TERRAIN RUBBER WHEELS (with steel chrome rims)
  // Wheel 1: x: 38, Wheel 2: x: 132
  const wheels = [38, 132];
  for (let wIdx = 0; wIdx < wheels.length; wIdx++) {
    const wx = wheels[wIdx];
    const wy = height - 12;

    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(wheelRotate);

    // Outer thick rubber tire
    ctx.fillStyle = '#1c1c21';
    ctx.strokeStyle = '#0e0e12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Steel silver rims inside
    ctx.fillStyle = '#7a7e8a';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Rim spokes to show spinning movement
    ctx.strokeStyle = '#2d2e33';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.moveTo(0, -8); ctx.lineTo(0, 8);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

// 6. Draw Street Props: Destructible Crate
export function drawDestructibleCrate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  hp: number,
  maxHp: number
) {
  // Wood color base
  const ratio = hp / maxHp;
  const woodBase = ratio < 0.4 ? '#4a3321' : (ratio < 0.7 ? '#694c35' : '#8f684a');
  const frameColor = ratio < 0.4 ? '#2b1c11' : '#5c3d25';
  
  // Main crate body
  drawPixelRect(ctx, cx, cy, cw, ch, woodBase, frameColor);
  
  // Diagonal reinforcement slats
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy + 3);
  ctx.lineTo(cx + cw - 3, cy + ch - 3);
  ctx.moveTo(cx + cw - 3, cy + 3);
  ctx.lineTo(cx + 3, cy + ch - 3);
  ctx.stroke();

  // Rusting corner metallic brackets
  drawPixelRect(ctx, cx, cy, 5, 5, '#44444a');
  drawPixelRect(ctx, cx + cw - 5, cy, 5, 5, '#44444a');
  drawPixelRect(ctx, cx, cy + ch - 5, 5, 5, '#44444a');
  drawPixelRect(ctx, cx + cw - 5, cy + ch - 5, 5, 5, '#44444a');

  // Wood slitting lines
  ctx.fillStyle = frameColor;
  ctx.fillRect(cx, cy + ch / 2 - 1, cw, 2);

  // Crack lines if damaged
  if (ratio < 0.75) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + cw * 0.2, cy + 2);
    ctx.lineTo(cx + cw * 0.35, cy + ch * 0.4);
    ctx.lineTo(cx + cw * 0.15, cy + ch * 0.75);
    ctx.stroke();
  }
}

// 7. Draw Fuel Barrel (Explodes in chain reaction!)
export function drawFuelBarrel(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  frame: number
) {
  // Orange warning red cylinder barrel
  drawPixelRect(ctx, bx, by, bw, bh, '#c73a24', '#47150d');
  
  // Highlight stripe and ridges
  drawPixelRect(ctx, bx + 1, by + 4, bw - 2, 3, '#db5642');
  drawPixelRect(ctx, bx + 1, by + bh - 7, bw - 2, 3, '#db5642');

  // Black skull warning label panel
  drawPixelRect(ctx, bx + 4, by + 10, bw - 8, 12, '#1a1103');
  
  // Dynamic warning label written in glowing Persian
  ctx.fillStyle = Math.floor(frame / 12) % 2 === 0 ? '#ffda45' : '#ffffff';
  ctx.font = 'bold 7px "Inter"';
  ctx.textAlign = 'center';
  ctx.fillText('خطر', bx + bw / 2, by + 19);
}

// 8. Draw Weapons Pickup Crates or Item drops
export function drawItemPickup(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  type: 'HEART' | 'SMG_AMMO' | 'GRENADE_PACK',
  bob: number
) {
  const yOffset = py + Math.sin(bob * 0.15) * 4;
  const size = 18;

  // Outer bubble glowing halo
  const haloColor = type === 'HEART' ? 'rgba(239, 68, 68, 0.25)' : (type === 'GRENADE_PACK' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(234, 179, 8, 0.25)');
  ctx.fillStyle = haloColor;
  ctx.beginPath();
  ctx.arc(px + size / 2, yOffset + size / 2, size * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Draw military steel case
  const borderColor = type === 'HEART' ? '#ef4444' : (type === 'GRENADE_PACK' ? '#22c55e' : '#eab308');
  drawPixelRect(ctx, px, yOffset, size, size, '#1e293b', borderColor);

  // Icon symbol inside case
  if (type === 'HEART') {
    // 16-bit Heart pixel art
    ctx.fillStyle = '#ef4444';
    // Draw simple heart
    ctx.fillRect(px + 4, yOffset + 6, 4, 3);
    ctx.fillRect(px + 10, yOffset + 6, 4, 3);
    ctx.fillRect(px + 5, yOffset + 9, 8, 3);
    ctx.fillRect(px + 7, yOffset + 12, 4, 3);
  } else if (type === 'SMG_AMMO') {
    // Ammo bullet card
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px + 6, yOffset + 4, 2, 10);
    ctx.fillRect(px + 10, yOffset + 4, 2, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.fillText('H', px + size / 2 - 4, yOffset + size / 2 + 3);
  } else if (type === 'GRENADE_PACK') {
    // Green classic grenade logo
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(px + 6, yOffset + 6, 6, 8);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px + 8, yOffset + 4, 2, 2);
  }
}
