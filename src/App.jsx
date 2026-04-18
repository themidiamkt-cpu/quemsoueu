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

// --- DECORATIVE COMPONENTS ---

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
    <div className="slot-container mb-4">
      <div className="slot-list">
        {names.map((name, i) => (
          <div key={i} className="slot-item">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoreBoard = ({ game, isP1 }) => {
  const scores = game.scores || { p1: 0, p2: 0 };
  const p1Name = game.player1_name || 'Jogador 1';
  const p2Name = game.player2_name || 'Jogador 2';

  return (
    <div className="bg-white rounded-2xl shadow-puffy border-2 border-slate-100 flex overflow-hidden mb-6 relative z-10 mx-2">
      <div className="flex-1 py-4 px-2 text-center border-r border-slate-50 min-w-0">
        <div className="text-[10px] font-black text-slate-400 uppercase truncate px-1">
          {isP1 ? p1Name : p2Name}
        </div>
        <div className="text-3xl font-black text-primary leading-none mt-1">
          {isP1 ? scores.p1 : scores.p2}
        </div>
      </div>
      <div className="flex-1 py-4 px-2 text-center min-w-0">
        <div className="text-3xl font-black text-secondary leading-none">
          {isP1 ? scores.p2 : scores.p1}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase truncate px-1 mt-1">
          {isP1 ? p2Name : p1Name}
        </div>
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

    // Confetti de vitória!
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#8b5cf6', '#38bdf8']
    });

    // Feedback tátil
    window.navigator.vibrate?.([100, 50, 100]);

    const isP1 = game.player1_id === user.id;
    const currentScores = game.scores || { p1: 0, p2: 0 };
    const newScores = {
      ...currentScores,
      [isP1 ? 'p2' : 'p1']: (currentScores[isP1 ? 'p2' : 'p1'] || 0) + 1
    };

    // Reset game but keep scores
    await updateGame(game.id, {
      player1_character: null,
      player2_character: null,
      status: 'setup',
      scores: newScores
    });

    // Reset local state
    setSelectedCharacter('');
    setRolling(false);
  };

  if (loading) return <div className="child-container items-center justify-center"><h1 className="text-black font-black animate-bounce text-3xl">🎈...</h1></div>;
  if (!user) return <LoginScreen />;

  // --- VIEWS ---

  const renderLobby = () => (
    <div className="child-container">

      <div className="text-center relative z-10">
        <h1 className="text-hero text-black">
          🎯 <br />
          Quem Sou <span className="text-primary italic">Eu?</span>
        </h1>
        <p className="text-sub">Jogo divertido em dupla</p>

        <div className="white-card space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Seu Nome 👤"
              className="input-child h-14 text-sm"
              maxLength={12}
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <button
              onClick={async () => {
                try {
                  await createRoom(playerName);
                } catch (err) {
                  alert("Erro ao criar sala. Verifique se o banco de dados está atualizado! ❌");
                  console.error(err);
                }
              }}
              className="btn-puffy btn-purple text-white"
            >
              <Users size={28} /> CRIAR SALA
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-[2px] bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-black opacity-20">OU</span>
            <div className="h-[2px] bg-slate-100 flex-1"></div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Digite o código 🎯"
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
                  console.error(err);
                }
              }}
              className={`btn-puffy btn-green text-white transition-opacity ${!roomCode ? 'opacity-50' : ''}`}
            >
              <Play size={28} /> ENTRAR
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
        <ScoreBoard game={game} isP1={isP1} />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-xl font-black text-black">🎯 Seu personagem</h2>
          <div className="text-right">
            <p className="text-[10px] font-black opacity-30 uppercase">SALA</p>
            <p className="text-sm font-black text-primary">{game.room_code}</p>
          </div>
        </div>

        <div className="relative z-10">
          {!game.player2_id ? (
            <div className="white-card">
              <div className="text-6xl mb-4 animate-bounce">🎈</div>
              <h3 className="text-2xl font-black text-black">ESPERE UM AMIGO</h3>
              <p className="text-sm text-black opacity-50 font-bold leading-relaxed px-4 py-4">
                Passe o código <br />
                <span className="text-3xl text-primary font-black block mt-2">{game.room_code}</span>
              </p>
              <button onClick={exitRoom} className="btn-puffy btn-light text-xs mt-4">
                CANCELAR SALA 🚪
              </button>
            </div>
          ) : (
            <>
              {myChoiceDone ? (
                <div className="white-card animate-slide-up">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6">
                    <RotateCcw size={40} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-black uppercase">TUDO PRONTO! ✅</h3>
                  <p className="text-sm text-black opacity-50 font-bold mb-8">Agora espere seu amigo escolher o seu personagem...</p>

                  <div className="space-y-4">
                    <button onClick={fetchGame} className="btn-puffy btn-light text-xs">ATUALIZAR STATUS 🔄</button>
                    <button onClick={exitRoom} className="btn-puffy btn-light text-xs text-rose-500">SAIR DA SALA 🚪</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="white-card">
                    <div>
                      <span className="badge">{isAllMode ? '🔥 MODO ALEATÓRIO' : activeCategory.name}</span>
                      {rolling ? (
                        <SlotMachine
                          target={selectedCharacter}
                          categoryId={isAllMode ? 'all' : activeCategory.id}
                          onFinish={() => setRolling(false)}
                        />
                      ) : (
                        <h3 className="text-hero text-black animate-scale-in text-4xl">{selectedCharacter}</h3>
                      )}
                    </div>

                    {!rolling && (
                      <button onClick={handleConfirmChoice} className="btn-puffy btn-blue text-white mt-4">
                        ESCOLHER ESTE! 🚀
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => sortear()} className="btn-puffy btn-light text-xs">
                      <Dice5 size={18} /> OUTRO
                    </button>
                    <button onClick={trocarCategoria} className="btn-puffy btn-light text-xs">
                      <RotateCcw size={18} /> LISTA
                    </button>
                  </div>

                  <button onClick={modoAleatorio} className="btn-puffy btn-purple text-white text-xs">
                    🔥 MODO ALEATÓRIO TOTAL
                  </button>

                  <div className="pt-6 border-t border-slate-50 mt-6">
                    <button onClick={exitRoom} className="btn-puffy btn-light text-rose-500 text-sm">
                      SAIR DA SALA 🚪
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {(myChoiceDone && opponentChoiceDone) && (
            <button onClick={() => updateGame(game.id, { status: 'playing' })} className="btn-puffy btn-green text-white mt-6 animate-bounce">
              JOGAR AGORA! ▶️
            </button>
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
        <ScoreBoard game={game} isP1={isP1} />

        <div className="text-center mb-6 relative z-10">
          <span className="badge bg-primary text-white">🎮 SEU AMIGO É...</span>
          <div className="white-card">
            <h2 className="text-black font-black text-4xl tracking-tight">{opponentChar}</h2>
            <p className="text-[10px] font-black uppercase opacity-40 mt-2">Dê dicas para ele!</p>
          </div>
        </div>

        <div className="text-center mb-8 relative z-10">
          <span className="badge bg-secondary text-white">🤔 QUEM SURPRESA?</span>
          <div className="white-card py-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={40} className="text-slate-300 animate-pulse" />
            </div>
            <p className="text-xs font-black text-black opacity-30 tracking-[0.2em]">FAÇA PERGUNTAS!</p>
          </div>
        </div>

        <div className="mt-auto space-y-4 relative z-10">
          <button className="btn-puffy btn-purple text-white shadow-xl" onClick={() => (confetti(), window.navigator.vibrate?.(50))}>
            <Star size={24} fill="white" /> TIVE UMA IDEIA!
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button className="btn-puffy btn-rose text-white h-16" onClick={handleWin}>
              ACERTOU! 🎉
            </button>
            <button className="btn-puffy btn-light h-16 text-xs" onClick={exitRoom}>
              SAIR 🚪
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={!game ? 'lobby' : game.status}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="w-full flex justify-center"
      >
        {!game && renderLobby()}
        {game?.status === 'setup' && renderSetup()}
        {game?.status === 'playing' && renderPlaying()}
      </motion.div>
    </AnimatePresence>
  );
}
