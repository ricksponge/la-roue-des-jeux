
export interface Game {
  id: string;
  name: string;
  color: string;
}

export interface WheelProps {
  items: Game[];
  onResult: (item: Game) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}
