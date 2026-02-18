import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Shield,
  Target,
  Flame,
  Rocket,
  Sun,
  Moon,
  Zap,
  LayoutDashboard,
  ListTodo,
  BookOpen,
  CalendarDays,
  HeartPulse,
  PartyPopper,
  Wand2,
  Brain,
  Sparkles,
  Loader2,
  ImageIcon,
  Gamepad2,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
} from "recharts";
import { uid, todayISO, startOfWeekISO, seedFromISO, computeWeekDates, formatISOToLabel, prettyDow, cn, playSound, initAudio } from "./utils";
import { DayRecord, LifeState, Habit } from "./types";
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent, Badge, Slider, Switch, Progress } from "./components/ui/Common";
import { HeroArena, LootSpinner, FocusSprint, DistractionDefense } from "./components/Gamification";
import { breakDownTask, getJournalInsights, generateVisionImage } from "./ai";

const LS_KEY = "lifeos_v02";
const THEMES = ["sunrise", "ocean", "midnight"] as const;

const DAILY_MISSIONS = [
  "Ship one uncomfortable task before noon.",
  "Protect a 25-minute focus sprint.",
  "Do one values-first action.",
  "Close one mental loop.",
  "Turn one vague task into a step.",
  "Say no to one distraction.",
];

const DEFAULTS: LifeState = {
  meta: {
    name: "User",
    version: "2.0",
    createdAt: new Date().toISOString(),
    bonusXP: 0,
    coins: 0,
  },
  values: [
    { id: uid(), label: "Growth", why: "Stagnation is death.", proof: "Read or practice daily." },
    { id: uid(), label: "Health", why: "Foundation of everything.", proof: "Move and sleep well." },
  ],
  principles: [
    { id: uid(), label: "Bias for Action", note: "Do it now." },
    { id: uid(), label: "Simplicity", note: "Less is more." },
  ],
  filters: [
    { id: uid(), key: "Impact", prompt: "Does this move the needle?" },
    { id: uid(), key: "Joy", prompt: "Does this bring energy?" },
  ],
  routines: {
    dailyAnchors: [],
    weekly: { planning: { day: "Sunday", minutes: 30 }, review: { day: "Friday", minutes: 15 } },
  },
  habits: [
    { id: uid(), name: "Deep Work", trigger: "Morning coffee", tinyAction: "Open editor", reward: "Music", type: "minutes", targetMinutes: 60 },
    { id: uid(), name: "Read", trigger: "Bedtime", tinyAction: "1 page", reward: "Sleep", type: "yesno" },
  ],
  productivity: { oneThing: "", listA: [], listB: [], inbox: [], calendarRule: "Schedule it." },
  emotions: { tools: [], checkin: { hunger: 5, anger: 0, lonely: 0, tired: 0, note: "" } },
  goals: { identity: "", outcomes: [], processes: [] },
  tracking: { days: {}, weekStartISO: startOfWeekISO() },
};

function loadState(): LifeState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export default function App() {
  const [state, setState] = useState<LifeState>(() => loadState());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("midnight");
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateMsg, setCelebrateMsg] = useState("");
  const [missionIndex, setMissionIndex] = useState(() => seedFromISO(todayISO()) % DAILY_MISSIONS.length);

  // AI States
  const [enhancingTaskIndex, setEnhancingTaskIndex] = useState<number | null>(null);
  const [analyzingJournal, setAnalyzingJournal] = useState(false);
  const [journalInsight, setJournalInsight] = useState<string | null>(null);
  
  // Image Gen States
  const [generatingImage, setGeneratingImage] = useState(false);
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [missionImage, setMissionImage] = useState<string | null>(null);

  // Game States
  const [showArcade, setShowArcade] = useState(false);

  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(state)), [state]);
  
  // Ensure Audio Context is ready on mount/click
  useEffect(() => {
     const unlockAudio = () => initAudio();
     document.addEventListener('click', unlockAudio, { once: true });
     return () => document.removeEventListener('click', unlockAudio);
  }, []);

  const today = todayISO();
  const day = state.tracking.days[today] || {
    oneThingDone: false,
    consistency: 5,
    output: 5,
    notes: "",
    habit: {},
    oneThing: state.productivity.oneThing || "",
  };

  const streak = useMemo(() => {
    let s = 0;
    const current = new Date(today + "T00:00:00");
    while (true) {
      const tz = current.getTimezoneOffset() * 60000;
      const iso = new Date(current.getTime() - tz).toISOString().slice(0, 10);
      const rec = state.tracking.days[iso];
      if (!rec?.oneThingDone && (rec?.consistency || 0) < 6) break;
      s++;
      current.setDate(current.getDate() - 1);
    }
    return s;
  }, [state.tracking.days, today]);

  const habitCompletionToday = useMemo(() => {
    if (state.habits.length === 0) return 0;
    const doneCount = state.habits.filter(h => {
        const r = day.habit?.[h.id];
        if (!r) return false;
        return h.type === "yesno" ? !!r.done : (r.minutes || 0) >= (h.targetMinutes || 0);
    }).length;
    return Math.round((doneCount / state.habits.length) * 100);
  }, [state.habits, day.habit]);

  const xp = useMemo(() => {
    const base = (Object.values(state.tracking.days) as DayRecord[]).reduce((acc, rec) => 
        acc + (rec.oneThingDone ? 40 : 0) + (rec.consistency || 0) * 2, 0);
    return base + (state.meta.bonusXP || 0);
  }, [state.tracking.days, state.meta.bonusXP]);
  
  const level = Math.floor(xp / 250) + 1;
  const levelProgress = Math.round(((xp % 250) / 250) * 100);

  const setDayPatch = (patch: Partial<DayRecord>) => {
    setState(s => {
        const prev = s.tracking.days[today] || { consistency: 5, output: 5, habit: {} };
        const next = { ...prev, ...patch };
        if (!prev.oneThingDone && next.oneThingDone) triggerCelebrate("One Thing Completed!");
        return { ...s, tracking: { ...s.tracking, days: { ...s.tracking.days, [today]: next as DayRecord } } };
    });
  };

  const triggerCelebrate = (msg: string) => {
    playSound('success');
    setCelebrateMsg(msg);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2000);
  };

  const handleLoot = (reward: any) => {
    setState(s => ({
        ...s,
        meta: { ...s.meta, bonusXP: s.meta.bonusXP + reward.xp, coins: s.meta.coins + reward.coins }
    }));
    triggerCelebrate(`+${reward.xp} XP | +${reward.coins} Coins`);
  };

  const handleTaskEnhancement = async (index: number) => {
    const task = state.productivity.inbox[index];
    if (!task) return;
    playSound('click');
    setEnhancingTaskIndex(index);
    try {
      const subtasks = await breakDownTask(task);
      setState(s => {
        const newInbox = [...s.productivity.inbox];
        // Remove original, add subtasks
        newInbox.splice(index, 1, ...subtasks);
        return { ...s, productivity: { ...s.productivity, inbox: newInbox } };
      });
      triggerCelebrate("Task Broken Down!");
    } finally {
      setEnhancingTaskIndex(null);
    }
  };

  const handleJournalAnalysis = async () => {
    playSound('click');
    setAnalyzingJournal(true);
    setJournalInsight(null);
    try {
      const insight = await getJournalInsights(day.notes, day.consistency, day.output);
      setJournalInsight(insight);
      triggerCelebrate("Insight Received");
    } finally {
      setAnalyzingJournal(false);
    }
  };

  const handleGenerateVision = async (type: 'onething' | 'mission', text: string) => {
    if(!text) return;
    playSound('click');
    setGeneratingImage(true);
    try {
        const img = await generateVisionImage(text);
        if(img) {
            if(type === 'onething') setVisionImage(img);
            if(type === 'mission') setMissionImage(img);
            triggerCelebrate("Vision Generated");
        }
    } finally {
        setGeneratingImage(false);
    }
  };

  const handleGameComplete = (score: number) => {
      const xpGain = Math.floor(score / 5);
      if(xpGain > 0) {
          handleLoot({ xp: xpGain, coins: Math.floor(xpGain/2) });
      }
      setShowArcade(false);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "habits", label: "Habits", icon: Flame },
    { id: "productivity", label: "Focus", icon: Zap },
    { id: "journal", label: "Journal", icon: BookOpen },
  ];

  const currentMission = DAILY_MISSIONS[missionIndex];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 via-white to-cyan-200 bg-clip-text text-transparent flex items-center gap-2">
                    <Rocket className="h-6 w-6 text-indigo-400" />
                    LifeOS <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">v{state.meta.version}</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">Design your life, execute your day.</p>
            </div>
            <div className="flex items-center gap-3">
                 <Button size="sm" variant="glass" className="gap-2 text-indigo-300 border-indigo-500/30" onClick={() => setShowArcade(true)}>
                    <Gamepad2 className="h-4 w-4" /> Focus Arcade
                 </Button>
                 <div className="hidden md:flex bg-slate-800/50 backdrop-blur rounded-full p-1 border border-slate-700/50">
                    {THEMES.map(t => (
                        <button key={t} onClick={() => {
                            playSound('click');
                            setTheme(t);
                        }} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all", theme === t ? "bg-indigo-500 text-white shadow-lg" : "text-slate-400 hover:text-white")}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                 </div>
            </div>
        </header>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <HeroArena level={level} totalXP={xp} levelProgress={levelProgress} streak={streak} combo={streak > 3 ? 2 : 1} coins={state.meta.coins} />
            </div>
            <div className="space-y-6">
                <LootSpinner onReward={handleLoot} />
                <FocusSprint />
            </div>
        </div>

        {/* Navigation */}
        <div className="sticky top-4 z-50 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-2xl flex overflow-x-auto gap-2 no-scrollbar">
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => {
                        playSound('hover');
                        setActiveTab(t.id);
                    }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === t.id 
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                </button>
            ))}
        </div>

        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === "dashboard" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Daily Mission */}
                        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden group">
                             {missionImage && (
                                <div className="absolute inset-0 z-0">
                                    <img src={missionImage} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                                </div>
                             )}
                             <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-indigo-400" /> 
                                    Daily Mission
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="relative z-10">
                                <div className="text-lg font-medium text-slate-200 mb-4 p-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-700 backdrop-blur-sm">
                                    "{currentMission}"
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button 
                                        variant={day.missionDone ? "secondary" : "default"}
                                        className={cn(day.missionDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-indigo-600")}
                                        onClick={() => {
                                            if(!day.missionDone) handleLoot({ xp: 50, coins: 25 });
                                            setDayPatch({ missionDone: true });
                                        }}
                                        disabled={!!day.missionDone}
                                    >
                                        {day.missionDone ? "Mission Complete" : "Complete Mission"}
                                    </Button>
                                    <Button variant="ghost" onClick={() => {
                                        playSound('click');
                                        setMissionIndex(i => (i + 1) % DAILY_MISSIONS.length);
                                    }}>Swap Mission</Button>
                                    
                                    {!missionImage && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="ml-auto text-slate-400 hover:text-indigo-400"
                                            onClick={() => handleGenerateVision('mission', currentMission)}
                                            disabled={generatingImage}
                                            title="Visualize this mission"
                                        >
                                            {generatingImage ? <Loader2 className="h-4 w-4 animate-spin"/> : <ImageIcon className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                             </CardContent>
                        </Card>

                        {/* One Thing */}
                        <Card className="col-span-1 lg:col-span-1">
                             <CardHeader><CardTitle>The One Thing</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                <Input 
                                    value={day.oneThing} 
                                    onChange={(e) => setDayPatch({ oneThing: e.target.value })}
                                    placeholder="Most important task..."
                                    className="bg-slate-950/50 border-slate-700"
                                />
                                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                    <span className="text-sm text-slate-400">Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-sm font-bold", day.oneThingDone ? "text-emerald-400" : "text-amber-400")}>
                                            {day.oneThingDone ? "DONE" : "PENDING"}
                                        </span>
                                        <Switch 
                                            checked={!!day.oneThingDone} 
                                            onCheckedChange={(c) => {
                                                if(c) playSound('success');
                                                setDayPatch({ oneThingDone: c });
                                            }} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="relative group">
                                    {visionImage ? (
                                        <div className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video group shadow-lg">
                                            <img src={visionImage} alt="Goal Vision" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button size="sm" variant="secondary" onClick={() => setVisionImage(null)}>Clear Vision</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-dashed border-slate-700 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50"
                                            onClick={() => handleGenerateVision('onething', day.oneThing)}
                                            disabled={generatingImage || !day.oneThing}
                                        >
                                            {generatingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                                            {generatingImage ? "Dreaming..." : "Visualize Success (AI)"}
                                        </Button>
                                    )}
                                </div>
                             </CardContent>
                        </Card>
                        
                        {/* Quick Stats */}
                        <Card className="col-span-1 md:col-span-3">
                            <CardHeader><CardTitle>Weekly Pulse</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={computeWeekDates(state.tracking.weekStartISO).map(d => ({
                                        name: formatISOToLabel(d),
                                        c: state.tracking.days[d]?.consistency || 0,
                                        o: state.tracking.days[d]?.output || 0
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                                        <ReTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                                        <Line type="monotone" dataKey="c" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} activeDot={{r: 6}} />
                                        <Line type="monotone" dataKey="o" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {activeTab === "habits" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.habits.map(h => {
                             const rec = day.habit[h.id] || {};
                             const done = !!rec.done;
                             const progress = h.type === 'minutes' ? Math.min(100, ((rec.minutes || 0) / (h.targetMinutes || 1)) * 100) : (done ? 100 : 0);
                             
                             return (
                                <Card key={h.id} className="group hover:border-indigo-500/50 transition-colors">
                                    <CardContent className="p-6 flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={progress >= 100 ? "success" : "default"}>{h.type === 'yesno' ? 'Check-in' : `${h.targetMinutes}m Goal`}</Badge>
                                                <span className="text-xs text-slate-500">{h.trigger}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{h.name}</h3>
                                            <p className="text-sm text-slate-400">{h.tinyAction}</p>
                                            
                                            {h.type === 'minutes' && (
                                                <div className="pt-2 space-y-2">
                                                    <div className="flex justify-between text-xs text-slate-400">
                                                        <span>{rec.minutes || 0}m completed</span>
                                                        <span>{Math.round(progress)}%</span>
                                                    </div>
                                                    <Progress value={progress} />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => {
                                                            playSound('click');
                                                            const nm = (rec.minutes || 0) + 15;
                                                            setState(s => ({ ...s, tracking: { ...s.tracking, days: { ...s.tracking.days, [today]: { ...day, habit: { ...day.habit, [h.id]: { ...rec, minutes: nm } } } } } }));
                                                        }}>+15m</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => {
                                                            playSound('click');
                                                            const nm = Math.max(0, (rec.minutes || 0) - 15);
                                                            setState(s => ({ ...s, tracking: { ...s.tracking, days: { ...s.tracking.days, [today]: { ...day, habit: { ...day.habit, [h.id]: { ...rec, minutes: nm } } } } } }));
                                                        }}>-15m</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {h.type === 'yesno' && (
                                            <button 
                                                onClick={() => {
                                                    playSound(done ? 'click' : 'success');
                                                    setState(s => ({ ...s, tracking: { ...s.tracking, days: { ...s.tracking.days, [today]: { ...day, habit: { ...day.habit, [h.id]: { ...rec, done: !done } } } } } }));
                                                    if(!done) triggerCelebrate("Habit Done!");
                                                }}
                                                className={cn(
                                                    "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all",
                                                    done ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "border-slate-700 text-slate-700 hover:border-slate-500 hover:text-slate-500"
                                                )}
                                            >
                                                <CheckCircle2 className="h-6 w-6" />
                                            </button>
                                        )}
                                    </CardContent>
                                </Card>
                             );
                        })}
                    </div>
                )}
                {activeTab === "productivity" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><ListTodo className="h-5 w-5"/> Inbox</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input placeholder="Capture task..." id="inboxInput" onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if(val) setState(s => ({ ...s, productivity: { ...s.productivity, inbox: [...s.productivity.inbox, val] } }));
                                            e.currentTarget.value = "";
                                            playSound('click');
                                        }
                                    }} />
                                    <Button onClick={() => {
                                        const el = document.getElementById('inboxInput') as HTMLInputElement;
                                        if(el.value) {
                                            setState(s => ({ ...s, productivity: { ...s.productivity, inbox: [...s.productivity.inbox, el.value] } }));
                                            el.value = "";
                                            playSound('click');
                                        }
                                    }}>+</Button>
                                </div>
                                <div className="space-y-2">
                                    {state.productivity.inbox.map((t, i) => (
                                        <div key={i} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center group">
                                            <span>{t}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleTaskEnhancement(i)}
                                                    disabled={enhancingTaskIndex === i}
                                                    className="p-1 rounded hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 transition-colors"
                                                    title="Break down with AI"
                                                >
                                                    {enhancingTaskIndex === i ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Wand2 className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        playSound('click');
                                                        setState(s => ({ ...s, productivity: { ...s.productivity, inbox: s.productivity.inbox.filter((_, idx) => idx !== i) } }))
                                                    }}
                                                    className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {state.productivity.inbox.length === 0 && <div className="text-center text-slate-500 py-4">Inbox zero. Nice.</div>}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="space-y-6">
                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-l-4 border-l-indigo-500">
                                <CardHeader><CardTitle>List A (Must Do)</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {state.productivity.listA.map((t, i) => (
                                         <div key={i} className="flex gap-2"><div className="h-6 w-6 rounded border border-indigo-500/50 flex items-center justify-center text-xs text-indigo-400 font-mono">{i+1}</div> {t}</div>
                                    ))}
                                    <Input 
                                        placeholder="Add A-List Item..." 
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter') {
                                                const val = e.currentTarget.value;
                                                if(val) {
                                                    setState(s => ({ ...s, productivity: { ...s.productivity, listA: [...s.productivity.listA, val] } }));
                                                    e.currentTarget.value = "";
                                                    playSound('click');
                                                }
                                            }
                                        }}
                                        className="bg-transparent border-none placeholder:text-slate-600 focus:ring-0 px-0"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
                {activeTab === "journal" && (
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Daily Reflection</CardTitle>
                            <Button 
                                variant="glass" 
                                size="sm" 
                                className="gap-2 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/20"
                                onClick={handleJournalAnalysis}
                                disabled={analyzingJournal}
                            >
                                {analyzingJournal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                                {analyzingJournal ? "Analyzing..." : "Get AI Coach Insight"}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             {/* AI Insight Result */}
                             <AnimatePresence>
                                {journalInsight && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm uppercase tracking-wider">
                                                <Sparkles className="h-4 w-4" /> Coach Feedback
                                            </div>
                                            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                                {/* Simple formatting for lines */}
                                                {journalInsight.split('\n').map((line, i) => (
                                                    <p key={i} className="mb-1 leading-relaxed">{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Consistency Score (0-10)</label>
                                <div className="flex items-center gap-4">
                                    <Slider 
                                        value={[day.consistency]} 
                                        max={10} step={1} 
                                        onValueChange={(v) => {
                                            setDayPatch({ consistency: v[0] });
                                        }} 
                                    />
                                    <span className="font-mono text-xl font-bold text-indigo-400 w-8">{day.consistency}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Output Score (0-10)</label>
                                <div className="flex items-center gap-4">
                                    <Slider 
                                        value={[day.output]} 
                                        max={10} step={1} 
                                        onValueChange={(v) => {
                                            setDayPatch({ output: v[0] });
                                        }} 
                                    />
                                    <span className="font-mono text-xl font-bold text-emerald-400 w-8">{day.output}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Notes & Thoughts</label>
                                <Textarea 
                                    value={day.notes} 
                                    onChange={(e) => setDayPatch({ notes: e.target.value })}
                                    className="h-40 font-mono text-sm leading-relaxed"
                                    placeholder="What worked? What broke? How do we fix it tomorrow?"
                                />
                            </div>
                        </CardContent>
                     </Card>
                )}
            </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl shadow-indigo-500/50 flex items-center gap-3 font-bold text-lg"
          >
            <PartyPopper className="h-6 w-6 animate-bounce" />
            {celebrateMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arcade Modal */}
      <AnimatePresence>
        {showArcade && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
            >
                <div className="w-full max-w-2xl relative">
                    <button 
                        onClick={() => setShowArcade(false)}
                        className="absolute -top-12 right-0 text-slate-400 hover:text-white"
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <DistractionDefense onComplete={handleGameComplete} />
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}