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
  brush: typeof brush;
};

export default Alda;
