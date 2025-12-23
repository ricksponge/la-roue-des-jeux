
import React, { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, RotateCcw, Trophy, Gamepad2, Info, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game } from './types';
import { DEFAULT_GAMES, COLORS } from './constants';
import Wheel from './components/Wheel';

const App: React.FC = () => {
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [newGameName, setNewGameName] = useState('');
  const [winner, setWinner] = useState<Game | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playWinSound = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(440, now, 0.2);       // A4
    playNote(554.37, now + 0.15, 0.2); // C#5
    playNote(659.25, now + 0.3, 0.2);  // E5
    playNote(880, now + 0.45, 0.6);    // A5
  };

  const addGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    const newGame: Game = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGameName.trim(),
      color: COLORS[games.length % COLORS.length]
    };
    setGames([...games, newGame]);
    setNewGameName('');
  };

  const removeGame = (id: string) => {
    if (games.length <= 2) {
      alert("Il faut au moins 2 jeux pour faire tourner la roue !");
      return;
    }
    setGames(games.filter(g => g.id !== id));
  };

  const resetGames = () => {
    if (window.confirm("Réinitialiser la liste des jeux ?")) {
      setGames(DEFAULT_GAMES);
    }
  };

  const handleResult = useCallback((game: Game) => {
    setWinner(game);
    setIsSpinning(false);
    setShowModal(true);
    playWinSound();
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      colors: [game.color, '#ffffff', '#ffd700', '#f472b6']
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 selection:bg-pink-500 selection:text-white">
      {/* Animated Header */}
      <header className="text-center mb-16 relative overflow-hidden py-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-r from-transparent via-pink-500/10 to-transparent blur-3xl -z-10"></div>
        <h1 className="text-6xl md:text-9xl font-bungee leading-none tracking-tighter mb-4 animate-title">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_5px_0_rgba(0,0,0,0.4)]">LA ROUE</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x drop-shadow-[0_5px_0_rgba(0,0,0,0.4)]">DES JEUX</span>
        </h1>
        <div className="flex items-center justify-center gap-3 text-slate-400 font-bold uppercase tracking-[0.2em] text-xs md:text-sm">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Faites vos jeux, rien ne va plus !
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* Left Side: The Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[600px] mb-12 group">
            {/* Ambient Background for Wheel */}
            <div className="absolute inset-[-10%] bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
            
            <Wheel 
              items={games} 
              onResult={handleResult} 
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
            />
          </div>
          
          <button
            onClick={() => setIsSpinning(true)}
            disabled={isSpinning}
            className={`
              relative group overflow-hidden
              px-16 py-8 rounded-[2rem] font-bungee text-3xl tracking-widest transition-all transform
              ${isSpinning 
                ? 'bg-slate-800 cursor-not-allowed opacity-50 scale-95' 
                : 'bg-white text-slate-950 hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]'
              }
            `}
          >
            <span className="relative z-10">{isSpinning ? 'TOURNE...' : 'GO !'}</span>
            {!isSpinning && (
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
            {!isSpinning && (
              <span className="absolute inset-0 flex items-center justify-center group-hover:text-white transition-colors z-20 font-bungee">GO !</span>
            )}
          </button>
        </div>

        {/* Right Side: Controls & List */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/20 blur-3xl rounded-full"></div>
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black italic flex items-center gap-3 tracking-tighter">
                <Gamepad2 className="text-pink-500 w-8 h-8" /> MA LUDOTHÈQUE
              </h2>
              <button 
                onClick={resetGames}
                className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all p-3 rounded-2xl border border-white/5"
                title="Réinitialiser"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addGame} className="flex gap-3 mb-8">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Nouveau jeu..."
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-black/60 transition-all font-semibold"
              />
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:rotate-90 active:scale-90"
              >
                <Plus className="w-8 h-8" />
              </button>
            </form>

            <div className="max-h-[450px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {games.map((game, idx) => (
                <div 
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group animate-slide-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-5 h-5 rounded-lg shadow-lg rotate-3" 
                      style={{ backgroundColor: game.color }}
                    ></div>
                    <span className="font-bold text-lg text-slate-200">{game.name}</span>
                  </div>
                  <button
                    onClick={() => removeGame(game.id)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 flex gap-4 items-center">
             <div className="bg-blue-500 p-3 rounded-2xl">
               <Info className="text-white w-6 h-6" />
             </div>
             <p className="text-sm text-blue-200/80 leading-relaxed font-medium">
               Vous pouvez ajouter tous vos jeux préférés. La roue s'adapte automatiquement à votre liste !
             </p>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showModal && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-4 border-white/10 p-12 rounded-[50px] max-w-md w-full text-center shadow-[0_0_100px_rgba(236,72,153,0.4)] animate-pop relative overflow-hidden">
            {/* Background sparkle effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="inline-block p-6 bg-yellow-400 rounded-[30px] mb-8 animate-bounce shadow-[0_10px_30px_rgba(250,204,21,0.4)]">
                <Trophy className="w-16 h-16 text-slate-900" />
              </div>
              <h3 className="text-pink-500 uppercase tracking-[0.3em] text-sm font-black mb-4">C'EST DÉCIDÉ !</h3>
              <div className="text-5xl font-bungee text-white mb-10 leading-tight">
                {winner.name}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-6 bg-white text-slate-950 hover:bg-pink-500 hover:text-white rounded-3xl font-bungee text-xl transition-all transform active:scale-95 shadow-2xl"
              >
                AU TRAVAIL !
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { 
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; } 
          100% { transform: scale(1) rotate(0); opacity: 1; } 
        }
        @keyframes slide-in {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes title-anim {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-pop { animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-slide-in { animation: slide-in 0.4s ease-out forwards; }
        .animate-title { animation: title-anim 1s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); background-clip: content-box; }
      `}</style>
    </div>
  );
};

export default App;
