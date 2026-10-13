export const WIDTH = 960,
  HEIGHT = 192,
  SCHEMA_VERSION = 1;
export interface Racer {
  name: string;
  reading: string;
  number: string;
  branch: string;
  cheer: string;
}
export interface Background {
  presetId: string;
  color: string;
  accent: string;
  brightness: number;
  density: number;
  direction: number;
  flipped: boolean;
  transparent: boolean;
  image?: string;
  imageX: number;
  imageY: number;
  imageScale: number;
  imageOpacity: number;
}
export interface TextStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  outerStroke: string;
  outerWidth: number;
  shadowColor: string;
  shadowAngle: number;
  shadowDistance: number;
  shadowBlur: number;
  glow: number;
  gradient: string;
  effect: string;
  letterSpacing: number;
  lineHeight: number;
  italic: boolean;
}
export interface BaseLayer {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  flipped: boolean;
}
export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  binding?: keyof Racer;
  fontFamily: string;
  fontSize: number;
  style: TextStyle;
  align: 'left' | 'center' | 'right';
}
export interface DecorationLayer extends BaseLayer {
  type: 'decoration';
  assetId: string;
  color: string;
}
export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
}
export type Layer = TextLayer | DecorationLayer | ImageLayer;
export interface CustomFont {
  family: string;
  data: string;
  name: string;
}
export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  racer: Racer;
  background: Background;
  layers: Layer[];
  customFonts: CustomFont[];
  updatedAt: string;
}
export interface Asset {
  id: string;
  name: string;
  category: string;
  variant: number;
}
export type Taste = 'かっこいい' | 'かわいい' | '和風' | '派手' | '上品' | 'おまかせ';
