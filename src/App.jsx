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
import { categories, characterBank, faceCharacters } from './data/characters';
import LoginScreen from './screens/LoginScreen';
import './App.css';

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
  const gradients = [
    'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
    'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  ];
  const initial = (name || '?').charAt(0).toUpperCase();
  const bgGradient = gradients[colorIndex % gradients.length];

  return (
    <div
      className={`avatar ${isActive ? 'active' : ''}`}
      style={{
        background: bgGradient,
        width: '40px',
        height: '40px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}
    >
      <span style={{ color: 'white', fontWeight: 900, fontSize: '0.8rem' }}>{initial}</span>
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
    <div style={{ width: '100%', position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="hud-card" style={{ marginBottom: '8px' }}>
        {/* Lado 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <PlayerAvatar name={n1} colorIndex={isP1 ? 0 : 1} isActive={r1} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: r1 ? 'var(--primary)' : '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {n1}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#f43f5e', lineHeight: 1 }}>{s1}</span>
          </div>
        </div>

        {/* Centro VS */}
        <div style={{ padding: '0 8px' }}>
          <motion.div
            animate={r1 && r2 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{ fontSize: '14px', fontWeight: 900, fontStyle: 'italic', color: 'var(--primary)', opacity: 0.3 }}
          >
            VS
          </motion.div>
        </div>

        {/* Lado 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, justifyContent: 'flex-end', textAlign: 'right' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, alignItems: 'flex-end' }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: r2 ? 'var(--secondary)' : '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {n2}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{s2}</span>
          </div>
          <PlayerAvatar name={n2} colorIndex={isP1 ? 1 : 0} isActive={r2} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.3, marginBottom: '12px' }}>
        <div style={{ width: '4px', height: '4px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>SALA: {game.room_code}</span>
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
  const [selectedGameType, setSelectedGameType] = useState(null);

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

  // Auto-disconnect effect
  useEffect(() => {
    if (game?.status === 'cancelled') {
      alert("A sala foi cancelada pelo mestre. 🚪");
      exitRoom();
    }
    // If playing and partner is gone
    if (game?.status === 'playing') {
      const partnerGone = game.player2_id === null; // Handled by exitRoom in useGame
      if (partnerGone) {
        alert("Seu parceiro saiu da sala. 🚪");
        exitRoom();
      }
    }
  }, [game?.status, game?.player2_id]);

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

  if (loading) return (
    <div className="child-container" style={{ justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900 }} className="animate-bounce">🎈...</h1>
    </div>
  );

  if (!user) return <LoginScreen />;

  // --- VIEWS ---

  const renderGameSelection = () => (
    <div className="child-container">
      <div style={{ textAlign: 'center', width: '100%', padding: '20px 0' }}>
        <h1 className="text-hero" style={{ fontSize: '1.75rem' }}>🎮 <br />Escolha o <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Jogo</span></h1>
        <p className="text-sub" style={{ marginBottom: '24px' }}>Qual você quer jogar hoje?</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px' }}>
          <button
            onClick={() => setSelectedGameType('guess')}
            className="white-card"
            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '1rem' }}
          >
            <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1rem' }}>Quem Sou Eu?</h3>
              <p style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700 }}>Adivinhe o personagem na sua testa!</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGameType('memory')}
            className="white-card"
            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '1rem' }}
          >
            <div style={{ width: '40px', height: '40px', background: 'var(--secondary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', flexShrink: 0 }}>
              <Gamepad2 size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1rem' }}>Jogo da Memória</h3>
              <p style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700 }}>Encontre os pares de personagens!</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedGameType('cara-a-cara')}
            className="white-card"
            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '1rem' }}
          >
            <div style={{ width: '40px', height: '40px', background: 'var(--mint-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint)', flexShrink: 0 }}>
              <Users size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1rem' }}>Cara a Cara</h3>
              <p style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700 }}>Adivinhe quem é o outro!</p>
            </div>
          </button>
        </div>

        <div style={{ marginTop: '32px' }}>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '10px', fontWeight: 900, opacity: 0.3, textTransform: 'uppercase', letterSpacing: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="child-container">
      <div style={{ textAlign: 'center', width: '100%', padding: '20px 0' }}>
        <button onClick={() => setSelectedGameType(null)} style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '9px', fontWeight: 900, opacity: 0.3, textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Voltar
        </button>
        <h1 className="text-hero" style={{ fontSize: '1.75rem' }}>
          {selectedGameType === 'guess' ? '🎯' : selectedGameType === 'memory' ? '🃏' : '🎭'} <br />
          {selectedGameType === 'guess' ? 'Quem Sou ' : selectedGameType === 'memory' ? 'Jogo da ' : 'Cara a '}
          <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>{selectedGameType === 'guess' ? 'Eu?' : selectedGameType === 'memory' ? 'Memória' : 'Cara'}</span>
        </h1>
        <p className="text-sub" style={{ marginBottom: '16px' }}>
          {selectedGameType === 'guess' ? 'Jogo divertido em dupla' :
            selectedGameType === 'memory' ? 'Treine sua mente em dupla' :
              'Adivinhe quem seu amigo é!'}
        </p>

        <div className="white-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Seu Nome 👤"
              className="input-child"
              style={{ fontSize: '0.9rem' }}
              maxLength={12}
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <button
              onClick={async () => {
                try {
                  await createRoom(playerName, selectedGameType);
                } catch (err) {
                  alert("Erro ao criar sala: " + (err.message || "Erro desconhecido") + " ❌");
                }
              }}
              className={`btn-puffy ${selectedGameType === 'guess' ? 'btn-purple' : 'btn-blue'}`}
            >
              <Users size={24} /> CRIAR SALA
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ height: '2px', background: '#f1f5f9', flex: 1 }}></div>
            <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase' }}>OU</span>
            <div style={{ height: '2px', background: '#f1f5f9', flex: 1 }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>🎯 Seu personagem</h2>
        </div>

        <div style={{ width: '100%' }}>
          {!game.player2_id ? (
            <div className="white-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }} className="animate-bounce">🎈</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>ESPERE UM AMIGO</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700, lineHeight: 1.4, padding: '12px 0' }}>
                Passe o código <br />
                <span style={{ fontSize: '1.75rem', color: 'var(--primary)', fontWeight: 900, display: 'block', marginTop: '4px', letterSpacing: '2px' }}>{game.room_code}</span>
              </p>
              <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.75rem', marginTop: '12px', height: '48px' }}>CANCELAR SALA 🚪</button>
            </div>
          ) : (
            <>
              {myChoiceDone ? (
                <div className="white-card" style={{ textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }} className="animate-pulse">
                    <RotateCcw size={32} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>TUDO PRONTO! ✅</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.5, fontWeight: 700, marginBottom: '32px' }}>Esperando seu amigo...</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button onClick={fetchGame} className="btn-puffy btn-light" style={{ fontSize: '0.75rem' }}>ATUALIZAR STATUS 🔄</button>
                    <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.75rem', color: '#f43f5e' }}>SAIR DA SALA 🚪</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="white-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                    <span className="badge" style={{ marginBottom: '0.5rem' }}>{isAllMode ? '🔥 MODO ALEATÓRIO' : activeCategory.name}</span>
                    {rolling ? (
                      <SlotMachine target={selectedCharacter} categoryId={isAllMode ? 'all' : activeCategory.id} onFinish={() => setRolling(false)} />
                    ) : (
                      <h3 className="text-hero" style={{ color: 'black', fontSize: '2rem', margin: '0.5rem 0' }}>{selectedCharacter}</h3>
                    )}
                    {!rolling && (
                      <button onClick={handleConfirmChoice} className="btn-puffy btn-blue" style={{ marginTop: '16px', height: '54px', boxShadow: '0 8px 12px -3px rgba(0,0,0,0.1)' }}>ESCOLHER! 🚀</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => sortear()} className="btn-puffy btn-light" style={{ fontSize: '0.7rem', height: '44px' }}><Dice5 size={16} /> OUTRO</button>
                    <button onClick={trocarCategoria} className="btn-puffy btn-light" style={{ fontSize: '0.7rem', height: '44px' }}><RotateCcw size={16} /> LISTA</button>
                  </div>
                  <button onClick={modoAleatorio} className="btn-puffy btn-purple" style={{ fontSize: '0.7rem', height: '44px', marginTop: '8px' }}>🔥 ALEATÓRIO TOTAL</button>
                  <button onClick={exitRoom} className="btn-puffy btn-light" style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '12px', height: '44px', background: 'none', boxShadow: 'none' }}>SAIR 🚪</button>
                </div>
              )}
            </>
          )}

          {(myChoiceDone && opponentChoiceDone) && (
            <button onClick={() => updateGame(game.id, { status: 'playing' })} className="btn-puffy btn-green" style={{ marginTop: '24px', animation: 'bounce 2s infinite' }}>JOGAR AGORA! ▶️</button>
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

        <div style={{ textAlign: 'center', marginBottom: '16px', width: '100%' }}>
          <span className="badge" style={{ background: 'var(--primary)', color: 'white', marginBottom: '0.5rem' }}>🎮 SEU AMIGO É...</span>
          <div className="white-card" style={{ padding: '1rem' }}>
            <h2 style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.025em' }}>{opponentChar}</h2>
            <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.3, marginTop: '4px' }}>Dê dicas para ele!</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px', width: '100%' }}>
          <span className="badge" style={{ background: 'var(--secondary)', color: 'white', marginBottom: '0.5rem' }}>🤔 QUEM SURPRESA?</span>
          <div className="white-card" style={{ padding: '20px 0' }}>
            <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <HelpCircle size={28} style={{ color: '#e2e8f0' }} className="animate-pulse" />
            </div>
            <p style={{ fontSize: '9px', fontWeight: 900, opacity: 0.2, letterSpacing: '2px' }}>FAÇA PERGUNTAS!</p>
          </div>
        </div>

        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-puffy btn-purple" style={{ height: '54px', boxShadow: '0 12px 16px -4px rgba(0,0,0,0.1)' }} onClick={() => (confetti(), window.navigator.vibrate?.(50))}>
            <Star size={20} fill="white" style={{ color: 'white' }} /> TIVE UMA IDEIA!
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button className="btn-puffy btn-rose" style={{ height: '54px' }} onClick={handleWin}>ACERTOU! 🎉</button>
            <button className="btn-puffy btn-light" style={{ fontSize: '0.75rem', height: '54px' }} onClick={exitRoom}>SAIR 🚪</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={!game ? (selectedGameType ? 'lobby' : 'selection') : game.status}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        {!game && (
          !selectedGameType ? renderGameSelection() : renderLobby()
        )}
        {game?.status === 'setup' && (
          game.game_type === 'memory' ? <MemoryGameSetup game={game} user={user} exitRoom={exitRoom} /> :
            game.game_type === 'cara-a-cara' ? <CaraACaraSetup game={game} user={user} exitRoom={exitRoom} /> :
              renderSetup()
        )}

        {game?.status === 'playing' && (
          game.game_type === 'memory' ? <MemoryGame game={game} user={user} exitRoom={exitRoom} /> :
            game.game_type === 'cara-a-cara' ? <CaraACaraGame game={game} user={user} exitRoom={exitRoom} /> :
              renderPlaying()
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// --- CARA A CARA COMPONENTS ---

const CaraACaraSetup = ({ game, user, exitRoom }) => {
  const { updateGame } = useGame();

  const handleStart = async () => {
    try {
      // Pick 24 characters (max available)
      const shuffled = [...faceCharacters].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 24);

      const p1Secret = selected[Math.floor(Math.random() * selected.length)];
      const p2Secret = selected[Math.floor(Math.random() * selected.length)];

      await updateGame(game.id, {
        status: 'playing',
        board_state: {
          characters: selected,
          p1_secret: p1Secret,
          p2_secret: p2Secret,
          p1_eliminated: [],
          p2_eliminated: [],
          p1_question: null,
          p2_question: null,
          waiting_for_answer: false,
          is_kids_mode: isKidsMode,
          last_answer: null // { attribute: 'oculos', value: true, result: true }
        },
        current_turn: 'p1'
      });
    } catch (err) {
      console.error("Erro ao iniciar jogo:", err);
      alert("Erro ao iniciar o jogo! ❌");
    }
  };

  return (
    <div className="child-container">
      <div className="white-card shadow-lg" style={{ maxWidth: '400px', textAlign: 'center', padding: '1.5rem 1rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🎭</div>
        <h2 className="text-hero" style={{ fontSize: '1.5rem' }}>CARA A CARA</h2>
        <p className="text-sub" style={{ marginBottom: '12px' }}>Adivinhe o personagem do seu amigo!</p>

        {!game.player2_id ? (
          <div style={{ marginTop: '12px' }}>
            <div className="room-code-box" onClick={() => navigator.clipboard.writeText(game.room_code)} style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.6rem', opacity: 0.4, display: 'block', fontWeight: 900 }}>CÓDIGO DA SALA</span>
              <span className="text-hero" style={{ color: 'var(--primary)', letterSpacing: '4px', fontSize: '2.5rem' }}>{game.room_code}</span>
              <span className="copy-hint text-primary">COPIAR 📋</span>
            </div>
            <p className="text-sub" style={{ marginTop: '10px' }}>Aguardando seu amigo entrar...</p>
            <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.7rem', marginTop: '12px', height: '48px' }}>CANCELAR SALA 🚪</button>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <div style={{
              background: '#f0fdf4',
              color: '#16a34a',
              padding: '12px 24px',
              borderRadius: '20px',
              fontWeight: 900,
              fontSize: '0.8rem',
              border: '2px solid #dcfce7',
              marginBottom: '24px'
            }}>
              AMIGO CONECTADO! ✅
            </div>

            {game.player1_id === user.id ? (
              <div style={{ marginTop: '24px' }}>

                <button onClick={handleStart} className="btn-puffy btn-green">
                  COMEÇAR AGORA! 🚀
                </button>
              </div>
            ) : (
              <div style={{ padding: '30px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '5px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 15px' }} className="animate-spin"></div>
                <p className="text-sub">O MESTRE ESTÁ PREPARANDO...</p>
              </div>
            )}
            <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.875rem', marginTop: '16px', background: 'transparent', boxShadow: 'none', color: '#94a3b8' }}>SAIR DA SALA</button>
          </div>
        )}
      </div>
    </div>
  );
};

const CaraACaraGame = ({ game, user, exitRoom }) => {
  const { updateGame } = useGame();
  const isP1 = game.player1_id === user.id;
  const myTurn = (game.current_turn === 'p1' && isP1) || (game.current_turn === 'p2' && !isP1);
  const mySecret = isP1 ? game.board_state?.p1_secret : game.board_state?.p2_secret;
  const board = game.board_state?.characters || [];
  const myEliminations = isP1 ? (game.board_state?.p1_eliminated || []) : (game.board_state?.p2_eliminated || []);
  const waitingForAnswer = game.board_state?.waiting_for_answer;
  const currentQuestionData = isP1 ? game.board_state?.p2_question : game.board_state?.p1_question;
  const isKidsMode = game.board_state?.is_kids_mode;
  const lastAnswer = game.board_state?.last_answer;

  const [isChoosingGuess, setIsChoosingGuess] = useState(false);
  const [freeQuestion, setFreeQuestion] = useState('');

  const toggleEliminate = (name) => {
    if (isChoosingGuess) {
      handleGuess(name);
      return;
    }
    const newList = myEliminations.includes(name)
      ? myEliminations.filter(n => n !== name)
      : [...myEliminations, name];

    const key = isP1 ? 'p1_eliminated' : 'p2_eliminated';
    updateGame(game.id, {
      board_state: { ...game.board_state, [key]: newList }
    });
  };

  const handleAsk = async (questionObj) => {
    if (!myTurn || waitingForAnswer) return;
    const key = isP1 ? 'p1_question' : 'p2_question';
    await updateGame(game.id, {
      board_state: {
        ...game.board_state,
        [key]: questionObj,
        waiting_for_answer: true,
        last_answer: null // Clear previous suggestion when asking new one
      }
    });
  };

  const handleAnswer = async (result) => {
    if (myTurn || !waitingForAnswer) return;
    const question = isP1 ? game.board_state.p2_question : game.board_state.p1_question;

    await updateGame(game.id, {
      current_turn: game.current_turn === 'p1' ? 'p2' : 'p1',
      board_state: {
        ...game.board_state,
        p1_question: null,
        p2_question: null,
        waiting_for_answer: false,
        last_answer: { ...question, result }
      }
    });
  };

  const handleBatchEliminate = async () => {
    if (!lastAnswer) return;
    const toEliminate = board
      .filter(char => {
        if (myEliminations.includes(char.name)) return false;
        const suggestion = getSuggestion(char);
        return suggestion === 'eliminate';
      })
      .map(c => c.name);

    if (toEliminate.length === 0) return;

    const newList = [...myEliminations, ...toEliminate];
    const key = isP1 ? 'p1_eliminated' : 'p2_eliminated';
    await updateGame(game.id, {
      board_state: { ...game.board_state, [key]: newList }
    });
  };

  const handleGuess = async (name) => {
    const opponentSecret = isP1 ? game.board_state?.p2_secret : game.board_state?.p1_secret;
    if (name === opponentSecret.name) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      alert(`🎉 PARABÉNS! Você acertou! O personagem era ${name}!`);
      const newScores = { ...game.scores };
      newScores[isP1 ? 'p1' : 'p2'] += 1;
      await updateGame(game.id, {
        status: 'setup',
        scores: newScores,
        board_state: {}
      });
    } else {
      alert(`❌ QUE PENA! Não era o ${name}. Perdeu a vez!`);
      setIsChoosingGuess(false);
      await updateGame(game.id, {
        current_turn: game.current_turn === 'p1' ? 'p2' : 'p1',
        board_state: { ...game.board_state, waiting_for_answer: false, last_answer: null }
      });
    }
  };

  const getSuggestion = (char) => {
    if (!lastAnswer || myTurn) return null; // Only show suggestions if it's NOT my turn (meaning I just got the answer)
    // Wait, if it's NOT my turn now, it means it WAS my turn when I asked.
    // So if game.current_turn !== my role, then I'm the one who should see the suggestions.
    const wasMyTurn = (game.current_turn === 'p1' && !isP1) || (game.current_turn === 'p2' && isP1);
    if (!wasMyTurn) return null;

    const { attribute, value, result } = lastAnswer;
    const hasAttr = char[attribute] === value;
    if (result === true) {
      return hasAttr ? 'keep' : 'eliminate';
    } else {
      return hasAttr ? 'eliminate' : 'keep';
    }
  };

  const questions = [
    { attribute: 'oculos', value: true, label: '👓 Óculos?', emoji: '👓' },
    { attribute: 'genero', value: 'masculino', label: '👨 Homem?', emoji: '👨' },
    { attribute: 'genero', value: 'feminino', label: '👩 Mulher?', emoji: '👩' },
    { attribute: 'chapeu', value: true, label: '🎩 Chapéu?', emoji: '🎩' },
  ];

  if (!isKidsMode) {
    questions.push(
  const suggestionCount = board.filter(c => !myEliminations.includes(c.name) && getSuggestion(c) === 'eliminate').length;

    return (
      <div className="child-container">
        <ScoreBoard game={game} isP1={isP1} p1Ready={true} p2Ready={true} />

        <div className="secret-card-meta">
          <div style={{ fontSize: '2rem' }}>{mySecret?.avatar}</div>
          <div>
            <p className="secret-label">SEU PERSONAGEM SECRETO:</p>
            <p className="secret-name">{mySecret?.name}</p>
          </div>
        </div>

        <div className={`turn-badge ${myTurn ? 'active' : 'waiting'}`} style={{ marginBottom: '8px' }}>
          {myTurn ? '👉 SEU TURNO! PERGUNTE 👀' : '⌛ ESPERE O AMIGO...'}
        </div>

        {waitingForAnswer && (
          <div className="answer-box-meta">
            {myTurn ? (
              <p className="text-sub">VOCÊ PERGUNTOU: <br /><strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{isP1 ? game.board_state.p1_question?.label : game.board_state.p2_question?.label}</strong><br />Aguardando...</p>
            ) : (
              <div>
                <p className="text-sub">ELE PERGUNTOU: <br /><strong style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>{currentQuestionData?.label}</strong></p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => handleAnswer(true)} className="btn-puffy btn-green" style={{ flex: 1 }}>SIM ✅</button>
                  <button onClick={() => handleAnswer(false)} className="btn-puffy btn-rose" style={{ flex: 1 }}>NÃO ❌</button>
                </div>
              </div>
            )}
          </div>
        )}

        {suggestionCount > 0 && !myTurn && (
          <div className="suggestion-panel animate-pulse">
            <p style={{ fontWeight: 900, color: 'white', fontSize: '0.8rem' }}>💡 VOCÊ PODE ELIMINAR {suggestionCount} PERSONAGENS!</p>
            <button onClick={handleBatchEliminate} className="btn-puffy btn-white" style={{ scale: '0.8', marginTop: '4px' }}>ELIMINAR SUGERIDOS 🪄</button>
          </div>
        )}

        {isChoosingGuess && (
          <div className="guess-hint">
            👉 TOQUE NO PERSONAGEM FINAL!
          </div>
        )}

        <div className="face-grid-meta">
          {board.map((char, i) => {
            const suggestion = getSuggestion(char);
            const eliminated = myEliminations.includes(char.name);
            return (
              <div
                key={i}
                className={`face-card-meta ${eliminated ? 'eliminated' : ''} ${suggestion === 'eliminate' ? 'suggest-red' : suggestion === 'keep' ? 'suggest-green' : ''} ${isChoosingGuess ? 'pulse' : ''}`}
                onClick={() => toggleEliminate(char.name)}
              >
                <div className="face-avatar">{char.avatar}</div>
                <div className="face-name">{char.name}</div>
                {suggestion === 'eliminate' && !eliminated && <div className="suggestion-badge">❌</div>}
                {suggestion === 'keep' && !eliminated && <div className="suggestion-badge-keep">✅</div>}
              </div>
            );
          })}
        </div>

        <div className="question-panel-meta">
          {myTurn && !waitingForAnswer && !isChoosingGuess && (
            <div className="btn-grid-questions">
              {questions.map((q, idx) => (
                <button key={idx} onClick={() => handleAsk(q)} className="quick-btn-meta">
                  {q.label}
                </button>
              ))}
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="text"
                  className="input-child-mini"
                  placeholder="Pergunta livre..."
                  value={freeQuestion}
                  onChange={e => setFreeQuestion(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && freeQuestion.trim() && handleAsk({ attribute: 'custom', value: freeQuestion, label: `❓ ${freeQuestion}` })}
                />
                <button
                  onClick={() => freeQuestion.trim() && handleAsk({ attribute: 'custom', value: freeQuestion, label: `❓ ${freeQuestion}` })}
                  className="btn-puffy btn-blue"
                  style={{ width: '44px', height: '36px', padding: 0 }}
                >🚀</button>
              </div>
            </div>
          )}

          {isChoosingGuess ? (
            <button className="btn-puffy btn-light" onClick={() => setIsChoosingGuess(false)}>CANCELAR ↩️</button>
          ) : (
            <button
              className="btn-puffy btn-purple"
              disabled={!myTurn || waitingForAnswer}
              style={{ opacity: (!myTurn || waitingForAnswer) ? 0.5 : 1, width: '100%' }}
              onClick={() => setIsChoosingGuess(true)}
            >
              👉 ACHO QUE É...
            </button>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => {
              const key = isP1 ? 'p1_eliminated' : 'p2_eliminated';
              updateGame(game.id, { board_state: { ...game.board_state, [key]: [] } });
            }} className="btn-puffy btn-light" style={{ fontSize: '0.6rem', color: '#94a3b8' }}>RESETAR 🔄</button>
            <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.6rem', color: '#f43f5e' }}>SAIR 🚪</button>
          </div>
        </div>
      </div>
    );
  };


  // --- MEMORY GAME COMPONENTS ---

  const animalEmojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐙', '🦖'];
  const foodEmojis = ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🥘', '🍲', '🍱', '🍣', '🍛', '🍜', '🍜', '🍝', '🍦', '🍩', '🍪', '🍫'];
  const mixEmojis = ['🚀', '⚡', '🌈', '💎', '🔥', '🎨', '🎬', '🎮', '🎧', '🎸', '⚽', '🏀', '🏆', '🎩', '🧤', '🍭', '🍔', '🍦', '🚗', '🛸'];

  const getCharacterContent = (content) => {
    if (!content) return { emoji: null, name: '' };
    // In Memory Game, content is already the emoji string from the pools
    return { emoji: content, name: '' };
  };

  const MemoryGameSetup = ({ game, user, exitRoom }) => {
    const { updateGame } = useGame();
    const [selectedCategory, setSelectedCategory] = useState('animals');

    const handleCopy = () => {
      navigator.clipboard.writeText(game.room_code);
      confetti({ particleCount: 40, spread: 30, origin: { y: 0.8 } });
    };

    const handleStart = async () => {
      try {
        let pool;
        if (selectedCategory === 'animals') pool = animalEmojis;
        else if (selectedCategory === 'food') pool = foodEmojis;
        else pool = mixEmojis;

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        const cards = [...selected, ...selected]
          .sort(() => 0.5 - Math.random())
          .map((content, index) => ({
            id: index,
            content: content,
            flipped: false,
            matched: false
          }));

        await updateGame(game.id, {
          status: 'playing',
          board_state: { cards },
          current_turn: 'p1',
          turn_start_at: new Date().toISOString()
        });
      } catch (err) {
        console.error("Erro ao iniciar jogo:", err);
        alert("Erro ao iniciar o jogo! Verifique se seu banco de dados está atualizado (veja o arquivo SQL). ❌\n\nErro: " + (err.message || err));
      }
    };

    return (
      <div className="child-container">
        <div className="white-card shadow-lg" style={{ maxWidth: '400px', textAlign: 'center', padding: '1.5rem 1rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🃏</div>
          <h2 className="text-hero" style={{ fontSize: '1.5rem' }}>JOGO DA MEMÓRIA</h2>
          <p className="text-sub" style={{ marginBottom: '12px' }}>Treine seu cérebro em dupla!</p>

          {!game.player2_id ? (
            <div style={{ marginTop: '12px' }}>
              <div className="room-code-box" onClick={handleCopy} style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.5rem', opacity: 0.4, display: 'block', fontWeight: 900 }}>TOQUE PARA COPIAR O CÓDIGO</span>
                <span className="text-hero" style={{ color: 'var(--primary)', letterSpacing: '4px', fontSize: '2.5rem' }}>{game.room_code}</span>
                <span className="copy-hint text-primary">COPIAR 📋</span>
              </div>
              <p className="text-sub" style={{ marginTop: '10px' }}>O jogo começará assim que seu amigo entrar.</p>
              <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.7rem', marginTop: '12px', height: '44px' }}>CANCELAR SALA 🚪</button>
            </div>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '12px 24px',
                borderRadius: '20px',
                fontWeight: 900,
                fontSize: '0.8rem',
                border: '2px solid #dcfce7',
                marginBottom: '24px'
              }}>
                AMIGO CONECTADO! ✅
              </div>

              {game.player1_id === user.id ? (
                <div style={{ marginTop: '24px' }}>
                  <div className="category-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <button onClick={() => setSelectedCategory('animals')} className={`cat-btn ${selectedCategory === 'animals' ? 'active' : ''}`}>
                      <span style={{ fontSize: '1.5rem', display: 'block' }}>🐯</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>ANIMAIS</span>
                    </button>
                    <button onClick={() => setSelectedCategory('food')} className={`cat-btn ${selectedCategory === 'food' ? 'active' : ''}`}>
                      <span style={{ fontSize: '1.5rem', display: 'block' }}>🍕</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>COMIDA</span>
                    </button>
                    <button onClick={() => setSelectedCategory('mix')} className={`cat-btn ${selectedCategory === 'mix' ? 'active' : ''}`}>
                      <span style={{ fontSize: '1.5rem', display: 'block' }}>🚀</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>MIX</span>
                    </button>
                  </div>
                  <button onClick={handleStart} className="btn-puffy btn-green animate-bounce-slow">
                    COMEÇAR AGORA! 🚀
                  </button>
                </div>
              ) : (
                <div style={{ padding: '30px 0' }}>
                  <div style={{ width: '40px', height: '40px', border: '5px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 15px' }} className="animate-spin"></div>
                  <p className="text-sub">O MESTRE ESTÁ ESCOLHENDO...</p>
                </div>
              )}
              <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.875rem', marginTop: '16px', background: 'transparent', boxShadow: 'none', color: '#94a3b8' }}>SAIR DA SALA</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MemoryGame = ({ game, user, exitRoom }) => {
    const { updateGame } = useGame();
    const isP1 = game.player1_id === user.id;
    const myTurn = (game.current_turn === 'p1' && isP1) || (game.current_turn === 'p2' && !isP1);
    const cards = game.board_state?.cards || [];

    const [timeLeft, setTimeLeft] = useState(15);
    const turnDuration = 15; // seconds

    useEffect(() => {
      // Reset timer when turn changes
      setTimeLeft(turnDuration);
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            handleTimeOut();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    }, [game.current_turn]);

    const handleTimeOut = async () => {
      if (myTurn) {
        await updateGame(game.id, {
          current_turn: game.current_turn === 'p1' ? 'p2' : 'p1'
        });
      }
    };

    const handleFlip = async (index) => {
      if (!myTurn || cards[index].flipped || cards[index].matched) return;

      const totalFlipped = cards.filter(c => c.flipped && !c.matched).length;
      if (totalFlipped >= 2) return;

      const newCards = [...cards];
      newCards[index].flipped = true;

      // Simple audio feedback via Web Audio API
      const playNote = (freq, type = 'sine') => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.2);
        } catch (e) { }
      };

      playNote(440);

      const flippedIndices = newCards.map((c, i) => c.flipped && !c.matched ? i : -1).filter(i => i !== -1);

      if (flippedIndices.length === 2) {
        const [idx1, idx2] = flippedIndices;
        if (newCards[idx1].content === newCards[idx2].content) {
          newCards[idx1].matched = true;
          newCards[idx2].matched = true;
          playNote(880, 'triangle');

          const allMatched = newCards.every(c => c.matched);
          const newScores = { ...game.scores };
          newScores[game.current_turn] = (newScores[game.current_turn] || 0) + 1;

          await updateGame(game.id, {
            board_state: { cards: newCards },
            scores: newScores,
            status: allMatched ? 'setup' : 'playing'
          });

          if (allMatched) {
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
          }
        } else {
          await updateGame(game.id, { board_state: { cards: newCards } });
          setTimeout(async () => {
            const resetCards = [...newCards];
            resetCards[idx1].flipped = false;
            resetCards[idx2].flipped = false;
            await updateGame(game.id, {
              board_state: { cards: resetCards },
              current_turn: game.current_turn === 'p1' ? 'p2' : 'p1'
            });
          }, 1000);
        }
      } else {
        await updateGame(game.id, { board_state: { cards: newCards } });
      }
    };

    const matchedCount = cards.filter(c => c.matched).length / 2;
    const totalPairs = cards.length / 2;
    const progressPercent = (matchedCount / (totalPairs || 1)) * 100;

    return (
      <div className="child-container">
        <ScoreBoard game={game} isP1={isP1} p1Ready={true} p2Ready={true} />

        <div className={`turn-badge ${myTurn ? 'active' : 'waiting'}`}>
          {myTurn ? '👉 SEU TURNO! 👀' : '⌛ ESPERE O AMIGO...'}
        </div>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="timer-container">
            <div
              className="timer-progress"
              style={{ width: `${(timeLeft / turnDuration) * 100}%`, backgroundColor: timeLeft < 3 ? 'var(--secondary)' : 'var(--mint)' }}
            ></div>
          </div>
        </div>

        <div className="memory-grid">
          {cards.map((card, i) => (
            <div key={i} className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''}`} onClick={() => handleFlip(i)}>
              <div className="card-inner">
                <div className="card-front">
                  <HelpCircle size={32} className="card-front-icon" />
                </div>
                <div className={`card-back ${card.matched ? 'matched' : ''}`}>
                  {getCharacterContent(card.content).emoji ? (
                    <span className="card-emoji">{getCharacterContent(card.content).emoji}</span>
                  ) : null}
                  <span className="card-name" style={{ fontSize: getCharacterContent(card.content).emoji ? '0.5rem' : '0.75rem' }}>
                    {card.content}
                  </span>
                  {card.matched && <div className="match-check"><Star size={12} fill="white" /></div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overall-progress" style={{ marginTop: '16px' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8' }}>{matchedCount} DE {totalPairs} PARES ENCONTRADOS</span>
          <div className="progress-track" style={{ height: '4px' }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div style={{ padding: '20px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <button onClick={exitRoom} className="btn-puffy btn-light" style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'transparent', border: 'none', boxShadow: 'none' }}>SAIR DO JOGO 🚪</button>
        </div>
      </div>
    );
  };
