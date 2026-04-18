import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Users,
  RotateCcw,
  Dice5,
  Play,
  HelpCircle,
  Star,
  Gamepad2,
  Trophy
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { useGame } from './hooks/useGame';
import { categories, characterBank } from './data/characters';
import LoginScreen from './screens/LoginScreen';

// --- COMPONENTS ---

const SlotMachine = ({ target, categoryId, onFinish }) => {
  const [names, setNames] = useState([]);

  useEffect(() => {
    const pool = categoryId === 'all'
      ? Object.values(characterBank).flat()
      : characterBank[categoryId] || characterBank['kids'];

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, 10);
    setNames([...selection, target]);

    const timer = setTimeout(() => {
      onFinish?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [target, categoryId]);

  return (
    <div className="slot-container">
      <div className="slot-list">
        {names.map((name, i) => (
          <div key={i} className="slot-item">{name}</div>
        ))}
      </div>
    </div>
  );
};

const PlayerAvatar = ({ name, colorIndex = 0, isActive }) => {
  const colors = [
    'from-rose-400 to-rose-500',
    'from-blue-400 to-blue-500',
    'from-purple-400 to-purple-500',
    'from-amber-400 to-amber-500',
    'from-emerald-400 to-emerald-500'
  ];
  const initial = (name || '?').charAt(0).toUpperCase();
  const bgGradient = colors[colorIndex % colors.length];

  return (
    <div className={`w-10 h-10 bg-gradient-to-br ${bgGradient} rounded-2xl flex items-center justify-center border-2 border-white shadow-sm transition-all duration-300 transform ${isActive ? 'scale-110 shadow-md ring-2 ring-primary/20' : ''} shrink-0`}>
      <span className="text-white font-black text-sm">{initial}</span>
    </div>
  );
};

const ScoreBoard = ({ game, isP1, p1Ready, p2Ready }) => {
  const scores = game.scores || { p1: 0, p2: 0 };
  const p1Name = game.player1_name || '👤';
  const p2Name = game.player2_name || '👤';

  const n1 = isP1 ? p1Name : p2Name;
  const n2 = isP1 ? p2Name : p1Name;
  const s1 = isP1 ? scores.p1 : scores.p2;
  const s2 = isP1 ? scores.p2 : scores.p1;
  const r1 = isP1 ? p1Ready : p2Ready;
  const r2 = isP1 ? p2Ready : p1Ready;

  return (
    <div className="w-full relative z-20 flex flex-col items-center">
      <div className="hud-card">
        {/* Lado 1 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PlayerAvatar name={n1} colorIndex={isP1 ? 0 : 1} isActive={r1} />
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-black uppercase truncate leading-none mb-1 ${r1 ? 'text-primary' : 'text-slate-400'}`}>
              {n1}
            </span>
            <span className="text-sm font-black text-rose-500 leading-none">{s1}</span>
          </div>
        </div>

        {/* Centro VS */}
        <div className="px-4">
          <motion.div
            animate={r1 && r2 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-lg font-black italic text-primary opacity-30"
          >
            VS
          </motion.div>
        </div>

        {/* Lado 2 */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
          <div className="flex flex-col min-w-0 items-end">
            <span className={`text-[10px] font-black uppercase truncate leading-none mb-1 ${r2 ? 'text-secondary' : 'text-slate-400'}`}>
              {n2}
            </span>
            <span className="text-sm font-black text-blue-500 leading-none">{s2}</span>
          </div>
          <PlayerAvatar name={n2} colorIndex={isP1 ? 1 : 0} isActive={r2} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 opacity-30 mb-6">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] font-black tracking-widest uppercase">SALA: {game.room_code}</span>
      </div>
    </div>
  );
};

export default function App() {
  const { user, game, loading, createRoom, joinRoom, exitRoom, subscribeToGame, updateGame, fetchGame } = useGame();

  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [rolling, setRolling] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [isAllMode, setIsAllMode] = useState(false);

  const sortear = (specificCat) => {
    const cat = specificCat || (isAllMode ? { id: 'all', name: '🔥 Modo Aleatório' } : activeCategory);
    const pool = cat.id === 'all'
      ? Object.values(characterBank).flat()
      : characterBank[cat.id];

    const char = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCharacter(char);
    setRolling(true);
  };

  const trocarCategoria = () => {
    const currentIndex = categories.findIndex(c => c.id === activeCategory.id);
    const nextIndex = (currentIndex + 1) % categories.length;
    setActiveCategory(categories[nextIndex]);
    setIsAllMode(false);
    sortear(categories[nextIndex]);
  };

  const modoAleatorio = () => {
    setIsAllMode(true);
    sortear({ id: 'all' });
  };

  useEffect(() => {
    if (game?.status === 'setup' && !selectedCharacter && !rolling) {
      sortear();
    }
  }, [game?.status, game?.player2_id]);

  useEffect(() => {
    if (game?.id) {
      const unsubscribe = subscribeToGame(game.id);
      return unsubscribe;
    }
  }, [game?.id]);

  const handleConfirmChoice = async () => {
    if (!selectedCharacter || !game?.id) return;

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#fb7185', '#38bdf8']
    });

    const isP1 = game.player1_id === user.id;
    const targetColumn = isP1 ? 'player2_character' : 'player1_character';

    await updateGame(game.id, { [targetColumn]: selectedCharacter });
  };

  const handleWin = async () => {
    if (!game?.id) return;

    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#8b5cf6', '#38bdf8']
    });

    window.navigator.vibrate?.([100, 50, 100]);

    const isP1 = game.player1_id === user.id;
    const currentScores = game.scores || { p1: 0, p2: 0 };
    const newScores = {
      ...currentScores,
      [isP1 ? 'p2' : 'p1']: (currentScores[isP1 ? 'p2' : 'p1'] || 0) + 1
    };

    await updateGame(game.id, {
      player1_character: null,
      player2_character: null,
      status: 'setup',
      scores: newScores
    });

    setSelectedCharacter('');
    setRolling(false);
  };

  if (loading) return <div className="child-container items-center justify-center min-h-screen"><h1 className="font-black animate-bounce text-2xl">🎈...</h1></div>;
  if (!user) return <LoginScreen />;

  // --- VIEWS ---

  const renderLobby = () => (
    <div className="child-container">
      <div className="text-center w-full py-8">
        <h1 className="text-hero">🎯 <br />Quem Sou <span className="text-primary italic">Eu?</span></h1>
        <p className="text-sub">Jogo divertido em dupla</p>

        <div className="white-card space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Seu Nome 👤"
              className="input-child text-sm"
              maxLength={12}
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <button
              onClick={async () => {
                try {
                  await createRoom(playerName);
                } catch (err) {
                  alert("Erro ao criar sala. ❌");
                }
              }}
              className="btn-puffy btn-purple"
            >
              <Users size={24} /> CRIAR SALA
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-[2px] bg-slate-50 flex-1"></div>
            <span className="text-[10px] font-black opacity-20 uppercase">OU</span>
            <div className="h-[2px] bg-slate-50 flex-1"></div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Código da Sala 🎯"
              className="input-child"
              maxLength={6}
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={async () => {
                try {
                  if (roomCode) await joinRoom(roomCode, playerName);
                } catch (err) {
                  alert(err.message || "Erro ao entrar na sala. ❌");
                }
              }}
              className={`btn-puffy btn-green ${!roomCode ? 'opacity-50' : ''}`}
            >
              <Play size={24} /> ENTRAR NA SALA
            </button>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black opacity-30 hover:opacity-100 uppercase tracking-widest">
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );

  const renderSetup = () => {
    const isP1 = game.player1_id === user.id;
    const myChoiceDone = isP1 ? !!game.player2_character : !!game.player1_character;
    const opponentChoiceDone = isP1 ? !!game.player1_character : !!game.player2_character;

    return (
      <div className="child-container">
        <ScoreBoard game={game} isP1={isP1} p1Ready={!!game.player1_character} p2Ready={!!game.player2_character} />

        <div className="text-center mb-6">
          <h2 className="text-xl font-black">🎯 Seu personagem</h2>
        </div>

        <div className="w-full">
          {!game.player2_id ? (
            <div className="white-card">
              <div className="text-5xl mb-4 animate-bounce">🎈</div>
              <h3 className="text-2xl font-black">ESPERE UM AMIGO</h3>
              <p className="text-sm opacity-50 font-bold leading-relaxed px-4 py-4">
                Passe o código <br />
                <span className="text-3xl text-primary font-black block mt-2 tracking-widest">{game.room_code}</span>
              </p>
              <button onClick={exitRoom} className="btn-puffy btn-light text-xs mt-4">CANCELAR SALA 🚪</button>
            </div>
          ) : (
            <>
              {myChoiceDone ? (
                <div className="white-card">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6">
                    <RotateCcw size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2">TUDO PRONTO! ✅</h3>
                  <p className="text-sm opacity-50 font-bold mb-8">Esperando seu amigo...</p>
                  <div className="space-y-4">
                    <button onClick={fetchGame} className="btn-puffy btn-light text-xs">ATUALIZAR STATUS 🔄</button>
                    <button onClick={exitRoom} className="btn-puffy btn-light text-xs text-rose-500">SAIR DA SALA 🚪</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="white-card">
                    <span className="badge">{isAllMode ? '🔥 MODO ALEATÓRIO' : activeCategory.name}</span>
                    {rolling ? (
                      <SlotMachine target={selectedCharacter} categoryId={isAllMode ? 'all' : activeCategory.id} onFinish={() => setRolling(false)} />
                    ) : (
                      <h3 className="text-hero text-black animate-scale-in text-4xl">{selectedCharacter}</h3>
                    )}
                    {!rolling && (
                      <button onClick={handleConfirmChoice} className="btn-puffy btn-blue mt-6 shadow-lg">ESCOLHER ESTE! 🚀</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => sortear()} className="btn-puffy btn-light text-xs"><Dice5 size={18} /> OUTRO</button>
                    <button onClick={trocarCategoria} className="btn-puffy btn-light text-xs"><RotateCcw size={18} /> LISTA</button>
                  </div>
                  <button onClick={modoAleatorio} className="btn-puffy btn-purple text-xs">🔥 MODO ALEATÓRIO TOTAL</button>
                  <button onClick={exitRoom} className="btn-puffy btn-light text-rose-500 text-sm mt-4">SAIR DA SALA 🚪</button>
                </div>
              )}
            </>
          )}

          {(myChoiceDone && opponentChoiceDone) && (
            <button onClick={() => updateGame(game.id, { status: 'playing' })} className="btn-puffy btn-green mt-6 animate-bounce shadow-xl">JOGAR AGORA! ▶️</button>
          )}
        </div>
      </div>
    );
  };

  const renderPlaying = () => {
    const isP1 = game.player1_id === user.id;
    const opponentChar = isP1 ? game.player2_character : game.player1_character;

    return (
      <div className="child-container">
        <ScoreBoard game={game} isP1={isP1} p1Ready={!!game.player1_character} p2Ready={!!game.player2_character} />

        <div className="text-center mb-6 w-full">
          <span className="badge bg-primary text-white">🎮 SEU AMIGO É...</span>
          <div className="white-card">
            <h2 className="font-black text-4xl tracking-tight">{opponentChar}</h2>
            <p className="text-[10px] font-black uppercase opacity-30 mt-2">Dê dicas para ele!</p>
          </div>
        </div>

        <div className="text-center mb-8 w-full">
          <span className="badge bg-secondary text-white">🤔 QUEM SURPRESA?</span>
          <div className="white-card py-10">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={32} className="text-slate-200 animate-pulse" />
            </div>
            <p className="text-[10px] font-black opacity-20 tracking-widest">FAÇA PERGUNTAS!</p>
          </div>
        </div>

        <div className="mt-auto w-full space-y-4">
          <button className="btn-puffy btn-purple shadow-xl" onClick={() => (confetti(), window.navigator.vibrate?.(50))}>
            <Star size={24} fill="white" className="text-white" /> TIVE UMA IDEIA!
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button className="btn-puffy btn-rose" onClick={handleWin}>ACERTOU! 🎉</button>
            <button className="btn-puffy btn-light text-xs" onClick={exitRoom}>SAIR 🚪</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={!game ? 'lobby' : game.status}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full flex justify-center"
      >
        {!game && renderLobby()}
        {game?.status === 'setup' && renderSetup()}
        {game?.status === 'playing' && renderPlaying()}
      </motion.div>
    </AnimatePresence>
  );
}
