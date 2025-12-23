
import { Game } from './types';

export const COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const DEFAULT_GAMES: Game[] = [
  { id: '1', name: 'Monopoly', color: COLORS[0] },
  { id: '2', name: 'Catan', color: COLORS[1] },
  { id: '3', name: '7 Wonders', color: COLORS[2] },
  { id: '4', name: 'Dixit', color: COLORS[3] },
  { id: '5', name: 'Uno', color: COLORS[4] },
  { id: '6', name: 'Scrabble', color: COLORS[5] },
  { id: '7', name: 'Risk', color: COLORS[6] },
  { id: '8', name: 'Carcassonne', color: COLORS[7] },
];
