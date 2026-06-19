export type WeaponType = 'PISTOL' | 'SMG' | 'GRENADE' | 'KNIFE';

export interface Weapon {
  type: WeaponType;
  name: string;
  ammo: number; // -1 for infinite (Pistol)
  maxAmmo: number;
  fireRate: number; // MS between shots
  damage: number;
}

export interface GameStats {
  score: number;
  kills: number;
  knifeKills: number;
  grenadesThrown: number;
  damageTaken: number;
  accuracy: {
    fired: number;
    hit: number;
  };
  timeElapsed: number; // in seconds
}

export interface HighScore {
  name: string;
  score: number;
  date: string;
  rank: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  fadeSpeed: number;
  gravity?: number;
  rotation?: number;
  rotationSpeed?: number;
  type?: 'ember' | 'smoke' | 'debris' | 'blood' | 'neon' | 'star';
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 'player' | 'enemy' | 'boss';
  damage: number;
  size: number;
  color: string;
  angle?: number;
  isKnife?: boolean;
  rotation?: number;
}

export interface Grenade {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  fuseTime: number; // in frames or MS
  damage: number;
  radius: number;
}

export interface Pickup {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'HEART' | 'SMG_AMMO' | 'GRENADE_PACK';
  vy: number;
  groundY: number;
  bob: number;
}

export interface DestructibleCrate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
}
