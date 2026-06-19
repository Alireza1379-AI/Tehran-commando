import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  HelpCircle, 
  ShieldAlert, 
  Activity, 
  Award, 
  Gamepad2, 
  Flame, 
  Clock, 
  Target, 
  UserCheck 
} from 'lucide-react';
import { sounds } from './audio';
import { 
  WeaponType, 
  Weapon, 
  GameStats, 
  HighScore, 
  Particle, 
  Bullet, 
  Grenade, 
  Pickup, 
  DestructibleCrate 
} from './types';
import { 
  drawParallaxBackground, 
  drawPersianNeons, 
  drawCommandoPlayer, 
  drawMafiaEnemy, 
  drawKingpinSUV, 
  drawDestructibleCrate, 
  drawFuelBarrel, 
  drawItemPickup 
} from './canvasDrawers';

// Initial Weapons configuration
const INITIAL_WEAPONS: Weapon[] = [
  { type: 'PISTOL', name: 'Colt 1911 Pistol', ammo: -1, maxAmmo: -1, fireRate: 350, damage: 15 },
  { type: 'SMG', name: 'Heavy SMG', ammo: 120, maxAmmo: 250, fireRate: 100, damage: 20 },
  { type: 'GRENADE', name: 'M67 Grenade', ammo: 3, maxAmmo: 9, fireRate: 800, damage: 80 },
  { type: 'KNIFE', name: 'Combat Knife', ammo: -1, maxAmmo: -1, fireRate: 400, damage: 45 }
];

export default function App() {
  // Game States
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [muted, setMuted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('PISTOL');
  const [weapons, setWeapons] = useState<Weapon[]>(INITIAL_WEAPONS);
  const [camoColor, setCamoColor] = useState<'GREEN' | 'BLUE' | 'RED' | 'GOLD'>('GREEN');
  const [health, setHealth] = useState<number>(3); // 3 hearts max
  const maxHealth = 3;
  
  // Custom username for highscores
  const [playerName, setPlayerName] = useState<string>('Takaver_313');

  // Interactive controls helper panels
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  
  // Ref states for real-time physics and game items (avoids React re-render lag at 60fps)
  const gameEngineRef = useRef({
    player: {
      x: 100,
      y: 350,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      groundY: 350,
      dir: 1 as 1 | -1,
      isGrounded: true,
      lastShotTime: 0,
      isCrouching: false,
      isSliding: false,
      slideTime: 0,
      camoColor: 'GREEN' as 'GREEN' | 'BLUE' | 'RED' | 'GOLD',
      aimUp: false,
      damageCooldown: 0,
      isKnifing: false,
      knifeCooldown: 0
    },
    cameraX: 0,
    distanceScrolled: 0,
    levelLength: 2800, // Distance to boss fight
    bossSpawned: false,
    bossReady: false,
    bossHp: 800,
    bossMaxHp: 800,
    bossX: 3000,
    bossY: 260,
    bossSpeed: 1.5,
    bossTimer: 0,
    bossMuzzleCooldown: 0,
    bullets: [] as Bullet[],
    grenades: [] as Grenade[],
    particles: [] as Particle[],
    crates: [] as DestructibleCrate[],
    barrels: [] as { id: string; x: number; y: number; width: number; height: number; exploded: boolean }[],
    enemies: [] as any[],
    pickups: [] as Pickup[],
    isAimingUp: false,
    isAimingDown: false,
    keys: {} as Record<string, boolean>,
    frame: 0,
    score: 0,
    stats: {
      kills: 0,
      knifeKills: 0,
      grenadesThrown: 0,
      damageTaken: 0,
      shotsFired: 0,
      shotsHit: 0,
      startTime: 0,
      timeElapsed: 0
    }
  });

  // Load High Scores
  useEffect(() => {
    const stored = localStorage.getItem('tehran_rungun_highscores');
    if (stored) {
      try {
        setHighScores(JSON.parse(stored));
      } catch (e) {
        generateDefaultHighScores();
      }
    } else {
      generateDefaultHighScores();
    }
  }, []);

  const generateDefaultHighScores = () => {
    const defaults: HighScore[] = [
      { name: 'Rostam_Retro', score: 125000, date: '2026-06-15', rank: 'S-Rank: Lion of Tehran' },
      { name: 'Nader_Shah', score: 98000, date: '2026-05-10', rank: 'A-Rank: Elite Commando' },
      { name: 'Arya_313', score: 45000, date: '2026-06-01', rank: 'B-Rank: Desert Fox' },
      { name: 'Hotel_Naderi', score: 20000, date: '2026-06-18', rank: 'C-Rank: Soldier' }
    ];
    localStorage.setItem('tehran_rungun_highscores', JSON.stringify(defaults));
    setHighScores(defaults);
  };

  // Toggle Mute
  const handleToggleMuted = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    sounds.setMuted(nextMute);
  };

  // Reset Game fully
  const handleResetScores = () => {
    localStorage.removeItem('tehran_rungun_highscores');
    generateDefaultHighScores();
  };

  // Setup level elements (Obstacles, Crates, Enemies)
  const setupLevel = () => {
    const engine = gameEngineRef.current;
    
    // Clear containers
    engine.bullets = [];
    engine.grenades = [];
    engine.particles = [];
    engine.pickups = [];
    engine.bossSpawned = false;
    engine.bossReady = false;
    engine.bossHp = 800;
    engine.bossX = 3000;
    engine.keys = {};
    engine.frame = 0;
    engine.cameraX = 0;
    engine.distanceScrolled = 0;
    engine.score = 0;
    setScore(0);
    
    engine.player.x = 100;
    engine.player.y = 350;
    engine.player.vx = 0;
    engine.player.vy = 0;
    engine.player.isGrounded = true;
    engine.player.damageCooldown = 0;
    engine.player.isSliding = false;
    engine.player.slideTime = 0;
    engine.player.camoColor = camoColor;

    // Reset statistics
    engine.stats = {
      kills: 0,
      knifeKills: 0,
      grenadesThrown: 0,
      damageTaken: 0,
      shotsFired: 0,
      shotsHit: 0,
      startTime: Date.now(),
      timeElapsed: 0
    };

    // Generate Wooden Crates (Placed beautifully throughout Tehran streets)
    const crates: DestructibleCrate[] = [];
    const crateSpots = [280, 420, 680, 720, 950, 1100, 1350, 1400, 1720, 1900, 2200, 2450];
    crateSpots.forEach((cx, idx) => {
      crates.push({
        id: `crate_${idx}_${cx}`,
        x: cx,
        y: 354, // Rest on concrete road
        width: 32,
        height: 32,
        hp: 30,
        maxHp: 30
      });
      // Stack some crates
      if (idx % 3 === 0) {
        crates.push({
          id: `crate_stack_${idx}_${cx}`,
          x: cx + 4,
          y: 354 - 32,
          width: 32,
          height: 32,
          hp: 30,
          maxHp: 30
        });
      }
    });
    engine.crates = crates;

    // Generate Exploding fuel/petrol barrels
    engine.barrels = [
      { id: 'b_1', x: 550, y: 350, width: 24, height: 36, exploded: false },
      { id: 'b_2', x: 1250, y: 350, width: 24, height: 36, exploded: false },
      { id: 'b_3', x: 2050, y: 350, width: 24, height: 36, exploded: false }
    ];

    // Generate Enemies (Mafia Agents in elegant dark suits)
    const enemies: any[] = [];
    const enemySpots = [
      { x: 380, type: 'patrol' },
      { x: 500, type: 'patrol' },
      { x: 750, type: 'sniper' },
      { x: 900, type: 'patrol' },
      { x: 1150, type: 'heavy' },
      { x: 1450, type: 'patrol' },
      { x: 1600, type: 'sniper' },
      { x: 1800, type: 'heavy' },
      { x: 2100, type: 'patrol' },
      { x: 2300, type: 'heavy' },
      { x: 2500, type: 'sniper' }
    ];

    enemySpots.forEach((item, idx) => {
      enemies.push({
        id: `enemy_${idx}`,
        x: item.x,
        y: 350,
        width: 30,
        height: 48,
        vx: item.type === 'patrol' ? -1 - Math.random() : 0,
        type: item.type,
        hp: item.type === 'heavy' ? 80 : (item.type === 'sniper' ? 40 : 35),
        maxHp: item.type === 'heavy' ? 80 : (item.type === 'sniper' ? 40 : 35),
        state: 'patrolling',
        dir: -1 as 1 | -1,
        patrolRangeMin: item.x - 120,
        patrolRangeMax: item.x + 120,
        shootCooldown: 60 + Math.random() * 80,
        lastShootFrame: 0,
        scoreValue: item.type === 'heavy' ? 500 : (item.type === 'sniper' ? 300 : 200)
      });
    });
    engine.enemies = enemies;

    // Reset hearts & ammos
    setHealth(3);
    setWeapons([
      { type: 'PISTOL', name: 'Colt 1911 Pistol', ammo: -1, maxAmmo: -1, fireRate: 350, damage: 15 },
      { type: 'SMG', name: 'Heavy SMG', ammo: 120, maxAmmo: 250, fireRate: 100, damage: 20 },
      { type: 'GRENADE', name: 'M67 Grenade', ammo: 3, maxAmmo: 9, fireRate: 800, damage: 80 },
      { type: 'KNIFE', name: 'Combat Knife', ammo: -1, maxAmmo: -1, fireRate: 400, damage: 45 }
    ]);
    setActiveWeapon('PISTOL');
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Arrow mapping to WSAD for responsive accessibility
      let keyMapped = k;
      if (e.key === 'ArrowUp') keyMapped = 'w';
      if (e.key === 'ArrowDown') keyMapped = 's';
      if (e.key === 'ArrowLeft') keyMapped = 'a';
      if (e.key === 'ArrowRight') keyMapped = 'd';

      gameEngineRef.current.keys[keyMapped] = true;

      // Toggle Pause with 'P' or 'Escape' key
      if (k === 'p' || e.key === 'Escape' || e.key === 'Esc') {
        setGameState((curr) => {
          if (curr === 'PLAYING') {
            sounds.stopBGM();
            sounds.playSwitchWeapon();
            return 'PAUSED';
          } else if (curr === 'PAUSED') {
            sounds.init();
            sounds.startBGM();
            sounds.playSwitchWeapon();
            return 'PLAYING';
          }
          return curr;
        });
      }

      // Handle direct key triggers for Weapon index switching
      if (k === '1') handleSelectWeapon('PISTOL');
      if (k === '2') handleSelectWeapon('SMG');
      if (k === '3') handleSelectWeapon('GRENADE');
      if (k === '4') handleSelectWeapon('KNIFE');
      if (k === 'i') {
        // Toggle Switch weapons
        sounds.playSwitchWeapon();
        setActiveWeapon((curr) => {
          if (curr === 'PISTOL') return 'SMG';
          if (curr === 'SMG') return 'GRENADE';
          if (curr === 'GRENADE') return 'KNIFE';
          return 'PISTOL';
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      let keyMapped = k;
      if (e.key === 'ArrowUp') keyMapped = 'w';
      if (e.key === 'ArrowDown') keyMapped = 's';
      if (e.key === 'ArrowLeft') keyMapped = 'a';
      if (e.key === 'ArrowRight') keyMapped = 'd';

      gameEngineRef.current.keys[keyMapped] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleSelectWeapon = (type: WeaponType) => {
    sounds.playSwitchWeapon();
    setActiveWeapon(type);
  };

  // Start story run and gun game
  const startGame = () => {
    sounds.init();
    sounds.setMuted(muted);
    setGameState('PLAYING');
    setupLevel();
    // Start background retro chiptune trace
    sounds.startBGM();
  };

  // Custom visual particles generator for bullets sparks, blood, and explosions
  const createExplosionParticles = (x: number, y: number, count = 25, isBig = false) => {
    const engine = gameEngineRef.current;
    
    // Add flashing neon embers
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isBig ? 8 : 4) + 1;
      const greySmoke = Math.random() > 0.4;
      
      let color = '#ff7b00'; // orange fire
      let type: 'ember' | 'smoke' = 'ember';
      
      if (greySmoke) {
        color = '#524e59'; // grey heavy smoke particle
        type = 'smoke';
      } else if (Math.random() > 0.5) {
        color = '#ffdd4d'; // bright fire flame
      }

      engine.particles.push({
        id: `part_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isBig ? 12 : 5) + 3,
        color,
        alpha: 1.0,
        fadeSpeed: Math.random() * 0.03 + 0.015,
        gravity: -0.05,
        type
      });
    }

    // Add bright orange shockwave expanding lines
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2;
      engine.particles.push({
        id: `shock_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        size: 3,
        color: '#ffdd7b',
        alpha: 0.9,
        fadeSpeed: 0.06,
        type: 'star'
      });
    }
  };

  const createDestructionSplinters = (x: number, y: number) => {
    const engine = gameEngineRef.current;
    for (let i = 0; i < 10; i++) {
      engine.particles.push({
        id: `splinter_${Date.now()}_${Math.random()}`,
        x,
        y: y - 10,
        vx: (Math.random() * 2 - 1) * 3,
        vy: -Math.random() * 4 - 2,
        size: Math.random() * 5 + 2,
        color: '#735237', // Brown splinter
        alpha: 1.0,
        fadeSpeed: 0.02,
        gravity: 0.15,
        type: 'debris'
      });
    }
  };

  const createBloodSplatter = (x: number, y: number) => {
    const engine = gameEngineRef.current;
    for (let i = 0; i < 8; i++) {
      engine.particles.push({
        id: `blood_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: (Math.random() * 2 - 1) * 3,
        vy: -Math.random() * 4 - 1,
        size: Math.random() * 4 + 2,
        color: '#ab0e0e', // Retro flat crimson red blood
        alpha: 1.0,
        fadeSpeed: 0.03,
        gravity: 0.18,
        type: 'blood'
      });
    }
  };

  const createBulletSpark = (x: number, y: number, dir = 1) => {
    const engine = gameEngineRef.current;
    for (let i = 0; i < 3; i++) {
      engine.particles.push({
        id: `spark_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: -dir * (Math.random() * 2 + 1),
        vy: (Math.random() * 2 - 1) * 2,
        size: 2,
        color: '#ffd045', // golden spark
        alpha: 1.0,
        fadeSpeed: 0.08,
        gravity: 0.08,
        type: 'neon'
      });
    }
  };

  // Trigger Melee Knife attack
  const triggerKnifeAttack = () => {
    const engine = gameEngineRef.current;
    if (engine.player.knifeCooldown > 0) return;

    engine.player.isKnifing = true;
    engine.player.knifeCooldown = 25; // frames of recovery
    sounds.playKnife();
    
    // Check melee reach box (AABB 60 pixels ahead of player direction)
    const reachX = engine.player.dir === 1 ? engine.player.x : (engine.player.x - 55);
    const reachY = engine.player.y - 40;
    const reachW = 55;
    const reachH = 35;

    // 1. Check crates
    engine.crates.forEach((crate) => {
      if (
        reachX < crate.x + crate.width &&
        reachX + reachW > crate.x &&
        reachY < crate.y + crate.height &&
        reachY + reachH > crate.y
      ) {
        crate.hp -= 30; // High knife melee damage!
        createDestructionSplinters(crate.x + 16, crate.y + 16);
        sounds.playCrateShatter();
      }
    });

    // 2. Check barrels
    engine.barrels.forEach((barrel) => {
      if (
        !barrel.exploded &&
        reachX < barrel.x + barrel.width &&
        reachX + reachW > barrel.x &&
        reachY < barrel.y + barrel.height &&
        reachY + reachH > barrel.y
      ) {
        // Ignites barrel directly!
        barrel.exploded = true;
        sounds.playExplosion();
        createExplosionParticles(barrel.x + 12, barrel.y + 14, 30, true);
        triggerBarrelExplosionDamage(barrel.x + 12, barrel.y + 14);
      }
    });

    // 3. Check Mafia Enemies
    engine.enemies.forEach((enemy) => {
      if (
        enemy.state !== 'dead' &&
        reachX < enemy.x + enemy.width &&
        reachX + reachW > enemy.x &&
        reachY < enemy.y + enemy.height &&
        reachY + reachH > enemy.y
      ) {
        enemy.hp -= 60; // Knife slash is extremely lethal
        createBloodSplatter(enemy.x + 15, enemy.y - 20);
        engine.stats.shotsHit++; // Count as hits

        // Floating combat numbers
        engine.particles.push({
          id: `slashtxt_${Date.now()}_${Math.random()}`,
          x: enemy.x,
          y: enemy.y - 50,
          vx: 0,
          vy: -1.2,
          size: 9,
          color: '#e2183c',
          alpha: 1.0,
          fadeSpeed: 0.02,
          type: 'star'
        });

        if (enemy.hp <= 0) {
          enemy.state = 'dead';
          engine.stats.kills++;
          engine.stats.knifeKills++;
          engine.score += enemy.scoreValue * 1.5; // knife bonus points!
          sounds.playHurt();
          spawnPickupFromEnemy(enemy.x, enemy.y);
        }
      }
    });

    // 4. Check Kingpin SUV Boss
    if (engine.bossSpawned && engine.bossReady) {
      const bossHitbox = { x: engine.bossX, y: engine.bossY, w: 180, h: 90 };
      if (
        reachX < bossHitbox.x + bossHitbox.w &&
        reachX + reachW > bossHitbox.x &&
        reachY < bossHitbox.y + bossHitbox.h &&
        reachY + reachH > bossHitbox.y
      ) {
        engine.bossHp -= 65; // High melee risk reward!
        sounds.playCrateShatter();
        createExplosionParticles(reachX + 25, reachY + 10, 5, false);
      }
    }
  };

  // Explode Barrels adjacent fire damage trigger
  const triggerBarrelExplosionDamage = (bx: number, by: number) => {
    const engine = gameEngineRef.current;
    const radius = 120;

    // Damage player if caught in radius
    const dxPlay = engine.player.x - bx;
    const dyPlay = (engine.player.y - 24) - by;
    const distPlay = Math.sqrt(dxPlay*dxPlay + dyPlay*dyPlay);
    if (distPlay < radius) {
      damagePlayer();
    }

    // Damage enemies
    engine.enemies.forEach((enemy) => {
      if (enemy.state !== 'dead') {
        const dxEn = enemy.x - bx;
        const dyEn = (enemy.y - 24) - by;
        const distEn = Math.sqrt(dxEn*dxEn + dyEn*dyEn);
        if (distEn < radius) {
          enemy.hp -= 100; // instant death for minor enemies
          createBloodSplatter(enemy.x + 15, enemy.y - 20);
          if (enemy.hp <= 0) {
            enemy.state = 'dead';
            engine.stats.kills++;
            engine.score += enemy.scoreValue;
            spawnPickupFromEnemy(enemy.x, enemy.y);
          }
        }
      }
    });

    // Cascade effect to other barrels!
    engine.barrels.forEach((barrel) => {
      if (!barrel.exploded) {
        const dxBar = (barrel.x + 12) - bx;
        const dyBar = (barrel.y + 18) - by;
        const distBar = Math.sqrt(dxBar*dxBar + dyBar*dyBar);
        if (distBar < radius) {
          // Chain explosion delayed slightly!
          setTimeout(() => {
            if (!barrel.exploded && gameState === 'PLAYING') {
              barrel.exploded = true;
              sounds.playExplosion();
              createExplosionParticles(barrel.x + 12, barrel.y + 14, 25, true);
              triggerBarrelExplosionDamage(barrel.x + 12, barrel.y + 14);
            }
          }, 300);
        }
      }
    });

    // Crack adjacent crates
    engine.crates.forEach((crate) => {
      const dxCr = (crate.x + 16) - bx;
      const dyCr = (crate.y + 16) - by;
      const distCr = Math.sqrt(dxCr*dxCr + dyCr*dyCr);
      if (distCr < radius) {
        crate.hp -= 60;
        createDestructionSplinters(crate.x + 16, crate.y + 16);
      }
    });
  };

  // Drop pickup item
  const spawnPickupFromEnemy = (ex: number, ey: number) => {
    const r = Math.random();
    const engine = gameEngineRef.current;
    
    // 35% chance to drop weapons or healing
    if (r < 0.35) {
      let type: 'HEART' | 'SMG_AMMO' | 'GRENADE_PACK' = 'SMG_AMMO';
      if (r < 0.10) {
        type = 'HEART';
      } else if (r < 0.22) {
        type = 'GRENADE_PACK';
      }

      engine.pickups.push({
        id: `pickup_${Date.now()}_${Math.random()}`,
        x: ex,
        y: ey - 20,
        width: 18,
        height: 18,
        type,
        vy: -3, // Pop upward effect
        groundY: 368,
        bob: Math.random() * 10
      });
    }
  };

  // Damage the commando hero
  const damagePlayer = () => {
    const engine = gameEngineRef.current;
    if (engine.player.damageCooldown > 0 || gameState !== 'PLAYING') return;

    engine.player.damageCooldown = 60; // 1 second of flashing immunity (60fps)
    sounds.playHurt();
    engine.stats.damageTaken++;

    // Subtract heart
    setHealth((prev) => {
      const nextH = prev - 1;
      if (nextH <= 0) {
        // Triggers gameover screen
        setGameState('GAMEOVER');
        sounds.stopBGM();
        sounds.playExplosion();
        // Save score
        saveHighScore(engine.score);
      }
      return nextH;
    });
  };

  const saveHighScore = (finalScore: number) => {
    const record: HighScore = {
      name: playerName.trim() || 'Hero_Of_Tehran',
      score: finalScore,
      date: new Date().toISOString().split('T')[0],
      rank: finalScore > 100000 ? 'S-Rank: Lion of Tehran' : (finalScore > 60000 ? 'A-Rank: Elite Commando' : 'B-Rank: Desert Fox')
    };

    const currentScores = [...highScores, record];
    // Sort descending
    currentScores.sort((a, b) => b.score - a.score);
    const top6 = currentScores.slice(0, 6);
    localStorage.setItem('tehran_rungun_highscores', JSON.stringify(top6));
    setHighScores(top6);
  };

  // Projectile shooting handler
  const fireActiveWeapon = () => {
    const engine = gameEngineRef.current;
    const now = Date.now();
    
    // Find active weapon settings
    const wConfigIndex = weapons.findIndex(w => w.type === activeWeapon);
    if (wConfigIndex === -1) return;
    const weapon = weapons[wConfigIndex];

    // Fire rate check
    if (now - engine.player.lastShotTime < weapon.fireRate) return;

    // Ammo capacity check
    if (weapon.ammo === 0) {
      sounds.playSwitchWeapon(); // empty click sound
      return;
    }

    engine.player.lastShotTime = now;

    // Deduct ammo if finite
    if (weapon.ammo > 0) {
      setWeapons((prev) => {
        const copy = [...prev];
        copy[wConfigIndex].ammo--;
        return copy;
      });
    }

    engine.stats.shotsFired++;

    if (activeWeapon === 'KNIFE') {
      sounds.playKnife(); // slash swoosh sound
      
      let bulletAngle = 0;
      if (engine.keys['w']) {
        bulletAngle = -Math.PI / 2; // Throw up
      } else if (engine.player.dir === -1) {
        bulletAngle = Math.PI; // Throw left
      } else {
        bulletAngle = 0; // Throw right
      }

      const launchX = engine.player.x + (engine.player.dir * 18);
      const launchY = engine.player.y - (engine.player.isCrouching ? 20 : 32);
      const speed = 13.5;

      engine.bullets.push({
        id: `knife_${Date.now()}_${Math.random()}`,
        x: launchX,
        y: launchY,
        vx: Math.cos(bulletAngle) * speed,
        vy: Math.sin(bulletAngle) * speed,
        owner: 'player',
        damage: weapon.damage,
        size: 5,
        color: '#e3eef5',
        isKnife: true,
        rotation: 0,
        angle: bulletAngle
      });
    } else if (activeWeapon === 'GRENADE') {
      engine.stats.grenadesThrown++;
      // Lob grenade with parabolic arc
      // Launch slightly above the shoulder
      const launchX = engine.player.x + (engine.player.dir * 12);
      const launchY = engine.player.y - 30;
      
      const vx = engine.player.dir * 7;
      const vy = -6; // high arc

      engine.grenades.push({
        id: `grenade_${Date.now()}`,
        x: launchX,
        y: launchY,
        vx,
        vy,
        rotation: 0,
        fuseTime: 90, // 1.5 seconds fuse
        damage: weapon.damage,
        radius: 120
      });

      sounds.playJump(); // lob swoop
    } else {
      // Regular Colt/SMG Bullet trails
      sounds.playShoot(activeWeapon === 'SMG');

      let bulletAngle = 0;
      if (engine.keys['w']) {
        bulletAngle = -Math.PI / 2; // Straight up
      } else if (engine.player.dir === -1) {
        bulletAngle = Math.PI; // Straight left
      } else {
        bulletAngle = 0; // Straight right
      }

      // Add slight recoil deviation variance for SMG
      if (activeWeapon === 'SMG') {
        bulletAngle += (Math.random() * 2 - 1) * 0.08;
      }

      const launchX = engine.player.x + (engine.player.dir * 22);
      const launchY = engine.player.y - (engine.player.isCrouching ? 22 : 36);

      const speed = 15;
      engine.bullets.push({
        id: `bullet_${Date.now()}_${Math.random()}`,
        x: launchX,
        y: launchY,
        vx: Math.cos(bulletAngle) * speed,
        vy: Math.sin(bulletAngle) * speed,
        owner: 'player',
        damage: weapon.damage,
        size: 3,
        color: activeWeapon === 'SMG' ? '#ffdf54' : '#ffffff',
        angle: bulletAngle
      });

      // Spawn bright shell ejecting particles bouncing backward
      engine.particles.push({
        id: `shell_${Date.now()}_${Math.random()}`,
        x: engine.player.x,
        y: launchY - 2,
        vx: -engine.player.dir * (Math.random() * 2 + 1),
        vy: -Math.random() * 3 - 2,
        size: 1.5,
        color: '#ffc107', // yellow shiny brass
        alpha: 1.0,
        fadeSpeed: 0.04,
        gravity: 0.18,
        type: 'neon'
      });
    }
  };

  // Interactive GameLoop loop logic
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      if (gameState !== 'PLAYING') {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      // 60FPS tick controls
      const engine = gameEngineRef.current;
      engine.frame++;

      // Automatically tick real timer clocks
      const elapsedSecs = Math.floor((Date.now() - engine.stats.startTime) / 1000);
      engine.stats.timeElapsed = elapsedSecs;

      // Handle custom resolution scaling
      const width = canvas.width;
      const height = canvas.height;
      const groundY = 380; // Ground platform height standard index

      // ----------------------------------------------------
      // A. PLAYER MOVEMENT & COLLISION
      // ----------------------------------------------------
      const playerSpeed = 3.5;
      
      // Determine if slide tackle starts: if moving left or right, grounded, and presses Down
      if (engine.keys['s'] && engine.player.isGrounded && !engine.player.isKnifing) {
        if (!engine.player.isSliding && !engine.player.isCrouching && (engine.keys['a'] || engine.keys['d'] || Math.abs(engine.player.vx) > 0.1)) {
          engine.player.isSliding = true;
          engine.player.slideTime = 22; // slide duration duration
          sounds.playSwitchWeapon(); // slide swoosh trigger sound
        }
      }

      // Handle slide countdown and movement speed
      if (engine.player.isSliding) {
        engine.player.slideTime--;
        engine.player.isCrouching = false; // prioritize sliding pose
        
        // High speed tackle velocity slide
        engine.player.vx = engine.player.dir * 6.8;

        // Spawn slide dust particles
        if (engine.frame % 3 === 0) {
          engine.particles.push({
            id: `slidedust_${Date.now()}_${Math.random()}`,
            x: engine.player.x - engine.player.dir * 12,
            y: engine.player.y,
            vx: -engine.player.dir * (Math.random() * 2 + 0.5),
            vy: -Math.random() * 1.5 - 0.5,
            size: Math.random() * 6 + 3,
            color: '#71717a',
            alpha: 0.7,
            fadeSpeed: 0.04,
            type: 'smoke'
          });
        }

        // Deal sliding tackle damage to close enemies
        engine.enemies.forEach((enemy) => {
          const dist = Math.abs(enemy.x - engine.player.x);
          if (dist < 32 && Math.abs(enemy.y - engine.player.y) < 24 && !enemy.dead) {
            enemy.hp -= 25; // slide tackle deals damage
            createBloodSplatter(enemy.x, enemy.y - 16);
          }
        });

        if (engine.player.slideTime <= 0 || !engine.keys['s']) {
          engine.player.isSliding = false;
        }
      } else {
        // Normal crouching block
        engine.player.isCrouching = engine.keys['s'] && engine.player.isGrounded;
      }

      if (!engine.player.isSliding && !engine.player.isCrouching && !engine.player.isKnifing) {
        if (engine.keys['a']) {
          engine.player.vx = -playerSpeed;
          engine.player.dir = -1;
        } else if (engine.keys['d']) {
          engine.player.vx = playerSpeed;
          engine.player.dir = 1;
        } else {
          engine.player.vx = 0;
        }
      } else if (!engine.player.isSliding) {
        // Cannot slide while executing knife/crouch
        engine.player.vx *= 0.8;
      }

      // Jump request
      if (engine.keys['l'] && engine.player.isGrounded && !engine.player.isKnifing) {
        engine.player.vy = -10.5; // Jump thrust
        engine.player.isGrounded = false;
        sounds.playJump();
      }

      // Apply Gravity
      if (!engine.player.isGrounded) {
        engine.player.vy += 0.45; // Gravity rate
      } else {
        engine.player.vy = 0;
      }

      // Knifing timing count
      if (engine.player.knifeCooldown > 0) {
        engine.player.knifeCooldown--;
        if (engine.player.knifeCooldown < 12) {
          engine.player.isKnifing = false;
        }
      }

      // Commit velocities
      engine.player.x += engine.player.vx;
      engine.player.y += engine.player.vy;

      // Bounds check on physical Tehran floor level
      if (engine.player.y >= groundY) {
        engine.player.y = groundY;
        engine.player.vy = 0;
        engine.player.isGrounded = true;
      }

      // Left boundary screen lock
      const screenLeftLimit = engine.cameraX;
      if (engine.player.x - 16 < screenLeftLimit) {
        engine.player.x = screenLeftLimit + 16;
      }

      // Right boundary screen scroll / Boss boundary lock
      const screenRightLimit = engine.cameraX + width;
      
      // Scroll core camera if player advances past center
      const scrollTriggerMargin = screenLeftLimit + width * 0.45;
      if (engine.player.x > scrollTriggerMargin && !engine.bossSpawned) {
        const delta = engine.player.x - scrollTriggerMargin;
        engine.cameraX += delta;
        engine.distanceScrolled = engine.cameraX;

        // Trigger boss fight at level end-line distance limit!
        if (engine.cameraX >= engine.levelLength) {
          engine.bossSpawned = true;
          sounds.playBossSiren();
          // Spawn boss vehicle SUV on the right screen border
          engine.bossX = engine.cameraX + width + 50;
          engine.bossY = groundY - 74; // SUV height rest
        }
      }

      // Locked camera to boss area once boss arrives
      if (engine.bossSpawned) {
        if (engine.player.x + 16 > screenRightLimit) {
          engine.player.x = screenRightLimit - 16;
        }
      }

      // Handle player damage cooldown immunity tick
      if (engine.player.damageCooldown > 0) {
        engine.player.damageCooldown--;
      }

      // Auto shooting keyboard hold loops
      if (engine.keys['k']) {
        if (activeWeapon === 'SMG' || activeWeapon === 'PISTOL') {
          // Both will keep shooting while key is hold down
          fireActiveWeapon();
        }
      }
      if (engine.keys['o']) {
        // Throw grenade key
        fireActiveWeapon();
      }

      // ----------------------------------------------------
      // B. ENEMY MAFIA AGENTS ACTIONS & LOGIC
      // ----------------------------------------------------
      engine.enemies.forEach((enemy) => {
        if (enemy.state === 'dead') return;

        // Simple turn/patrol AI
        if (enemy.type === 'patrol' || enemy.type === 'heavy') {
          enemy.x += enemy.vx;
          if (enemy.x <= enemy.patrolRangeMin) {
            enemy.vx = Math.abs(enemy.vx);
            enemy.dir = 1;
          } else if (enemy.x >= enemy.patrolRangeMax) {
            enemy.vx = -Math.abs(enemy.vx);
            enemy.dir = -1;
          }
        }

        // Periodic shoot at player if within visible range card
        const dx = engine.player.x - enemy.x;
        const dy = engine.player.y - enemy.y;
        const distancePlayer = Math.sqrt(dx*dx + dy*dy);

        if (distancePlayer < 350) {
          // face player
          enemy.dir = dx > 0 ? 1 : -1;
          enemy.state = 'shooting';

          enemy.shootCooldown--;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = enemy.type === 'sniper' ? 140 : (enemy.type === 'heavy' ? 45 : 70);
            
            // Fire bullet towards player
            const launchX = enemy.x + (enemy.dir * 18);
            const launchY = enemy.y - 24;
            
            // Compute angle towards player chest
            const targetAngle = Math.atan2((engine.player.y - 24) - launchY, engine.player.x - launchX);
            const speed = enemy.type === 'sniper' ? 12 : 7.5;
            
            engine.bullets.push({
              id: `en_bullet_${Date.now()}_${Math.random()}`,
              x: launchX,
              y: launchY,
              vx: Math.cos(targetAngle) * speed,
              vy: Math.sin(targetAngle) * speed,
              owner: 'enemy',
              damage: enemy.type === 'heavy' ? 25 : 15,
              size: 2.5,
              color: enemy.type === 'sniper' ? '#21e645' : '#ff5454'
            });

            sounds.playShoot(enemy.type === 'heavy');
          }
        } else {
          enemy.state = 'patrolling';
        }
      });

      // ----------------------------------------------------
      // C. THE KINGPIN BOSS TRUCK LOGIC
      // ----------------------------------------------------
      if (engine.bossSpawned) {
        engine.bossTimer++;
        const targetApproachX = engine.cameraX + width - 210;

        // Approach state
        if (engine.bossX > targetApproachX) {
          engine.bossX -= 2.0; // Drive onto screen
        } else {
          engine.bossReady = true;
          // Slowly sway back and forth relative to screen centers
          engine.bossX = targetApproachX + Math.sin(engine.bossTimer * 0.02) * 35;
        }

        // Active weapons attack schedule
        if (engine.bossReady && engine.bossHp > 0) {
          // 1) Roof Turrets machine fire
          engine.bossMuzzleCooldown--;
          if (engine.bossMuzzleCooldown <= 0) {
            engine.bossMuzzleCooldown = 15; // frequent bursts

            // Fire 2 bullet streams towards commando player
            const turretSpots = [engine.bossX + 45, engine.bossX + 105];
            const targetY = engine.player.y - 20;

            turretSpots.forEach((tx) => {
              const ty = engine.bossY + 5;
              const angle = Math.atan2(targetY - ty, engine.player.x - tx);
              
              engine.bullets.push({
                id: `boss_bullet_${Date.now()}_${Math.random()}`,
                x: tx,
                y: ty,
                vx: Math.cos(angle) * 7.5,
                vy: Math.sin(angle) * 7.5,
                owner: 'boss',
                damage: 20,
                size: 3,
                color: '#ff901a'
              });
            });

            sounds.playShoot(true);
          }

          // 2) Kingpin passenger guy random golden gun shots!
          if (engine.bossTimer % 90 === 0) {
            const bx = engine.bossX + 70;
            const by = engine.bossY + 22;
            const angle = Math.atan2((engine.player.y - 20) - by, engine.player.x - bx);
            
            engine.bullets.push({
              id: `boss_gold_${Date.now()}`,
              x: bx,
              y: by,
              vx: Math.cos(angle) * 9.0,
              vy: Math.sin(angle) * 9.0,
              owner: 'boss',
              damage: 30, // heavy damage
              size: 4,
              color: '#ffd700' // Golden shot!
            });
            sounds.playShoot(false);
          }

          // Exhaust dark smoke puff particles from SUV rear exhaust (x: 10)
          if (engine.frame % 6 === 0) {
            engine.particles.push({
              id: `smoke_${engine.frame}`,
              x: engine.bossX + 10,
              y: engine.bossY + 70,
              vx: -2 - Math.random() * 2,
              vy: -0.5 - Math.random() * 1.5,
              size: Math.random() * 8 + 4,
              color: engine.bossHp < 300 ? '#222222' : '#76737c',
              alpha: 0.8,
              fadeSpeed: 0.02,
              type: 'smoke'
            });
          }
        }
      }

      // ----------------------------------------------------
      // D. PROJECTILES UPDATES (Bullets, Grenades)
      // ----------------------------------------------------
      // Tick Bullets & platforms borders collision
      engine.bullets = engine.bullets.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        if (bullet.isKnife) {
          bullet.rotation = (bullet.rotation || 0) + 0.25;
        }

        // Check screen exits
        if (bullet.x < screenLeftLimit - 50 || bullet.x > screenRightLimit + 50) {
          return false;
        }
        if (bullet.y < 0 || bullet.y > groundY + 20) {
          return false;
        }

        // Player bullet hitting enemies or crates
        if (bullet.owner === 'player') {
          // Check wooden crates hits
          for (let c = 0; c < engine.crates.length; c++) {
            const crate = engine.crates[c];
            if (
              bullet.x > crate.x &&
              bullet.x < crate.x + crate.width &&
              bullet.y > crate.y &&
              bullet.y < crate.y + crate.height
            ) {
              crate.hp -= bullet.damage;
              createBulletSpark(bullet.x, bullet.y, engine.player.dir);
              engine.stats.shotsHit++;
              
              if (crate.hp <= 0) {
                // Break crate!
                sounds.playCrateShatter();
                createDestructionSplinters(crate.x + 16, crate.y + 16);
                
                // Spawn SMG weapon or health pickup with 50% probability
                if (Math.random() < 0.5) {
                  const pickType = Math.random() > 0.6 ? 'HEART' : 'SMG_AMMO';
                  engine.pickups.push({
                    id: `p_crate_${Date.now()}`,
                    x: crate.x + 6,
                    y: crate.y + 6,
                    width: 18,
                    height: 18,
                    type: pickType,
                    vy: -2.5,
                    groundY: 368,
                    bob: Math.random() * 8
                  });
                }
              }
              return false; // destroy bullet
            }
          }

          // Check burning barrel hits
          for (let b = 0; b < engine.barrels.length; b++) {
            const bArr = engine.barrels[b];
            if (
              !bArr.exploded &&
              bullet.x > bArr.x &&
              bullet.x < bArr.x + bArr.width &&
              bullet.y > bArr.y &&
              bullet.y < bArr.y + bArr.height
            ) {
              bArr.exploded = true;
              sounds.playExplosion();
              createExplosionParticles(bArr.x + 12, bArr.y + 14, 30, true);
              triggerBarrelExplosionDamage(bArr.x + 12, bArr.y + 14);
              return false;
            }
          }

          // Check enemies hits
          for (let e = 0; e < engine.enemies.length; e++) {
            const enemy = engine.enemies[e];
            if (enemy.state !== 'dead') {
              if (
                bullet.x > enemy.x &&
                bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y - enemy.height &&
                bullet.y < enemy.y
              ) {
                enemy.hp -= bullet.damage;
                createBulletSpark(bullet.x, bullet.y, engine.player.dir);
                createBloodSplatter(bullet.x, bullet.y);
                engine.stats.shotsHit++;

                if (enemy.hp <= 0) {
                  enemy.state = 'dead';
                  sounds.playHurt();
                  engine.stats.kills++;
                  engine.score += enemy.scoreValue;
                  setScore(engine.score);
                  spawnPickupFromEnemy(enemy.x, enemy.y);
                }
                return false; // destroy bullet
              }
            }
          }

          // Check Boss Land Cruiser SUV hit!
          if (engine.bossSpawned && engine.bossReady && engine.bossHp > 0) {
            if (
              bullet.x > engine.bossX &&
              bullet.x < engine.bossX + 180 &&
              bullet.y > engine.bossY &&
              bullet.y < engine.bossY + 90
            ) {
              engine.bossHp -= bullet.damage;
              createBulletSpark(bullet.x, bullet.y, -1);
              engine.stats.shotsHit++;

              if (engine.bossHp <= 0) {
                // VICTORY! Boss destroyed!
                sounds.playExplosion();
                createExplosionParticles(engine.bossX + 90, engine.implodedCenterY || engine.bossY + 45, 60, true);
                
                // Transition Victory
                setGameState('VICTORY');
                sounds.stopBGM();
                saveHighScore(engine.score + 10000); // Massive 10k points victory bonus!
              }
              return false; // destroy standard bullet
            }
          }

        } else if (bullet.owner === 'enemy' || bullet.owner === 'boss') {
          // Hits Commando Player?
          // Determine commando hit bounds
          const pLeft = engine.player.x - 16;
          const pRight = engine.player.x + 16;
          const pBottom = engine.player.y;
          const pTop = engine.player.y - (engine.player.isCrouching ? 24 : 48);

          if (
            bullet.x > pLeft &&
            bullet.x < pRight &&
            bullet.y > pTop &&
            bullet.y < pBottom
          ) {
            damagePlayer();
            createBloodSplatter(engine.player.x, engine.player.y - 20);
            return false; // destroy bullet
          }
        }

        return true;
      });

      // Tick lobbed parabolic Grenades
      engine.grenades = engine.grenades.filter((grenade) => {
        grenade.vy += 0.22; // gravity factor
        grenade.x += grenade.vx;
        grenade.y += grenade.vy;
        grenade.rotation += grenade.vx * 0.05;

        // Roll or bounce on street floor
        if (grenade.y >= groundY - 4) {
          grenade.y = groundY - 4;
          grenade.vy = -grenade.vy * 0.45; // bouncy floor index
          grenade.vx *= 0.8; // slide brake friction
        }

        grenade.fuseTime--;

        // Check if hitting an obstacle immediately
        let detonateNow = grenade.fuseTime <= 0;
        
        // Impact trigger on SUV boss directly
        if (engine.bossSpawned && engine.bossReady && engine.bossHp > 0) {
          if (
            grenade.x > engine.bossX &&
            grenade.x < engine.bossX + 180 &&
            grenade.y > engine.bossY &&
            grenade.y < engine.bossY + 90
          ) {
            detonateNow = true;
          }
        }

        if (detonateNow) {
          // BOOM!
          sounds.playExplosion();
          createExplosionParticles(grenade.x, grenade.y, 35, true);

          // Damage adjacent units!
          // Player damage
          const dxP = engine.player.x - grenade.x;
          const dyP = (engine.player.y - 15) - grenade.y;
          const dp = Math.sqrt(dxP*dxP + dyP*dyP);
          if (dp < grenade.radius) {
            damagePlayer();
          }

          // Enemies damage
          engine.enemies.forEach((enemy) => {
            if (enemy.state !== 'dead') {
              const dxE = enemy.x - grenade.x;
              const dyE = enemy.y - grenade.y;
              const de = Math.sqrt(dxE*dxE + dyE*dyE);
              if (de < grenade.radius) {
                const damageRatio = Math.max(0.2, (grenade.radius - de) / grenade.radius);
                enemy.hp -= Math.floor(grenade.damage * damageRatio * 1.5);
                createBloodSplatter(enemy.x, enemy.y - 20);

                if (enemy.hp <= 0) {
                  enemy.state = 'dead';
                  sounds.playHurt();
                  engine.stats.kills++;
                  engine.score += enemy.scoreValue;
                  setScore(engine.score);
                  spawnPickupFromEnemy(enemy.x, enemy.y);
                }
              }
            }
          });

          // Crates
          engine.crates.forEach((crate) => {
            const dxC = (crate.x + 16) - grenade.x;
            const dyC = (crate.y + 16) - grenade.y;
            const dc = Math.sqrt(dxC*dxC + dyC*dyC);
            if (dc < grenade.radius) {
              crate.hp -= grenade.damage;
              if (crate.hp <= 0) {
                // Break crate
                sounds.playCrateShatter();
                createDestructionSplinters(crate.x + 16, crate.y + 16);
              }
            }
          });

          // Barrels
          engine.barrels.forEach((bar) => {
            const dxB = (bar.x + 12) - grenade.x;
            const dyB = (bar.y + 18) - grenade.y;
            const db = Math.sqrt(dxB*dxB + dyB*dyB);
            if (db < grenade.radius && !bar.exploded) {
              bar.exploded = true;
              sounds.playExplosion();
              createExplosionParticles(bar.x + 12, bar.y + 14, 25, true);
              triggerBarrelExplosionDamage(bar.x + 12, bar.y + 14);
            }
          });

          // Boss damage
          if (engine.bossSpawned && engine.bossReady && engine.bossHp > 0) {
            const dxB = (engine.bossX + 90) - grenade.x;
            const dyB = (engine.bossY + 45) - grenade.y;
            const db = Math.sqrt(dxB*dxB + dyB*dyB);
            if (db < grenade.radius) {
              engine.bossHp -= Math.floor(grenade.damage * 1.6); // Explosives do high damage on SUV armor
              if (engine.bossHp <= 0) {
                sounds.playExplosion();
                setGameState('VICTORY');
                sounds.stopBGM();
                saveHighScore(engine.score + 10000);
              }
            }
          }

          return false; // destroy grenade
        }

        return true;
      });

      // ----------------------------------------------------
      // E. ITEM PICKUPS LOGIC
      // ----------------------------------------------------
      engine.pickups = engine.pickups.filter((pickup) => {
        // Physics bounce falling
        pickup.vy += 0.15;
        pickup.y += pickup.vy;
        pickup.bob++;

        if (pickup.y >= pickup.groundY) {
          pickup.y = pickup.groundY;
          pickup.vy = 0;
        }

        // Check commando intersection
        const dist = Math.sqrt(
          Math.pow((engine.player.x) - (pickup.x + 9), 2) +
          Math.pow((engine.player.y - 20) - (pickup.y + 9), 2)
        );

        if (dist < 28) {
          // Play loot sound
          sounds.playPickup();

          // Apply boosts
          if (pickup.type === 'HEART') {
            setHealth((prev) => Math.min(maxHealth, prev + 1));
            engine.particles.push({
              id: `heal_${Date.now()}`,
              x: engine.player.x,
              y: engine.player.y - 40,
              vx: 0,
              vy: -1.0,
              size: 8,
              color: '#ef4444',
              alpha: 1.0,
              fadeSpeed: 0.03,
              type: 'star'
            });
          } else if (pickup.type === 'SMG_AMMO') {
            setWeapons((prev) => {
              const copy = [...prev];
              // SMG index is 1
              copy[1].ammo = Math.min(copy[1].maxAmmo, copy[1].ammo + 60);
              return copy;
            });
            engine.particles.push({
              id: `ammo_${Date.now()}`,
              x: engine.player.x,
              y: engine.player.y - 40,
              vx: 0,
              vy: -1.0,
              size: 8,
              color: '#fbbf24',
              alpha: 1.0,
              fadeSpeed: 0.03,
              type: 'star'
            });
          } else if (pickup.type === 'GRENADE_PACK') {
            setWeapons((prev) => {
              const copy = [...prev];
              // GRENADE index is 2
              copy[2].ammo = Math.min(copy[2].maxAmmo, copy[2].ammo + 3);
              return copy;
            });
            engine.particles.push({
              id: `grenp_${Date.now()}`,
              x: engine.player.x,
              y: engine.player.y - 40,
              vx: 0,
              vy: -1.0,
              size: 8,
              color: '#22c55e',
              alpha: 1.0,
              fadeSpeed: 0.03,
              type: 'star'
            });
          }

          return false; // delete pickup
        }

        return true;
      });

      // Clear expired Crates
      engine.crates = engine.crates.filter(c => c.hp > 0);

      // ----------------------------------------------------
      // F. PARTICLES EMITTERS
      // ----------------------------------------------------
      engine.particles = engine.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) {
          p.vy += p.gravity;
        }
        p.alpha -= p.fadeSpeed;
        return p.alpha > 0;
      });

      // ----------------------------------------------------
      // G. ALL SCENE RENDERS & PARALLAX DRAWS
      // ----------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // 1. Draw static Parallax skies/Milad silhouettes
      drawParallaxBackground(ctx, width, height, engine.cameraX, groundY);

      // Camera Offset Matrix transform for scene actors scrolling!
      ctx.save();
      ctx.translate(-engine.cameraX, 0);

      // 2. Draw Persian illuminated signs
      drawPersianNeons(ctx, width, height, engine.cameraX, groundY);

      // 3. Draw wooden Crates
      engine.crates.forEach((crate) => {
        drawDestructibleCrate(ctx, crate.x, crate.y, crate.width, crate.height, crate.hp, crate.maxHp);
      });

      // 4. Draw Cylindrical barrels
      engine.barrels.forEach((barrel) => {
        if (!barrel.exploded) {
          drawFuelBarrel(ctx, barrel.x, barrel.y, barrel.width, barrel.height, engine.frame);
        }
      });

      // 5. Draw active pickups
      engine.pickups.forEach((pickup) => {
        drawItemPickup(ctx, pickup.x, pickup.y, pickup.type, pickup.bob);
      });

      // 6. Draw suit mafia agents
      engine.enemies.forEach((enemy) => {
        drawMafiaEnemy(ctx, enemy.x, enemy.y, enemy.dir, enemy.state, engine.frame, enemy.type);
        
        // Small green HP bar overhead for heavily armored enemies
        if (enemy.hp > 0 && enemy.state !== 'dead' && enemy.hp < enemy.maxHp) {
          const hpW = (enemy.hp / enemy.maxHp) * 20;
          ctx.fillStyle = '#000';
          ctx.fillRect(enemy.x - 5, enemy.y - enemy.height - 10, 20, 3);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(enemy.x - 5, enemy.y - enemy.height - 10, hpW, 3);
        }
      });

      // 7. Draw The Kingpin SUV boss
      if (engine.bossSpawned) {
        drawKingpinSUV(ctx, engine.bossX, engine.bossY, engine.bossHp, engine.bossMaxHp, engine.frame, 0);
      }

      // 8. Draw Player bullets & projectiles trails
      engine.bullets.forEach((bullet) => {
        if (bullet.isKnife) {
          ctx.save();
          ctx.translate(bullet.x, bullet.y);
          ctx.rotate(bullet.rotation || 0);
          
          // Draw a gorgeous pixel style combat throwing dagger
          // Dark brown leather handle/wood grip
          ctx.fillStyle = '#653b1b';
          ctx.fillRect(-6, -1.5, 5, 3);
          // Dark metallic steel cross hilt
          ctx.fillStyle = '#7a828a';
          ctx.fillRect(-1, -3.5, 1.5, 7);
          // Shining dual edge silver/white steel dagger blade
          ctx.fillStyle = '#e2f1f7';
          ctx.fillRect(0.5, -2, 9, 4);
          ctx.fillStyle = '#ffffff'; // spine shine
          ctx.fillRect(2.5, -0.5, 7, 1);
          
          ctx.restore();
        } else {
          ctx.fillStyle = bullet.color;
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
          ctx.fill();

          // Neon trace streak tail
          ctx.strokeStyle = bullet.color + '33';
          ctx.lineWidth = bullet.size;
          ctx.beginPath();
          ctx.moveTo(bullet.x, bullet.y);
          ctx.lineTo(bullet.x - bullet.vx * 1.5, bullet.y - bullet.vy * 1.5);
          ctx.stroke();
        }
      });

      // 9. Draw Grenades bouncing on ground
      engine.grenades.forEach((grenade) => {
        ctx.save();
        ctx.translate(grenade.x, grenade.y);
        ctx.rotate(grenade.rotation);
        
        // Olive shape
        ctx.fillStyle = '#3f5e31';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pin caps
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-2, -7, 4, 3);
        ctx.restore();

        // Red flickering blinking trigger dot
        if (Math.floor(engine.frame / 10) % 2 === 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(grenade.x, grenade.y - 4, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 10. Draw Commando Hero
      let activePState: 'idle' | 'running' | 'jumping' | 'crouching' | 'hurt' | 'sliding' = 'idle';
      if (engine.player.damageCooldown > 0) {
        activePState = 'hurt';
      } else if (engine.player.isSliding) {
        activePState = 'sliding';
      } else if (!engine.player.isGrounded) {
        activePState = 'jumping';
      } else if (engine.player.isCrouching) {
        activePState = 'crouching';
      } else if (Math.abs(engine.player.vx) > 0) {
        activePState = 'running';
      }

      const activeAimAngle = engine.keys['w'] ? -Math.PI / 2 : 0;

      drawCommandoPlayer(
        ctx,
        engine.player.x,
        engine.player.y,
        engine.player.dir,
        activePState,
        activeAimAngle,
        activeWeapon,
        engine.frame,
        engine.player.damageCooldown,
        engine.player.camoColor
      );

      // Red swipe effect if knifing
      if (engine.player.isKnifing) {
        ctx.save();
        const swipeX = engine.player.dir === 1 ? engine.player.x + 8 : engine.player.x - 38;
        const swipeY = engine.player.y - 28;
        ctx.translate(swipeX, swipeY);
        if (engine.player.dir === -1) ctx.scale(-1, 1);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, 0, 18, -Math.PI/3, Math.PI/3);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(12, 0, 22, -Math.PI/3, Math.PI/3);
        ctx.stroke();
        ctx.restore();
      }

      // 11. Draw physical Particles array
      engine.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        
        if (p.type === 'smoke') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          // Glow explosion ring
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.5 - p.alpha), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Flat retro pixel squares
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
        }
        ctx.restore();
      });

      // Return coordinate matrix
      ctx.restore();

      // Ensure the score is updated gracefully
      if (engine.score !== score) {
        setScore(engine.score);
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    // Trigger frame updates
    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, activeWeapon, weapons, muted, score]);

  // Handle high quality user click weapon selection card
  const handleWeaponClick = (type: WeaponType) => {
    handleSelectWeapon(type);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-mono flex flex-col selection:bg-red-600 selection:text-white select-none">
      {/* GLOWING HEADBOARD BANNER: Authentic Iranian Retro Arcade Machine */}
      <header className="border-b-4 border-slate-700 bg-slate-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo Brand with animated neon dots */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <h1 className="text-sm md:text-lg font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400">
                TEHRAN COMMANDO
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wider font-bold">RETRO RUN &amp; GUN • ضربه تکاور</p>
            </div>
          </div>

          {/* Center Name Registration (High Density block) */}
          <div className="hidden md:flex items-center gap-2 bg-black/60 px-3 py-1.5 border-b-2 border-r-2 border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
            <input 
              type="text" 
              maxLength={15}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="YOUR CALLSIGN"
              className="bg-transparent text-xs text-white outline-none border-none placeholder:text-slate-600 w-28 uppercase font-bold"
              id="callsign-input"
            />
          </div>

          {/* Sound Controls Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMuted}
              className={`px-3 py-1.5 border-b-4 border-r-4 font-bold italic text-xs uppercase cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 ${
                muted 
                  ? 'bg-red-950/40 border-red-800 text-red-500' 
                  : 'bg-slate-900 border-slate-700 text-yellow-400'
              }`}
              title={muted ? "Unmute Retro Chiptunes" : "Mute Sound"}
              id="mute-button"
            >
              {muted ? "SOUND: OFF" : "SOUND: ON"}
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-3 py-1.5 border-b-4 border-r-4 border-slate-700 bg-slate-900 text-slate-300 font-bold italic text-xs uppercase cursor-pointer hover:bg-slate-800 transition-all active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 flex items-center gap-1.5"
              id="help-toggle"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Manual</span>
            </button>
          </div>

        </div>
      </header>

      {/* ARCADE CONTAINER BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        
        {/* LEFT COMPACT INVENTORY AND COMBAT DASHBOARD (DESKTOP PANEL) */}
        <section className="lg:col-span-1 bg-slate-950 border-b-4 border-r-4 border-slate-700 p-4 flex flex-col gap-4 self-stretch font-mono">
          
          <div className="border-b-2 border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-red-500 uppercase italic tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-yellow-400 animate-pulse" />
              SOLDIER ARMORY
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Click weapon to equip in-force:</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
            {weapons.map((gun) => {
              const isActive = gun.type === activeWeapon;
              return (
                <button
                  key={gun.type}
                  onClick={() => handleWeaponClick(gun.type)}
                  className={`relative p-3 border-2 text-left flex flex-col gap-1 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-slate-900/95 border-yellow-400 brightness-125 shadow-md' 
                      : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-95 hover:border-slate-700 text-slate-300'
                  }`}
                  id={`eq-weapon-${gun.type.toLowerCase()}`}
                >
                  {/* Badge key shortcuts */}
                  <span className="absolute top-1 right-2 text-[8px] font-bold text-slate-500">
                    {gun.type === 'PISTOL' ? '[1]' : gun.type === 'SMG' ? '[2]' : gun.type === 'GRENADE' ? '[3]' : '[4]'}
                  </span>

                  <span className={`text-xs font-bold uppercase italic tracking-tight ${isActive ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {gun.name}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-500 font-bold">MUTED/AMMO:</span>
                    <span className={gun.ammo === 0 ? 'text-red-500 animate-pulse font-bold' : 'text-slate-300'}>
                      {gun.ammo === -1 ? 'INFINITE' : `${gun.ammo}/${gun.maxAmmo}`}
                    </span>
                  </div>
                  
                  {/* Minibar visual indicators */}
                  {gun.ammo !== -1 && (
                    <div className="w-full bg-slate-900 h-2 overflow-hidden mt-1 border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-orange-400 h-full transition-all" 
                        style={{ width: `${(gun.ammo / gun.maxAmmo) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick interactive stats */}
          <div className="bg-black/65 border-b-4 border-r-4 border-slate-700 p-3 rounded-none mt-auto text-xs flex flex-col gap-2">
            <span className="text-red-500 font-bold border-b border-slate-700 pb-1 text-[10px] tracking-wide block uppercase italic">
              MISSION INTELLIGENCE
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">Distance Travel:</span>
              <span className="text-white font-bold">{Math.floor(gameEngineRef.current.cameraX / 10)}m / 280m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Eliminations:</span>
              <span className="text-red-500 font-bold">{gameEngineRef.current.stats.kills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Grenades Lob:</span>
              <span className="text-orange-500 font-bold">{gameEngineRef.current.stats.grenadesThrown}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ammo Count:</span>
              <span className="text-yellow-400 font-bold">{weapons[1].ammo} rounds</span>
            </div>
          </div>

        </section>

        {/* CENTER INTERACTIVE GAME PLAYGROUND (CABINET FRAME) */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Main Visual CRT screen view */}
          <div className="relative bg-slate-950 border-b-8 border-r-8 border-slate-800 border-t-2 border-l-2 border-slate-600 overflow-hidden shadow-2xl flex flex-col items-center">
            
            {/* Horizontal scanline overlays */}
            <div className="crt-overlay"></div>

            {/* REAL-TIME RESPONSIVE CANVAS FRAME */}
            <div className="relative w-full max-w-[800px] aspect-[16/9] bg-[#020617] crt-bloom">
              
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="w-full h-full block"
                style={{ imageRendering: 'pixelated' }}
                id="classic-game-canvas"
              />

              {/* Thick bezel screen frame overlay from Design HTML */}
              <div className="absolute inset-0 pointer-events-none border-[12px] sm:border-[20px] border-black/25 z-10 shadow-inner"></div>

              {/* -----------------------------------------------
                  SCREEN OVERLAY 1: ATOMS MENU / WELCOME SCREEN
              ------------------------------------------------- */}
              {gameState === 'MENU' && (
                <div className="absolute inset-0 z-30 bg-[#020617]/95 flex flex-col items-center justify-center p-6 text-center select-none">
                  
                  {/* Glowing headline container with Persian backdrop */}
                  <div className="relative mb-2 select-none">
                    <p className="text-red-500 font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1">
                      تهران شبانه • RETRO ACTION COMMANDO
                    </p>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[2.5px_2.5px_0_rgba(0,0,0,1)] uppercase italic">
                      COMMANDO STRIKE
                    </h2>
                  </div>

                  <p className="text-slate-300 text-[10px] sm:text-xs max-w-lg leading-relaxed mt-2 p-1">
                    Operate behind enemy lines in stylized nocturnal Tehran. Destroy security barriers, fight mafia soldiers, and blow up the Kingpin armored Cruiser SUV!
                  </p>

                  <div className="bg-black/80 p-3 border-2 border-slate-700 shadow-lg mt-4 sm:mt-5 max-w-sm w-full flex flex-col gap-2">
                    <label className="text-[9px] text-slate-400 tracking-wider font-bold block uppercase text-left">
                      SOLDIER CALLSIGN REGISTER:
                    </label>
                    <input 
                      type="text"
                      maxLength={15}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="bg-[#020617] border-2 border-slate-800 text-xs py-1.5 px-3 rounded-none text-center text-yellow-400 focus:border-yellow-450 outline-none uppercase font-bold"
                      placeholder="CALLSIGN"
                    />
                  </div>

                  <button
                    onClick={startGame}
                    className="mt-6 px-8 py-3.5 bg-yellow-400 hover:bg-yellow-350 text-black font-extrabold text-xs sm:text-base cursor-pointer rounded-none shadow-lg border-b-4 border-r-4 border-yellow-600 active:border-b-2 active:border-r-2 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-3 uppercase italic"
                    id="start-mission-btn"
                  >
                    <Play className="w-5 h-5 fill-black text-black" />
                    START OPERATION
                  </button>

                  <p className="text-[8px] text-slate-500 mt-6 tracking-wider">
                    COMPATIBLE WITH KEYBOARDS • WASD DIRECTIONS • [K] FIRE • [L] JUMP • [O] GRENADE
                  </p>
                </div>
              )}

              {/* -----------------------------------------------
                  SCREEN OVERLAY 2: GAME OVER STATE VIEW
              ------------------------------------------------- */}
              {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-30 bg-[#020617]/95 flex flex-col items-center justify-center p-6 text-center select-none">
                  
                  <div className="bg-black/60 p-3 border-b-4 border-r-4 border-slate-700 mb-3 text-red-500 text-2xl font-bold">
                     💀
                  </div>

                  <h2 className="text-xl sm:text-4xl font-black text-red-500 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase italic tracking-tighter">
                    MISSION FAILURE
                  </h2>
                  <p className="text-[10px] text-slate-400 uppercase mt-1">
                    OUR COMMANDO FELL IN THE STREETS OF TEHRAN
                  </p>

                  <div className="my-5 p-3.5 bg-black/85 border-2 border-slate-700 shadow-xl max-w-sm w-full flex flex-col items-stretch gap-2.5">
                    <div className="flex justify-between text-[11px] border-b border-slate-800 pb-2">
                      <span className="text-slate-400">FINAL SCORE:</span>
                      <span className="text-yellow-400 font-bold">{score} PTS</span>
                    </div>
                    <div className="flex justify-between text-[11px] border-b border-slate-800 pb-2">
                      <span className="text-slate-400">ELIMINATIONS:</span>
                      <span className="text-red-500 font-bold">{gameEngineRef.current.stats.kills}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pb-1">
                      <span className="text-slate-400">ELAPSED TIME:</span>
                      <span className="text-cyan-400 font-bold">{gameEngineRef.current.stats.timeElapsed}S</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={startGame}
                      className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs cursor-pointer border-b-4 border-r-4 border-yellow-600 active:border-b-2 active:border-r-2 active:translate-x-[1px] active:translate-y-[1px] transition-all italic uppercase tracking-tighter"
                      id="retry-mission-btn"
                    >
                      RETRY MISSION [STAND-BY]
                    </button>
                    <button
                      onClick={() => setGameState('MENU')}
                      className="px-6 py-3 bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-slate-300 text-xs uppercase"
                      id="exit-to-menu-btn"
                    >
                      EXIT KEY
                    </button>
                  </div>

                </div>
              )}

              {/* -----------------------------------------------
                  SCREEN OVERLAY 3: VICTORY / MISSION ACCOMPLISHED
              ------------------------------------------------- */}
              {gameState === 'VICTORY' && (
                <div className="absolute inset-0 z-30 bg-[#020617]/95 flex flex-col items-center justify-center p-6 text-center overflow-y-auto select-none">
                  
                  <div className="bg-black/60 p-3 border-b-4 border-r-4 border-slate-700 mb-2">
                    <span className="text-yellow-400 text-2xl font-bold">🏆</span>
                  </div>

                  <p className="text-[10px] text-yellow-400 tracking-widest font-bold uppercase">
                    تهران آزاد شد • MISSION SUCCESS
                  </p>
                  
                  <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase mt-1 italic tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    KINGPIN SUV ANNIHILATED!
                  </h2>

                  <div className="my-3 p-4 bg-black/85 border-2 border-slate-700 shadow-xl text-left max-w-md w-full grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                    <div className="col-span-2 text-center text-[10px] text-red-500 font-bold border-b border-slate-800 pb-1.5 uppercase mb-2 italic tracking-tight">
                      🎖️ DEBRIEFING PERFORMANCE REGISTER
                    </div>
                    <div>
                      <span className="text-slate-550 italic">SOLDIER NAME:</span>
                      <p className="text-white font-bold uppercase">{playerName}</p>
                    </div>
                    <div>
                      <span className="text-slate-555 italic">FINAL SCORE:</span>
                      <p className="text-yellow-400 font-bold">{score + 10000} PTS</p>
                    </div>
                    <div>
                      <span className="text-slate-556 italic">ELIMINATIONS:</span>
                      <p className="text-red-500 font-bold">{gameEngineRef.current.stats.kills}</p>
                    </div>
                    <div>
                      <span className="text-slate-557 italic">KNIFE MELEE:</span>
                      <p className="text-orange-500 font-bold">{gameEngineRef.current.stats.knifeKills}</p>
                    </div>
                    <div>
                      <span className="text-slate-558 italic">ACCURACY:</span>
                      <p className="text-green-400 font-bold">
                        {gameEngineRef.current.stats.shotsFired > 0 
                          ? `${Math.floor((gameEngineRef.current.stats.shotsHit / gameEngineRef.current.stats.shotsFired) * 100)}%`
                          : '100%'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-559 italic">COMPLETION TIME:</span>
                      <p className="text-cyan-400 font-bold">{gameEngineRef.current.stats.timeElapsed} SECONDS</p>
                    </div>
                    <div className="col-span-2 border-t border-slate-800 pt-2.5 mt-1.5 flex justify-between items-center bg-slate-900/40 px-3 py-1">
                      <span className="text-slate-400 text-[10px] font-bold">COMMANDER EVALUATION:</span>
                      <span className="text-yellow-400 font-black tracking-wider text-xs italic">S-RANK LION</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={startGame}
                      className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-350 text-black font-extrabold text-xs uppercase italic border-b-4 border-r-4 border-yellow-600 active:border-b-2 active:border-r-2"
                      id="play-again-btn"
                    >
                      REPLAY MISSION
                    </button>
                    <button
                      onClick={() => setGameState('MENU')}
                      className="px-6 py-2.5 bg-slate-900 border-2 border-slate-700 text-slate-300 text-xs uppercase font-bold"
                      id="menu-btn"
                    >
                      RETURN MAIN
                    </button>
                  </div>

                </div>
              )}

              {/* -----------------------------------------------
                  SCREEN OVERLAY 4: GAME PAUSE STATE VIEW
              ------------------------------------------------- */}
              {gameState === 'PAUSED' && (
                <div className="absolute inset-0 z-30 bg-black/25 flex flex-col items-center justify-center p-4 text-center select-none backdrop-blur-[1px]" id="pause-overlay-main">
                  
                  <div className="bg-black/90 p-5 border-4 border-slate-700 shadow-[0_0_20px_rgba(234,179,8,0.25)] max-w-sm w-full flex flex-col gap-3 rounded-none">
                    
                    <div className="bg-yellow-500/10 px-4 py-2 border-2 border-yellow-500/30 text-yellow-400 text-sm font-extrabold uppercase tracking-widest italic animate-pulse">
                       ⏸️ MISSION HALTED
                    </div>

                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                      PRESS <span className="text-yellow-400 font-black px-1.5 py-0.5 bg-slate-900 border border-slate-700 font-mono">P</span> OR <span className="text-yellow-400 font-black px-1.5 py-0.5 bg-slate-900 border border-slate-700 font-mono font-bold">ESC</span> TO RESUME MISSION
                    </div>

                    {/* Outfit customization segment in full view of the commando hero! */}
                    <div className="my-1.5 p-3 bg-slate-950 border border-slate-850 text-left">
                      <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black mb-2 text-center border-b border-slate-850 pb-1.5 font-bold">
                        ⚡ CHOOSE COMMANDO CAMOUFLAGE ⚡
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'GREEN', label: 'Forest Green', bg: 'bg-[#3a4a2a]', border: 'border-[#5d704d]' },
                          { id: 'BLUE', label: 'Winter Aqua', bg: 'bg-[#1e3a8a]', border: 'border-[#3b82f6]' },
                          { id: 'RED', label: 'Crimson Elite', bg: 'bg-[#991b1b]', border: 'border-[#ef4444]' },
                          { id: 'GOLD', label: 'Gold Commando', bg: 'bg-[#a16207]', border: 'border-[#fbbf24]' }
                        ].map((c) => {
                          const active = camoColor === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                sounds.playSwitchWeapon();
                                setCamoColor(c.id as any);
                                gameEngineRef.current.player.camoColor = c.id as any;
                              }}
                              className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-extrabold uppercase border ${active ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-850 bg-slate-900 hover:bg-slate-850 text-slate-400'} cursor-pointer text-left transition-all`}
                            >
                              <span className={`w-3 h-3 ${c.bg} border ${c.border} inline-block shrink-0`} />
                              <span className="truncate">{c.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Resume Button */}
                      <button
                        onClick={() => {
                          sounds.init();
                          sounds.startBGM();
                          sounds.playSwitchWeapon();
                          setGameState('PLAYING');
                        }}
                        className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-350 text-black font-extrabold text-xs cursor-pointer border-b-4 border-r-4 border-yellow-600 active:border-b-2 active:border-r-2 active:translate-x-[1px] active:translate-y-[1px] transition-all italic uppercase tracking-tighter"
                        id="pause-resume-btn"
                      >
                        RESUME MISSION
                      </button>

                      {/* Restart Button */}
                      <button
                        onClick={() => {
                          startGame();
                        }}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs cursor-pointer border-b-4 border-r-4 border-red-800 active:border-b-2 active:border-r-2 active:translate-x-[1px] active:translate-y-[1px] transition-all italic uppercase tracking-tighter"
                        id="pause-restart-btn"
                      >
                        RESTART OPERATION
                      </button>

                      {/* Exit Button */}
                      <button
                        onClick={() => {
                          sounds.stopBGM();
                          sounds.playSwitchWeapon();
                          setGameState('MENU');
                        }}
                        className="w-full px-4 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs uppercase font-extrabold cursor-pointer transition-all"
                        id="pause-exit-btn"
                      >
                        EXIT KEY
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* HUD / UPPER GAME STAT BAR OVERLAY */}
              {gameState === 'PLAYING' && (
                <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start pointer-events-none select-none z-20">
                  
                  {/* Hearts block & score exactly styled like the design HTML */}
                  <div className="flex items-center gap-1 bg-black/60 p-2 border-b-4 border-r-4 border-slate-700">
                    <div className="flex gap-1 text-2xl leading-none">
                      {[...Array(maxHealth)].map((_, hIdx) => {
                        const isFull = hIdx < health;
                        return (
                          <span 
                            key={hIdx} 
                            className={isFull ? 'text-red-500' : 'text-slate-700'}
                          >
                            ♥
                          </span>
                        );
                      })}
                    </div>
                    <div className="ml-4 px-3 py-0.5 bg-yellow-400 text-black font-bold text-base italic uppercase leading-none">
                      SC: {score.toString().padStart(6, '0')}
                    </div>
                  </div>

                  {/* Warning message if SUV boss approach imminent */}
                  {gameEngineRef.current.bossSpawned && !gameEngineRef.current.bossReady && (
                    <div className="bg-red-950/90 border-2 border-red-600 text-red-100 font-mono px-3 py-1.5 rounded-none animate-bounce shadow-xl flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500 animate-ping shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold">WARNING: THE KINGPIN INCOMING!</p>
                        <p className="text-[8px] text-red-300">BLACK TOYODA SUV ARRIVING</p>
                      </div>
                    </div>
                  )}

                  {/* Top center boss health bar if spawned (Exactly from Design HTML) */}
                  {gameEngineRef.current.bossSpawned && gameEngineRef.current.bossReady && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 sm:w-80">
                      <div className="bg-black/80 p-1 border-2 border-slate-400 shadow-lg font-mono">
                        <div className="flex justify-between items-end mb-1 px-1">
                          <span className="text-[9px] uppercase font-bold text-red-500 tracking-tighter italic">THE KINGPIN (S-500 TURBO)</span>
                          <span className="text-[9px] text-white/70%">{Math.max(0, Math.floor((gameEngineRef.current.bossHp / gameEngineRef.current.bossMaxHp) * 100))}%</span>
                        </div>
                        <div className="h-3 bg-slate-900 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 to-orange-400 shadow-[0_0_10px_#ef4444] transition-all duration-100" 
                            style={{ width: `${Math.max(0, (gameEngineRef.current.bossHp / gameEngineRef.current.bossMaxHp) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Bottom weapon quick slot HUD overlay from Design HTML */}
              {gameState === 'PLAYING' && (
                <div className="absolute bottom-4 left-4 flex gap-2.5 z-20">
                  {weapons.map((gun) => {
                    const isActive = gun.type === activeWeapon;
                    return (
                      <div 
                        key={gun.type}
                        className={`flex flex-col items-center px-2 py-1.5 border-2 text-[8px] font-mono select-none pointer-events-auto cursor-pointer ${
                          isActive 
                            ? 'bg-slate-900/95 border-slate-400 brightness-150' 
                            : 'bg-slate-950/85 border-slate-800 opacity-60'
                        }`}
                        onClick={() => handleSelectWeapon(gun.type)}
                      >
                        <div className="w-10 h-6 bg-slate-950 mb-1 flex items-center justify-center overflow-hidden">
                          {gun.type === 'PISTOL' && <div className="w-6 h-1.5 bg-slate-405 rounded-sm relative"><div className="absolute -right-0.5 -top-0.5 w-2 h-2 bg-slate-200 rounded-full"></div></div>}
                          {gun.type === 'SMG' && <div className="w-8 h-2 bg-slate-500"></div>}
                          {gun.type === 'GRENADE' && <div className="w-4 h-4 bg-green-700 rounded-full"></div>}
                          {gun.type === 'KNIFE' && <div className="w-8 h-1 bg-slate-300 rotate-45"></div>}
                        </div>
                        <span className="font-bold tracking-tighter text-[7.5px] uppercase">{gun.type}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom right Ammo slots overlay from Design HTML */}
              {gameState === 'PLAYING' && (
                <div className="absolute bottom-4 right-4 flex items-end gap-5 z-20 pointer-events-none select-none">
                  <div className="text-right">
                    <div className="text-slate-400 text-[9px] font-bold whitespace-nowrap">AMMO</div>
                    <div className="text-2xl sm:text-3xl font-black text-white italic drop-shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                      {activeWeapon === 'SMG' 
                        ? (weapons.find(w => w.type === 'SMG')?.ammo ?? 0) 
                        : (activeWeapon === 'PISTOL' ? '∞' : (activeWeapon === 'KNIFE' ? '—' : '0'))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[9px] font-bold whitespace-nowrap">GRENADES</div>
                    <div className="text-2xl sm:text-3xl font-black text-orange-500 italic drop-shadow-[1.5px_1.5px_0_rgba(0,0,0,1)]">
                      {(weapons.find(w => w.type === 'GRENADE')?.ammo ?? 0).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* SCREEN-BOTTOM VIRTUAL TACTICAL BUTTONS & JOYSTICK CONTROLS */}
            <div className="w-full bg-[#020617] p-3 border-t-4 border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-2.5 items-center">
              
              {/* Directional joystick buttons (Tactical border-b-4 border-r-4 design) */}
              <div className="flex gap-1.5">
                <button
                  onMouseDown={() => { gameEngineRef.current.keys['a'] = true; }}
                  onMouseUp={() => { gameEngineRef.current.keys['a'] = false; }}
                  onTouchStart={() => { gameEngineRef.current.keys['a'] = true; }}
                  onTouchEnd={() => { gameEngineRef.current.keys['a'] = false; }}
                  className="flex-1 bg-slate-900 border-b-4 border-r-4 border-slate-700 text-white font-bold p-2 sm:p-3 text-xs active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 cursor-pointer transition-all text-center select-none"
                  id="ctrl-btn-left"
                >
                  ◀ BACK
                </button>
                <div className="flex flex-col gap-1 flex-1">
                  <button
                    onMouseDown={() => { gameEngineRef.current.keys['w'] = true; }}
                    onMouseUp={() => { gameEngineRef.current.keys['w'] = false; }}
                    onTouchStart={() => { gameEngineRef.current.keys['w'] = true; }}
                    onTouchEnd={() => { gameEngineRef.current.keys['w'] = false; }}
                    className="bg-slate-900 border-b-2 border-r-2 border-slate-700 text-white font-bold px-1 py-1 text-[9px] cursor-pointer text-center select-none"
                    id="ctrl-btn-up"
                  >
                    ▲ AIM UP
                  </button>
                  <button
                    onMouseDown={() => { gameEngineRef.current.keys['s'] = true; }}
                    onMouseUp={() => { gameEngineRef.current.keys['s'] = false; }}
                    onTouchStart={() => { gameEngineRef.current.keys['s'] = true; }}
                    onTouchEnd={() => { gameEngineRef.current.keys['s'] = false; }}
                    className="bg-slate-900 border-b-2 border-r-2 border-slate-700 text-white font-bold px-1 py-1 text-[9px] cursor-pointer text-center select-none"
                    id="ctrl-btn-crouch"
                  >
                    ▼ CROUCH
                  </button>
                </div>
                <button
                  onMouseDown={() => { gameEngineRef.current.keys['d'] = true; }}
                  onMouseUp={() => { gameEngineRef.current.keys['d'] = false; }}
                  onTouchStart={() => { gameEngineRef.current.keys['d'] = true; }}
                  onTouchEnd={() => { gameEngineRef.current.keys['d'] = false; }}
                  className="flex-1 bg-slate-900 border-b-4 border-r-4 border-slate-700 text-white font-bold p-2 sm:p-3 text-xs active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 cursor-pointer transition-all text-center select-none"
                  id="ctrl-btn-right"
                >
                  WALK ▶
                </button>
              </div>

              {/* Weapon active hotkeys switches (Center column) */}
              <div className="flex gap-1 justify-center md:col-span-1 col-span-2 py-1 md:py-0">
                {weapons.map((gun) => {
                  const isActive = gun.type === activeWeapon;
                  return (
                    <button
                      key={gun.type}
                      onClick={() => handleSelectWeapon(gun.type)}
                      className={`px-2 py-1.5 text-[9px] font-bold border-2 cursor-pointer uppercase transition-all ${
                        isActive 
                          ? 'bg-slate-900 border-yellow-400 text-yellow-400 brightness-110 font-extrabold' 
                          : 'bg-black/60 border-slate-800 text-slate-500'
                      }`}
                      id={`btn-switch-${gun.type.toLowerCase()}`}
                    >
                      {gun.type}
                    </button>
                  );
                })}
              </div>

              {/* Combat Action Buttons (Right side - Solid colors matching Design HTML) */}
              <div className="flex gap-1.5 col-span-2 md:col-span-1">
                {/* 1) FIRE GUN */}
                <button
                  onMouseDown={() => { gameEngineRef.current.keys['k'] = true; }}
                  onMouseUp={() => { gameEngineRef.current.keys['k'] = false; }}
                  onTouchStart={() => { gameEngineRef.current.keys['k'] = true; }}
                  onTouchEnd={() => { gameEngineRef.current.keys['k'] = false; }}
                  className="flex-1 bg-yellow-400 text-black font-black border-b-4 border-r-4 border-yellow-600 py-2 sm:py-3 px-1 text-xs active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 cursor-pointer transition-all text-center select-none uppercase italic"
                  id="ctrl-btn-fire"
                >
                  🔥 SHOOT [K]
                </button>

                {/* 2) JUMP */}
                <button
                  onMouseDown={() => { gameEngineRef.current.keys['l'] = true; }}
                  onMouseUp={() => { gameEngineRef.current.keys['l'] = false; }}
                  onTouchStart={() => { gameEngineRef.current.keys['l'] = true; }}
                  onTouchEnd={() => { gameEngineRef.current.keys['l'] = false; }}
                  className="flex-1 bg-orange-550 bg-orange-500 text-white font-black border-b-4 border-r-4 border-orange-700 py-2 sm:py-3 px-1 text-xs active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 cursor-pointer transition-all text-center select-none uppercase italic"
                  id="ctrl-btn-jump"
                >
                  🦘 JUMP [L]
                </button>

                {/* 3) TACTICAL KNIFE SLASH */}
                <button
                  onClick={triggerKnifeAttack}
                  className="bg-red-600 text-white font-black border-b-4 border-r-4 border-red-800 py-2 sm:py-3 px-3 text-xs active:translate-x-[2px] active:translate-y-[2px] active:border-b-2 active:border-r-2 cursor-pointer transition-all text-center select-none uppercase italic"
                  title="Knife melee attack"
                  id="ctrl-btn-melee"
                >
                  🗡️ KNIFE
                </button>
              </div>

            </div>

          </div>

          {/* KEYBOARD OVERVIEW SECTION / DETAILED HELP COLLAPSIBLE */}
          {showHelp && (
            <div className="bg-slate-950 border-2 border-slate-700 p-4 font-mono text-xs text-slate-350">
              <p className="text-red-500 font-bold border-b-2 border-slate-800 pb-1 mb-2 italic">KEYBOARD MANUAL GUIDELINES</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-yellow-450 text-yellow-400 font-bold mb-1">🕹️ Character Walk:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1.5">
                    <li><kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">A</kbd> / <kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">◀</kbd>: Move left</li>
                    <li><kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">D</kbd> / <kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">▶</kbd>: Move street right</li>
                    <li><kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">S</kbd> / <kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">▼</kbd>: Crouch/duck</li>
                    <li><kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">W</kbd> / <kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">▲</kbd>: Aim straight up</li>
                    <li><kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">L</kbd>: Jump high</li>
                  </ul>
                </div>
                <div>
                  <p className="text-orange-500 font-bold mb-1">💥 Firepower Weapons:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1.5">
                    <li><kbd className="bg-black/60 px-1 border border-slate-700 font-bold text-[10px]">K</kbd>: Shoot current armed weapon</li>
                    <li><kbd className="bg-[#1a1c24] px-1 border border-[#3e4252] text-[10px]">O</kbd>: Throw tactical grenade</li>
                    <li><kbd className="bg-[#1a1c24] px-1 border border-[#3e4252] text-[10px]">I</kbd>: Swap weapon index</li>
                    <li><kbd className="bg-[#1a1c24] px-1 border border-[#3e4252] text-[10px]">1</kbd> - <kbd className="bg-[#1a1c24] px-1 border border-[#3e4252] text-[10px]">4</kbd>: Quick selection keys</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* HIGHSCORE LEADERBOARD PANEL (BOTTOM STRIP) */}
      <footer className="mt-auto border-t-4 border-slate-700 bg-slate-950 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-xs font-bold text-slate-100 uppercase italic">TEHRAN RETRO HIGH RECORDS</p>
              <p className="text-[10px] text-slate-500 font-bold">Persisted locally in your browser cache</p>
            </div>
          </div>

          {/* Leaders List */}
          <div className="flex flex-wrap gap-2 justify-center">
            {highScores.map((leader, i) => (
              <div 
                key={i} 
                className="bg-slate-900 border-2 border-slate-700 px-2.5 py-1 text-[10px] flex items-center gap-1.5"
              >
                <span className="text-slate-500 font-bold">#{i+1}</span>
                <span className="text-yellow-400 font-bold uppercase">{leader.name}</span>
                <span className="text-white font-bold">{leader.score.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Reset Leaderboard records */}
          <button
            onClick={handleResetScores}
            className="text-[10px] text-slate-400 hover:text-red-500 border border-slate-800 hover:border-red-950/50 bg-black/40 px-2.5 py-1 transition-all uppercase cursor-pointer"
            id="reset-leaderboard"
          >
            Clear Records
          </button>

        </div>
      </footer>

    </div>
  );
}
