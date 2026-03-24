// @alphatype/alda-js — TypeScript definitions
// Alda Format v0.1

export type PointType = 'move' | 'line' | 'curve';
export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
export type FxType = 'warp' | 'outline' | 'shadow' | 'roughen' | 'union';
export type AnimatableProperty =
  | 'stroke_progress'
  | 'brush.rx' | 'brush.ry' | 'brush.angle'
  | 'opacity'
  | 'offset.x' | 'offset.y';

export interface AldaPoint {
  x: number;
  y: number;
  type: PointType;
  cp1?: { x: number; y: number };
  cp2?: { x: number; y: number };
}

export interface AldaStroke {
  id: string;
  points: AldaPoint[];
  closed?: boolean;
  width_profile?: number[];
}

export interface AldaBrush {
  rx: number;
  ry: number;
  angle: number;
  roundness?: number;
}

export interface AldaAnchor {
  x: number;
  y: number;
}

export interface AldaGlyph {
  unicode: string;
  name?: string;
  advance: number;
  skeleton: AldaStroke[];
  brush?: AldaBrush;
  anchors?: {
    entry?: AldaAnchor;
    exit?: AldaAnchor;
    top?: AldaAnchor;
    bottom?: AldaAnchor;
    [key: string]: AldaAnchor | undefined;
  };
}

export interface AldaKeyframe {
  t: number;        // 0..1
  value: number;
  easing?: EasingType;
}

export interface AldaTrack {
  target: string;             // stroke id or glyph unicode
  property: AnimatableProperty;
  keyframes: AldaKeyframe[];
}

export interface AldaAnimation {
  id: string;
  label?: string;
  duration: number;
  loop?: boolean;
  tracks: AldaTrack[];
}

export interface AldaFx {
  id: string;
  type: FxType;
  enabled: boolean;
  params?: Record<string, number | string | boolean>;
}

export interface AldaMeta {
  name: string;
  upm: number;
  ascender: number;
  descender: number;
  version?: string;
  author?: string;
  license?: string;
  created?: string;
}

export interface AldaDocument {
  alda: string;
  meta: AldaMeta;
  glyphs?: AldaGlyph[];
  animations?: AldaAnimation[];
  fx?: AldaFx[];
}

export declare class AldaFont {
  readonly version: string;
  readonly meta: AldaMeta;
  readonly glyphs: AldaGlyph[];
  readonly animations: AldaAnimation[];
  readonly fx: AldaFx[];

  getGlyph(unicode: string): AldaGlyph | null;
  getGlyphByChar(char: string): AldaGlyph | null;
  getAnimation(id: string): AldaAnimation | null;
  getEnabledFx(): AldaFx[];
  toJSON(): string;
}

// ── Renderer ─────────────────────────────────────────────────

export interface RenderOpts {
  fontSize?: number;
  x?: number;
  y?: number;
  color?: string;
  letterSpacing?: number;
}

export interface LayoutItem {
  glyph: AldaGlyph | null;
  char: string;
  ox: number;
}

/** Render all glyphs of `text` at full (static) display. */
export declare function renderText(
  ctx: CanvasRenderingContext2D,
  font: AldaFont,
  text: string,
  opts?: RenderOpts,
): void;

/** Render with per-stroke progress values (for animation). */
export declare function renderFrame(
  ctx: CanvasRenderingContext2D,
  font: AldaFont,
  text: string,
  strokeProgress: Record<string, number>,
  opts?: RenderOpts,
): void;

/** Resolve glyphs and compute X positions. */
export declare function buildLayout(
  font: AldaFont,
  text: string,
  fontSize: number,
): LayoutItem[];

export declare function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: AldaStroke,
  progress: number,
  brush: AldaBrush,
  opts: { upm: number; fontSize: number; ox: number; baseline: number; color?: string },
): void;

export declare function sampleStroke(
  stroke: AldaStroke,
  upm: number,
  fontSize: number,
  ox: number,
  baseline: number,
): { pts: Array<{x: number; y: number}>; arcLen: number[]; total: number };

// ── Player ───────────────────────────────────────────────────

export interface PlayerOpts extends RenderOpts {
  loop?: boolean;
  onEnd?: () => void;
  onFrame?: (t: number) => void;
}

export declare class AldaPlayer {
  readonly currentTime: number;
  readonly playing: boolean;

  play(): this;
  pause(): this;
  stop(): this;
  seek(t: number): this;
  dispose(): void;
}

export declare function createPlayer(
  ctx: CanvasRenderingContext2D,
  font: AldaFont,
  text: string,
  animation: string | AldaAnimation,
  opts?: PlayerOpts,
): AldaPlayer;

export declare function buildStrokeProgress(
  animation: AldaAnimation,
  t: number,
): Record<string, number>;

export declare function interpolateKeyframes(
  keyframes: AldaKeyframe[],
  t: number,
): number;

// ── Brush ────────────────────────────────────────────────────

export declare const brush: {
  computeS(rx: number, ry: number): number;
  computeRy(S: number, rx: number): number;
  computeRoundness(rx: number, ry: number): number;
  scale(brush: AldaBrush, factor: number): AldaBrush;
  normalize(brush?: Partial<AldaBrush>): AldaBrush;
};

/**
 * Parse an Alda JSON string or plain object into an AldaFont.
 * Throws TypeError if the document is structurally invalid.
 */
export declare function load(jsonStringOrObject: string | AldaDocument): AldaFont;

/**
 * Returns true if the given value is a valid Alda document.
 */
export declare function isValid(data: unknown): boolean;

declare const Alda: {
  load: typeof load;
  isValid: typeof isValid;
  renderText: typeof renderText;
  renderFrame: typeof renderFrame;
  buildLayout: typeof buildLayout;
  drawStroke: typeof drawStroke;
  sampleStroke: typeof sampleStroke;
  createPlayer: typeof createPlayer;
  buildStrokeProgress: typeof buildStrokeProgress;
  interpolateKeyframes: typeof interpolateKeyframes;
  brush: typeof brush;
};

export default Alda;
