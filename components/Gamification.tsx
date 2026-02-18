import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stars, Gem, Crown, Sparkles, Ghost, X, Target, Play } from "lucide-react";
import { Card, CardContent, Progress, Button } from "./ui/Common";
import { cn, playSound } from "../utils";

interface HeroArenaProps {
  level: number;
  totalXP: number;
  levelProgress: number;
  streak: number;
  combo: number;
  coins: number;
}

export function HeroArena({ level, totalXP, levelProgress, streak, combo, coins }: HeroArenaProps) {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-slate-900/80 backdrop-blur-xl">
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl"
        />
      </div>

      <CardContent className="relative z-10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
            <Crown className="h-5 w-5 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">Hero Status</h3>
          <div className="ml-auto flex items-center gap-2 text-amber-300 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-500/30">
            <Gem className="h-3.5 w-3.5" />
            <span className="text-sm font-bold">{coins}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Level</div>
            <div className="text-3xl font-black text-white">{level}</div>
            <div className="text-xs text-indigo-300">{totalXP} XP Total</div>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Combo</div>
            <div className="text-3xl font-black text-emerald-400">x{combo}</div>
            <div className="text-xs text-emerald-300">{streak} Day Streak</div>
          </div>
        </div>

        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Progress to Level {level + 1}</span>
                <span className="text-indigo-300 font-bold">{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} className="h-3 bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  );
}

const LOOT_REWARDS = [
  { label: "Momentum Burst", xp: 30, coins: 12, note: "Found extra focus points." },
  { label: "Clarity Cache", xp: 20, coins: 18, note: "Decision bonus unlocked." },
  { label: "Execution Boost", xp: 40, coins: 8, note: "Deep work power-up." },
  { label: "Recovery Pack", xp: 15, coins: 20, note: "Energy restored." },
];

export function LootSpinner({ onReward }: { onReward: (r: any) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<any>(null);

  const handleSpin = () => {
    if (spinning) return;
    playSound('click');
    setSpinning(true);
    setReward(null);
    setTimeout(() => {
        const r = LOOT_REWARDS[Math.floor(Math.random() * LOOT_REWARDS.length)];
        setReward(r);
        onReward(r);
        setSpinning(false);
        playSound('success');
    }, 1500);
  };

  return (
    <Card className="border border-amber-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80">
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h4 className="font-bold text-slate-100">Daily Loot</h4>
            </div>
            <p className="text-xs text-slate-400">Spin for XP & Coins</p>
        </div>
        
        <div className="flex flex-col items-end">
            <Button 
                onClick={handleSpin} 
                disabled={spinning}
                className={cn(
                    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-orange-900/20 border border-orange-400/20",
                    spinning && "animate-pulse cursor-wait"
                )}
            >
                {spinning ? "Spinning..." : "Spin"}
            </Button>
        </div>
      </CardContent>
      <AnimatePresence>
        {reward && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-amber-500/10 border-t border-amber-500/20"
            >
                <div className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Gem className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                        <div className="font-bold text-amber-200">{reward.label}</div>
                        <div className="text-xs text-amber-200/70">+{reward.xp} XP • +{reward.coins} Coins</div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function FocusSprint() {
    const TOTAL = 25 * 60;
    const [seconds, setSeconds] = useState(TOTAL);
    const [running, setRunning] = useState(false);
  
    useEffect(() => {
      if (!running) return;
      const t = setInterval(() => setSeconds((s) => (s <= 0 ? 0 : s - 1)), 1000);
      return () => clearInterval(t);
    }, [running]);
  
    useEffect(() => {
        if (seconds === 0) setRunning(false);
    }, [seconds]);
  
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    const progress = Math.round(((TOTAL - seconds) / TOTAL) * 100);
  
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-slate-100 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          {running && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                          <span className={cn("relative inline-flex rounded-full h-3 w-3", running ? "bg-emerald-500" : "bg-slate-500")}></span>
                        </span>
                        Focus Sprint
                    </h4>
                    <p className="text-xs text-slate-400">25 min block</p>
                </div>
                <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
                    {mm}:{ss}
                </div>
            </div>
          
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => {
                    playSound('click');
                    setRunning((v) => !v);
                }}
                variant={running ? "secondary" : "default"}
                className={cn(running ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                {running ? "Pause" : "Start"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRunning(false);
                  setSeconds(TOTAL);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

// --- Distraction Defense Engine (Canvas Version) ---

interface Entity {
    id: number;
    x: number;
    y: number;
    label: string;
    speed: number;
    radius: number;
    color: string;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export function DistractionDefense({ onComplete }: { onComplete: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  // Game loop references (mutable state that doesn't trigger re-renders)
  const gameData = useRef({
      enemies: [] as Entity[],
      particles: [] as Particle[],
      lastSpawnTime: 0,
      score: 0,
      animationFrameId: 0,
      isPlaying: false
  });

  const LABELS = ["TikTok", "Email", "Slack", "News", "Noise", "Notification", "Doubt", "Fear", "Reddit", "Text"];
  const COLORS = ["#f87171", "#fb923c", "#facc15", "#e879f9"];

  const spawnEnemy = (width: number) => {
      const radius = 25 + Math.random() * 15;
      gameData.current.enemies.push({
          id: Date.now() + Math.random(),
          x: Math.random() * (width - 100) + 50,
          y: -50,
          label: LABELS[Math.floor(Math.random() * LABELS.length)],
          speed: 1 + Math.random() * 1.5 + (gameData.current.score / 500), // Speed up as score increases
          radius,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
  };

  const createExplosion = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          const speed = Math.random() * 3 + 1;
          gameData.current.particles.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              color
          });
      }
  };

  const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvas;
      const now = performance.now();

      // Clear Screen
      ctx.clearRect(0, 0, width, height);
      
      if (!gameData.current.isPlaying) return;

      // Spawn Logic
      if (now - gameData.current.lastSpawnTime > Math.max(400, 1000 - gameData.current.score / 2)) {
          spawnEnemy(width);
          gameData.current.lastSpawnTime = now;
      }

      // Update & Draw Enemies
      gameData.current.enemies.forEach((enemy, index) => {
          enemy.y += enemy.speed;

          // Draw
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.fillStyle = enemy.color + "40"; // Transparent fill
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = enemy.color;
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(enemy.label, enemy.x, enemy.y);

          // Game Over Check
          if (enemy.y > height + enemy.radius) {
              endGame();
          }
      });

      // Update & Draw Particles
      for (let i = gameData.current.particles.length - 1; i >= 0; i--) {
          const p = gameData.current.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.02;

          if (p.life <= 0) {
              gameData.current.particles.splice(i, 1);
          } else {
              ctx.globalAlpha = p.life;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
          }
      }

      // Danger Line
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
      ctx.fillRect(0, height - 10, width, 10);

      gameData.current.animationFrameId = requestAnimationFrame(loop);
  };

  const startGame = () => {
      gameData.current = {
          enemies: [],
          particles: [],
          lastSpawnTime: performance.now(),
          score: 0,
          animationFrameId: 0,
          isPlaying: true
      };
      setScore(0);
      setGameState('playing');
      playSound('hero');
  };

  // Ensure canvas is sized correctly when game starts
  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Start loop
        if(gameData.current.isPlaying) {
            cancelAnimationFrame(gameData.current.animationFrameId);
            loop();
        }
    }
  }, [gameState]);

  const endGame = () => {
      gameData.current.isPlaying = false;
      cancelAnimationFrame(gameData.current.animationFrameId);
      setGameState('gameover');
      playSound('gameover');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!gameData.current.isPlaying) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let hit = false;

      // Iterate backwards to click top-most enemies first
      for (let i = gameData.current.enemies.length - 1; i >= 0; i--) {
          const enemy = gameData.current.enemies[i];
          const dx = x - enemy.x;
          const dy = y - enemy.y;
          if (dx * dx + dy * dy < enemy.radius * enemy.radius) {
              // Hit!
              createExplosion(enemy.x, enemy.y, enemy.color);
              gameData.current.enemies.splice(i, 1);
              gameData.current.score += 10;
              setScore(gameData.current.score);
              playSound('laser');
              hit = true;
              break; // One shot, one kill
          }
      }
      
      if (!hit) playSound('click');
  };

  // Cleanup
  useEffect(() => {
      return () => cancelAnimationFrame(gameData.current.animationFrameId);
  }, []);

  return (
    <Card className="bg-slate-900 border-indigo-500/30 overflow-hidden relative h-[500px] w-full max-w-2xl mx-auto shadow-2xl">
       {/* UI Overlay */}
       <div className="absolute top-4 left-6 z-10 pointer-events-none">
          <h3 className="font-bold flex items-center gap-2 text-white"><Target className="h-5 w-5 text-red-400" /> Distraction Defense</h3>
       </div>
       <div className="absolute top-4 right-6 z-10 pointer-events-none">
          <div className="font-mono text-3xl font-black text-emerald-400 drop-shadow-lg">{score}</div>
       </div>

       {/* Start Screen */}
       {gameState === 'start' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-900/90 backdrop-blur-sm p-6 text-center">
                <Target className="h-16 w-16 text-red-500 mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-white mb-2">Arcade Mode</h2>
                <p className="text-slate-400 mb-8 max-w-sm">Tap the floating distractions before they breach the firewall at the bottom.</p>
                <Button size="lg" onClick={startGame} className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-lg px-8 shadow-lg shadow-red-900/20 border border-red-500/30">
                    <Play className="h-5 w-5" /> Start Mission
                </Button>
           </div>
       )}

       {/* Game Over Screen */}
       {gameState === 'gameover' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-900/95 backdrop-blur-md p-6 text-center">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 mb-2">SYSTEM BREACH</h2>
                <p className="text-slate-300 mb-8 text-lg">Final Score: <span className="font-mono text-emerald-400 font-bold">{score}</span></p>
                <div className="flex gap-4">
                    <Button onClick={startGame} className="bg-slate-700 hover:bg-slate-600">Try Again</Button>
                    <Button variant="default" onClick={() => onComplete(score)} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20">Claim XP & Exit</Button>
                </div>
           </div>
       )}

       <canvas 
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20"
          onClick={handleCanvasClick}
       />
    </Card>
  );
}