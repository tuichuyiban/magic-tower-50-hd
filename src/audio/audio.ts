/**
 * 合成音乐与音效（WebAudio，无外部素材）。
 * - 首次用户手势（点击 / 触摸 / 按键）时创建并恢复 AudioContext（移动端自动播放限制）；
 * - 背景音乐：内置小型音序器（提前 0.15s 排程）。每个区域一首循环曲（与原版 section1–5.mp3 的调式 / 速度 / 情绪对应，
 *   见 docs/research.md §13），外加伏击 / 头目战的紧张曲；换曲时交叉淡入淡出；
 * - 音效：方波 / 三角波 / 噪声合成的芯片音风格。
 */
/** tower = 第一区（保持原有平静主题）；mystery = 第二区；gloom（深渊）/ march（进军）/ still（远征）= 第三 / 四 / 五区；tension = 伏击 / 头目战 */
export type Track =
  | 'tower' | 'mystery' | 'march' | 'still' | 'gloom' | 'tension'
  | 'princess' | 'knight' | 'zeno' | 'lastfight' | 'void' | 'cellar' | 'ending' | 'none';

/** 楼层区域 → 曲目（1–10F、11–20F、21–30F、31–40F、41–50F） */
// 第二轮反馈（用户）：三 / 四 / 五区轮换——原第五区「深渊」→ 第三区，原第三区「进军」→ 第四区，「远征」→ 第五区
export const ZONE_TRACKS: Track[] = ['tower', 'mystery', 'gloom', 'march', 'still'];
export const trackForFloor = (floor: number): Track =>
  floor === 0 ? 'cellar' : floor === 44 ? 'void' : ZONE_TRACKS[Math.min(4, Math.max(0, Math.ceil(floor / 10) - 1))];
export const TRACK_NAMES: Record<Exclude<Track, 'none'>, string> = {
  tower: '第一区 · 塔中（平静，C 大调）',
  mystery: '第二区 · 迷雾（神秘，A 小调）',
  gloom: '第三区 · 深渊（沉重阴郁，G 小调）',
  march: '第四区 · 进军（明快激昂，B 小调 / D 大调）',
  still: '第五区 · 远征（激扬，E 小调，120 BPM）',
  tension: '伏击 / 头目战（紧张，A 小调）',
  princess: '26F · 洋娃娃（八音盒，B 小调）',
  knight: '40F · 骑士队长（以紧张曲为底，D 大调 / 混合利底亚，144 BPM）',
  zeno: '49F · 假魔王（以紧张曲为底，D 和声小调，128 BPM）',
  lastfight: '50F · 最终决战（以紧张曲为底，A 小调，112 BPM）',
  void: '44F · 异空间（空灵，A 小调，66 BPM）',
  cellar: '0F · 地下室（明亮，F 大调）',
  ending: '结局（凯旋，D 大调）',
};

export type Sfx =
  | 'step' | 'hit' | 'kill' | 'door' | 'hidden' | 'item' | 'key' | 'gem' | 'potion' | 'equip'
  | 'buy' | 'stairs' | 'blip' | 'error' | 'undo' | 'save' | 'heavy'
  /** 武器攻击的附加层：arg = 档位 0 空手 … 5 神圣剑（与原有「hit」叠加，越好的武器层数越多） */
  | 'swing';

interface Note {
  m: number; // MIDI 音高，-1 = 休止
  l: number; // 时值（八分音符个数）
}

const n = (s: string): Note[] =>
  s.trim().split(/\s+/).map((t) => {
    const [a, b] = t.split(':');
    return { m: a === 'r' ? -1 : Number(a), l: Number(b ?? 1) };
  });

interface Song {
  bpm: number;
  lead: Note[];
  /** 每小节（8 个八分音符）一个和弦；chords[i][0] 为根音 */
  chords: number[][];
  leadWave: OscillatorType;
  leadVol: number;
  leadLp: number;
  arpWave: OscillatorType;
  arpVol: number;
  arpLp: number;
  arp: number[];
  /** 琶音间隔（八分音符数） */
  arpEvery: number;
  /** beat = 每拍；pulse = 八分音符八度脉冲；half = 二分音符；whole = 每小节一个长音 */
  bass: 'beat' | 'pulse' | 'half' | 'whole';
  bassShift: number;
  bassVol: number;
  perc?: 'hat' | 'toll' | 'drum';
}

/** 第一区「塔中」：C – Am – F – G – C – Em – F – G（96 BPM）——原有主题，保持不变 */
const TOWER: Song = {
  bpm: 96,
  lead: n(`76:2 79:2 84:2 83:1 81:1  81:3 79:1 76:2 72:2  77:2 81:2 84:2 81:2  79:4 74:2 71:2
           76:2 79:2 84:3 86:1  83:2 79:2 76:4  81:2 84:2 77:2 81:2  79:3 77:1 74:2 71:2
           72:2 76:2 79:2 76:2  69:2 72:2 76:4  65:2 69:2 72:2 77:2  74:4 r:2 79:2
           76:2 72:2 79:2 84:2  83:2 79:2 76:2 71:2  77:2 76:2 74:2 72:2  71:4 r:4`),
  chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [40, 43, 47], [41, 45, 48], [43, 47, 50]],
  leadWave: 'triangle', leadVol: 0.42, leadLp: 2600,
  arpWave: 'square', arpVol: 0.07, arpLp: 1800, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'beat', bassShift: -12, bassVol: 0.55,
};

/** 伏击 / 头目战：A 小调，较快（138 BPM）——用户喜欢的紧张曲，保持不变 */
const TENSION: Song = {
  bpm: 138,
  lead: n(`69 72 76 81 79 76 72 76  77:2 76:2 74:2 72:2  77 81 84 81 77 81 84 86  88:2 86 84 83:2 80:2
           69 72 76 81 79 76 72 76  77:2 76:2 74:2 76:2  72 77 81 77 72 77 81 84  83:4 80:2 76:2`),
  chords: [[45, 48, 52], [45, 48, 52], [41, 45, 48], [40, 44, 47], [45, 48, 52], [45, 48, 52], [41, 45, 48], [40, 44, 47]],
  leadWave: 'square', leadVol: 0.1, leadLp: 2600,
  arpWave: 'square', arpVol: 0.07, arpLp: 1800, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'pulse', bassShift: -12, bassVol: 0.55,
};

/**
 * 第二区「迷雾」：A 小调（原版 section2 的音级集中在 A / D / E / C / C#，大小三度交替），84 BPM。
 * Am – G – F – E | Am – Dm – B♭ – E：降 II（B♭）与属和弦的升 G 带来神秘感；三角波琶音隔拍、慢颤音长音。
 */
const MYSTERY: Song = {
  bpm: 84,
  lead: n(`76:3 77:1 76:2 72:2  74:4 71:2 74:2  72:3 74:1 72:2 69:2  68:6 r:2
           69:2 72:2 76:2 81:2  77:4 74:2 77:2  74:3 72:1 70:2 74:2  71:4 68:2 64:2`),
  chords: [[45, 48, 52], [43, 47, 50], [41, 45, 48], [40, 44, 47], [45, 48, 52], [38, 41, 45], [46, 50, 53], [40, 44, 47]],
  leadWave: 'triangle', leadVol: 0.36, leadLp: 2000,
  arpWave: 'triangle', arpVol: 0.2, arpLp: 1600, arp: [0, 2, 1, 2, 0, 2, 1, 2], arpEvery: 1,
  bass: 'half', bassShift: -12, bassVol: 0.5,
};

/**
 * 第三区「进军」：B 小调（原版 section3 检测为 B 小调，约 129 BPM），明快激昂的进行曲：
 * Bm – G – D – A | Bm – G – A – F#（i–VI–III–VII，结尾升 F 大三和弦推动循环），八分音符八度低音 + 反拍镲。
 */
const MARCH: Song = {
  bpm: 129,
  lead: n(`71:2 74 78 83:3 81  79:2 78 76 74:2 79:2  78:3 76 74:2 73 74  76:6 r:2
           71 74 78:2 83:2 86:2  83:2 79:2 81 83 79:2  81:2 76:2 78 79 81:2  78:4 73:2 r:2`),
  chords: [[47, 50, 54], [43, 47, 50], [50, 54, 57], [45, 49, 52], [47, 50, 54], [43, 47, 50], [45, 49, 52], [42, 46, 49]],
  leadWave: 'square', leadVol: 0.11, leadLp: 3200,
  arpWave: 'square', arpVol: 0.06, arpLp: 2200, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'pulse', bassShift: -12, bassVol: 0.5, perc: 'hat',
};

/**
 * 第四区「远征」：E 小调（原版 section4 检测为 E 小调），120 BPM，激扬振奋（用户反馈原「静夜」太低沉，已替换）：
 * Em – C – D – B | Em – G – A – B（i–VI–VII–V，后半借用 E 多利亚的 A 大三和弦向上推，B 大三和弦的 D# 导音回到主和弦），
 * 附点号角式旋律（锯齿波，低通）、八度脉冲低音 + 底鼓 / 军鼓。与第三区 B 小调的明快进行曲在调性、音色与节奏型上都不同。
 * 曲目 id 仍为 still（存档 / 设置兼容）。
 */
const STILL: Song = {
  bpm: 120,
  lead: n(`71 76 79:2 78 76 78:2  79:3 76 72:2 76:2  78:2 74 78 81:2 79 78  75:4 r 71 75 78
           83:3 81 79:2 76:2  79 81 83:2 86:3 83  85:2 81 76 81:2 85:2  83:4 78:2 75:2`),
  chords: [[40, 43, 47], [48, 52, 55], [50, 54, 57], [47, 51, 54], [40, 43, 47], [43, 47, 50], [45, 49, 52], [47, 51, 54]],
  leadWave: 'sawtooth', leadVol: 0.075, leadLp: 2800,
  arpWave: 'square', arpVol: 0.055, arpLp: 2000, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'pulse', bassShift: -12, bassVol: 0.5, perc: 'drum',
};

/**
 * 第五区「深渊」：G 小调（原版 section5 检测为 G 小调），76 BPM，沉重阴郁：
 * Gm – E♭ – Cm – D | Gm – A♭ – E♭ – D（降 II 的 A♭ 呈弗里几亚色彩），低音区旋律、每拍重低音 + 小节首的钟声。
 */
const GLOOM: Song = {
  bpm: 76,
  lead: n(`67:4 70:2 67:2  67:2 63:4 62:2  63:4 60:2 63:2  62:6 r:2
           55:2 58:2 62:2 67:2  68:4 67:2 63:2  63:2 65:2 67:2 70:2  66:4 62:2 r:2`),
  chords: [[43, 46, 50], [39, 43, 46], [48, 51, 55], [38, 42, 45], [43, 46, 50], [44, 48, 51], [39, 43, 46], [38, 42, 45]],
  leadWave: 'square', leadVol: 0.12, leadLp: 1200,
  arpWave: 'triangle', arpVol: 0.18, arpLp: 1000, arp: [0, 2, 1, 2], arpEvery: 2,
  bass: 'beat', bassShift: -12, bassVol: 0.62, perc: 'toll',
};

/*
 * 剧情 / 头目曲（第三~五区）：原版 Princess / Knight / Zeno / LastFight / 44f / 0f / Ending 只用于本地分析调性与速度
 * （Princess B 小调 ≈99 BPM；Knight D 大调含 C 还原音 ≈144；Zeno D 小调含 C# ≈128；LastFight A 小调 ≈112；
 *  44f A 小调 ≈66；0f F 大调 ≈144；Ending D 大调 ≈117），旋律全部为原创；三首头目曲沿用用户喜欢的「紧张曲」编制。
 */
const PRINCESS: Song = {
  bpm: 92,
  lead: n(`78:2 74 71 74:2 78:2  79:3 78 74:2 71:2  74:2 76 78 81:3 78  76:4 73:2 69:2
           71:2 74:2 78:2 83:2  79:3 78 76:2 74:2  73:2 76:2 78:2 70:2  71:6 r:2`),
  chords: [[47, 50, 54], [43, 47, 50], [50, 54, 57], [45, 49, 52], [47, 50, 54], [40, 43, 47], [42, 46, 49], [47, 50, 54]],
  leadWave: 'triangle', leadVol: 0.16, leadLp: 3200,
  arpWave: 'sine', arpVol: 0.08, arpLp: 2600, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'half', bassShift: -12, bassVol: 0.32,
};

const KNIGHT: Song = {
  bpm: 144,
  lead: n(`74 78 81 86 85 81 78 81  79:2 76:2 72:2 76:2  74 79 83 79 74 79 83 86  85:2 81 79 76:2 73:2
           74 78 81 86 85 81 78 81  84:2 83:2 81:2 79:2  77 82 86 82 77 82 86 89  88:4 85:2 81:2`),
  chords: [[50, 54, 57], [48, 52, 55], [43, 47, 50], [45, 49, 52], [50, 54, 57], [48, 52, 55], [46, 50, 53], [45, 49, 52]],
  leadWave: 'square', leadVol: 0.1, leadLp: 2600,
  arpWave: 'square', arpVol: 0.07, arpLp: 1800, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'pulse', bassShift: -12, bassVol: 0.55,
};

const ZENO: Song = {
  bpm: 128,
  lead: n(`74 77 81 86 85 81 77 81  82:2 81:2 77:2 74:2  79 82 86 82 79 82 86 89  88:2 85 81 76:2 73:2
           74 77 81 86 85 81 77 81  87:2 86:2 82:2 79:2  85 88 91 88 85 82 79 76  74:4 73:2 69:2`),
  chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52], [50, 53, 57], [51, 55, 58], [49, 52, 55], [45, 49, 52]],
  leadWave: 'square', leadVol: 0.1, leadLp: 2000,
  arpWave: 'square', arpVol: 0.065, arpLp: 1500, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'pulse', bassShift: -12, bassVol: 0.6, perc: 'toll',
};

const LASTFIGHT: Song = {
  bpm: 112,
  lead: n(`81:2 84 81 88:2 86 84  84:2 81:2 77 79 81:2  79:2 83 79 86:2 84 83  80:4 76:2 71:2
           69 72 76 81 84 81 76 72  74 77 81 86 89 86 81 77  76 80 83 88 86 83 80 76  81:6 r:2`),
  chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47], [45, 48, 52], [50, 53, 57], [40, 44, 47], [45, 48, 52]],
  leadWave: 'square', leadVol: 0.11, leadLp: 2400,
  arpWave: 'sawtooth', arpVol: 0.05, arpLp: 1400, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'pulse', bassShift: -12, bassVol: 0.62, perc: 'hat',
};

const VOID: Song = {
  bpm: 66,
  lead: n(`76:4 77:4  76:6 r:2  74:4 72:4  71:6 r:2  69:3 72 76:4  77:4 74:4  73:4 76:2 80:2  81:6 r:2`),
  chords: [[45, 48, 52], [41, 45, 48], [50, 53, 57], [40, 44, 47], [45, 48, 52], [50, 53, 57], [45, 49, 52], [45, 48, 52]],
  leadWave: 'triangle', leadVol: 0.14, leadLp: 2200,
  arpWave: 'sine', arpVol: 0.06, arpLp: 1800, arp: [0, 2, 1, 2], arpEvery: 2,
  bass: 'whole', bassShift: -12, bassVol: 0.3,
};

const CELLAR: Song = {
  bpm: 140,
  lead: n(`77 81 84 81 77:2 72:2  76 79 84 79 76:2 72:2  74 77 81 77 86:2 84:2  82:4 81:2 79:2
           77 81 84 89 88 84 81 84  79 84 88 84 91:2 88:2  86:2 82:2 77:2 82:2  84:6 r:2`),
  chords: [[41, 45, 48], [48, 52, 55], [50, 53, 57], [46, 50, 53], [41, 45, 48], [48, 52, 55], [46, 50, 53], [48, 52, 55]],
  leadWave: 'square', leadVol: 0.08, leadLp: 2400,
  arpWave: 'triangle', arpVol: 0.08, arpLp: 2400, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'beat', bassShift: -12, bassVol: 0.4, perc: 'hat',
};

const ENDING: Song = {
  bpm: 112,
  lead: n(`74:2 78:2 81:3 78  76:4 73:2 76:2  78:2 81:2 83:2 86:2  83:4 79:2 83:2
           81:2 78:2 74:2 78:2  79:2 83:2 86:3 83  85:2 88:2 85:2 81:2  86:6 r:2`),
  chords: [[50, 54, 57], [45, 49, 52], [47, 50, 54], [43, 47, 50], [50, 54, 57], [43, 47, 50], [45, 49, 52], [50, 54, 57]],
  leadWave: 'square', leadVol: 0.09, leadLp: 2200,
  arpWave: 'triangle', arpVol: 0.08, arpLp: 2400, arp: [0, 1, 2, 1], arpEvery: 1,
  bass: 'half', bassShift: -12, bassVol: 0.4,
};

const SONGS: Record<Exclude<Track, 'none'>, Song> = {
  tower: TOWER, mystery: MYSTERY, march: MARCH, still: STILL, gloom: GLOOM, tension: TENSION,
  princess: PRINCESS, knight: KNIGHT, zeno: ZENO, lastfight: LASTFIGHT, void: VOID, cellar: CELLAR, ending: ENDING,
};

/** 一首正在播放（或正在淡出）的曲子 */
interface Player {
  track: Exclude<Track, 'none'>;
  song: Song;
  gain: GainNode;
  timer: number;
  nextTime: number;
  leadIdx: number;
  leadLeft: number;
  step8: number;
  stopAt: number;
}

const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  ctx: AudioContext | null = null;
  private music!: GainNode;
  private sfx!: GainNode;
  private noiseBuf!: AudioBuffer;
  musicOn = true;
  sfxOn = true;
  musicVol = 0.5;
  sfxVol = 0.6;
  /** 当前目标曲目（淡入中 / 播放中） */
  track: Track = 'none';
  /** 游戏希望播放的曲目 */
  wanted: Track = 'tower';
  /** 设置里的「试听」：非 null 时覆盖 wanted */
  preview: Track | null = null;
  private players: Player[] = [];
  private lastStep = 0;
  /** 交叉淡入淡出时间常数（秒）；紧张曲切入更快 */
  fade = 0.45;
  errors = 0;

  /** 在第一次用户手势时调用（可重复调用） */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const master = this.ctx.createGain();
        master.gain.value = 0.9;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 4;
        master.connect(comp).connect(this.ctx.destination);
        this.music = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.music.connect(master);
        this.sfx.connect(master);
        this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.applyVolumes();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      this.apply();
    } catch {
      this.errors++;
    }
  }

  get state(): string {
    return this.ctx?.state ?? 'none';
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // 音乐整体偏小，音效稍大，避免刺耳
    this.music.gain.setTargetAtTime(this.musicOn ? this.musicVol * 0.22 : 0, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.sfxOn ? this.sfxVol * 0.5 : 0, t, 0.02);
  }

  /* ---------------------------------------------------------- 背景音乐 */

  setTrack(t: Track): void {
    this.wanted = t;
    this.apply();
  }

  setPreview(t: Track | null): void {
    this.preview = t;
    this.apply();
  }

  private apply(): void {
    const t = this.preview ?? this.wanted;
    if (!this.ctx || this.track === t) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const tc = t === 'tension' || this.track === 'tension' ? this.fade * 0.5 : this.fade;
    // 旧曲淡出（约 5 个时间常数后停止排程）
    for (const p of this.players) {
      if (p.stopAt) continue;
      p.gain.gain.cancelScheduledValues(now);
      p.gain.gain.setValueAtTime(p.gain.gain.value, now);
      p.gain.gain.setTargetAtTime(0, now, tc);
      p.stopAt = now + tc * 6;
    }
    this.track = t;
    if (t === 'none') return;
    // 若同一首曲子还在淡出，直接把它淡回来
    const back = this.players.find((p) => p.track === t);
    if (back) {
      back.stopAt = 0;
      back.gain.gain.cancelScheduledValues(now);
      back.gain.gain.setValueAtTime(back.gain.gain.value, now);
      back.gain.gain.setTargetAtTime(1, now, tc);
      return;
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.players.length ? 0.0001 : 1, now);
    if (this.players.length) gain.gain.setTargetAtTime(1, now + 0.05, tc);
    gain.connect(this.music);
    const p: Player = { track: t, song: SONGS[t], gain, timer: 0, nextTime: now + 0.1, leadIdx: 0, leadLeft: 0, step8: 0, stopAt: 0 };
    p.timer = window.setInterval(() => this.schedule(p), 40);
    this.players.push(p);
  }

  /** 正在发声的曲目数（交叉淡变时为 2） */
  get voices(): number {
    return this.players.length;
  }

  private retire(p: Player): void {
    window.clearInterval(p.timer);
    try {
      p.gain.disconnect();
    } catch {
      this.errors++;
    }
    this.players = this.players.filter((x) => x !== p);
  }

  private schedule(p: Player): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (p.stopAt && ctx.currentTime > p.stopAt) return this.retire(p);
    if (ctx.state !== 'running') return;
    try {
      const song = p.song;
      const e8 = 60 / song.bpm / 2;
      const out = p.gain;
      // 标签页切回时不要一次性补完积压的音符
      if (p.nextTime < ctx.currentTime - 0.3) p.nextTime = ctx.currentTime + 0.05;
      while (p.nextTime < ctx.currentTime + 0.15) {
        const t = p.nextTime;
        const bar = Math.floor(p.step8 / 8) % song.chords.length;
        const chord = song.chords[bar];
        const inBar = p.step8 % 8;
        const root = chord[0] + song.bassShift;
        // 低音：三角波
        if (song.bass === 'pulse') this.voice('triangle', freq(root + (inBar % 2 ? 12 : 0)), t, e8 * 0.8, song.bassVol, out);
        else if (song.bass === 'beat' && inBar % 2 === 0) this.voice('triangle', freq(root), t, e8 * 1.8, song.bassVol, out);
        else if (song.bass === 'half' && inBar % 4 === 0) this.voice('triangle', freq(root), t, e8 * 3.6, song.bassVol, out);
        else if (song.bass === 'whole' && inBar === 0) this.voice('triangle', freq(root), t, e8 * 7.5, song.bassVol, out);
        // 琶音（低通）
        if (inBar % song.arpEvery === 0) {
          const k = song.arp[(inBar / song.arpEvery) % song.arp.length];
          this.voice(song.arpWave, freq(chord[k] + 12), t, e8 * (song.arpEvery === 1 ? 0.7 : 1.6), song.arpVol, out, song.arpLp);
        }
        // 打击：反拍镲 / 小节首的低沉钟声
        if (song.perc === 'hat' && inBar % 2 === 1) this.noiseTo(out, t, 0.04, 0.05, 9000, 5000);
        if (song.perc === 'hat' && (inBar === 2 || inBar === 6)) this.noiseTo(out, t, 0.09, 0.12, 2500, 600);
        // 底鼓（每拍首）+ 军鼓（2、4 拍）+ 小节末的军鼓加花：第四区「远征」
        if (song.perc === 'drum') {
          if (inBar % 4 === 0) this.voice('sine', 62, t, e8 * 0.9, 0.5, out);
          if (inBar === 2 || inBar === 6) this.noiseTo(out, t, 0.12, 0.1, 3200, 900);
          if (inBar === 7 && bar % 2 === 1) this.noiseTo(out, t + e8 / 2, 0.08, 0.06, 3200, 900);
        }
        if (song.perc === 'toll' && inBar === 0) {
          this.voice('sine', freq(root), t, e8 * 6, 0.35, out);
          this.voice('sine', freq(root + 19), t, e8 * 3, 0.06, out);
        }
        // 主旋律
        if (p.leadLeft <= 0) {
          const note = song.lead[p.leadIdx % song.lead.length];
          p.leadIdx++;
          p.leadLeft = note.l;
          if (note.m >= 0) this.voice(song.leadWave, freq(note.m), t, e8 * note.l * 0.92, song.leadVol, out, song.leadLp, true);
        }
        p.leadLeft--;
        p.step8++;
        p.nextTime += e8;
      }
    } catch {
      this.errors++;
    }
  }

  private voice(type: OscillatorType, f: number, t: number, dur: number, vol: number, out: GainNode, lp = 0, vib = false): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (vib && dur > 0.3) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = f * 0.006;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t + 0.12);
      lfo.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.setTargetAtTime(vol * 0.6, t + 0.03, 0.08);
    g.gain.setTargetAtTime(0, t + dur, 0.04);
    let node: AudioNode = o;
    if (lp) {
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = lp;
      node = o.connect(f2);
    }
    node.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.25);
  }

  private noiseTo(out: GainNode, t: number, dur: number, vol: number, lp: number, hp: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    const h = ctx.createBiquadFilter();
    h.type = 'highpass';
    h.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f).connect(h).connect(g).connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /* ---------------------------------------------------------- 音效 */

  private tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(t: number, dur: number, vol: number, lp = 3000, hp = 0): void {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    let node: AudioNode = s.connect(f);
    if (hp) {
      const h = ctx.createBiquadFilter();
      h.type = 'highpass';
      h.frequency.value = hp;
      node = node.connect(h);
    }
    node.connect(g).connect(this.sfx);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  private notes(ms: number[], step: number, type: OscillatorType, vol: number, dur = step * 1.6): void {
    const t = this.ctx!.currentTime;
    ms.forEach((m, i) => this.tone(type, freq(m), freq(m), t + i * step, dur, vol));
  }

  play(s: Sfx, arg = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxOn || ctx.state !== 'running') return;
    try {
      const t = ctx.currentTime;
      switch (s) {
        case 'step': {
          const now = performance.now();
          if (now - this.lastStep < 60) return; // 瞬移 / 快速行走时限流
          this.lastStep = now;
          this.noise(t, 0.035, 0.12, 900);
          break;
        }
        case 'hit': {
          // arg = 回合数：连击几下（最多 4 下）
          const k = Math.max(1, Math.min(4, arg));
          for (let i = 0; i < k; i++) {
            this.noise(t + i * 0.07, 0.06, 0.5, 2600, 300);
            this.tone('square', 330 - i * 20, 110, t + i * 0.07, 0.06, 0.12);
          }
          break;
        }
        case 'swing': {
          const tier = Math.max(0, Math.min(5, Math.round(arg)));
          if (tier === 0) {
            // 空手：闷拳
            this.noise(t, 0.05, 0.35, 700);
            this.tone('sine', 180, 70, t, 0.07, 0.25);
            break;
          }
          // 挥剑「嗖」：高通噪声，越好的剑越亮
          this.noise(t, 0.07 + tier * 0.01, 0.18 + tier * 0.03, 7000, 1800 + tier * 300);
          // 金属「铮」
          this.tone('square', 1320 + tier * 110, 1180 + tier * 90, t + 0.02, 0.05, 0.035);
          if (tier >= 2) {
            // 银剑：第二道斩击 + 银铃泛音
            this.noise(t + 0.06, 0.06, 0.16, 8000, 2600);
            this.tone('sine', freq(96), freq(96), t + 0.05, 0.12, 0.05);
          }
          if (tier >= 3) {
            // 骑士剑：低音冲击
            this.tone('sine', 140, 50, t + 0.03, 0.18, 0.28);
          }
          if (tier >= 4) {
            // 圣剑：金色和弦琶音
            [84, 88, 91, 96].forEach((m, i) => this.tone('triangle', freq(m), freq(m), t + 0.04 + i * 0.035, 0.16, 0.06));
          }
          if (tier >= 5) {
            // 神圣剑：上行闪烁 + 光爆的厚重低音
            [96, 100, 103, 108].forEach((m, i) => this.tone('square', freq(m), freq(m + 12), t + 0.1 + i * 0.03, 0.06, 0.025));
            this.noise(t + 0.03, 0.3, 0.3, 1200);
            this.tone('sine', 90, 35, t + 0.03, 0.35, 0.3);
          }
          break;
        }
        case 'kill':
          this.tone('square', 660, 80, t + 0.05, 0.28, 0.12);
          this.noise(t + 0.05, 0.25, 0.3, 1400);
          break;
        case 'heavy':
          this.noise(t, 0.35, 0.7, 900);
          this.tone('sine', 120, 40, t, 0.35, 0.5);
          break;
        case 'door':
          this.tone('square', 220, 440, t, 0.12, 0.1);
          this.tone('square', 330, 660, t + 0.08, 0.14, 0.08);
          this.noise(t, 0.12, 0.15, 1800);
          break;
        case 'hidden':
          this.noise(t, 0.45, 0.45, 600);
          this.tone('triangle', 90, 60, t, 0.4, 0.3);
          this.notes([84, 88, 91], 0.07, 'triangle', 0.18);
          break;
        case 'item':
          this.notes([84, 91], 0.06, 'square', 0.08);
          break;
        case 'key':
          this.notes([88, 93, 96], 0.05, 'square', 0.07);
          break;
        case 'gem':
          this.notes([79, 83, 86, 91, 95], 0.045, 'triangle', 0.22);
          break;
        case 'potion':
          this.tone('sine', 400, 900, t, 0.18, 0.25);
          this.tone('sine', 600, 1300, t + 0.1, 0.16, 0.18);
          break;
        case 'equip':
          this.notes([72, 76, 79, 84, 88], 0.07, 'square', 0.08, 0.3);
          break;
        case 'buy':
          this.notes([83, 88], 0.07, 'square', 0.09, 0.25);
          this.noise(t, 0.05, 0.12, 6000, 2000);
          break;
        case 'stairs':
          this.notes(arg > 0 ? [67, 71, 74, 79] : [79, 74, 71, 67], 0.06, 'triangle', 0.25);
          break;
        case 'blip':
          this.tone('square', 880 + Math.random() * 60, 880, t, 0.025, 0.03);
          break;
        case 'error':
          this.tone('square', 180, 160, t, 0.09, 0.09);
          this.tone('square', 140, 120, t + 0.1, 0.12, 0.09);
          break;
        case 'undo':
          this.tone('triangle', 900, 300, t, 0.18, 0.25);
          this.tone('triangle', 300, 600, t + 0.16, 0.12, 0.2);
          break;
        case 'save':
          this.notes([72, 79, 84], 0.08, 'triangle', 0.25, 0.4);
          break;
      }
    } catch {
      this.errors++;
    }
  }
}
