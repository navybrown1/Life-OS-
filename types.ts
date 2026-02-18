export interface DayRecord {
  oneThingDone: boolean;
  consistency: number;
  output: number;
  notes: string;
  habit: Record<string, { done?: boolean; minutes?: number }>;
  oneThing: string;
  missionDone?: boolean;
  missionRewarded?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  trigger: string;
  tinyAction: string;
  reward: string;
  type: "yesno" | "minutes";
  targetMinutes?: number;
}

export interface LifeState {
  meta: {
    name: string;
    version: string;
    createdAt: string;
    bonusXP: number;
    coins: number;
  };
  values: Array<{ id: string; label: string; why: string; proof: string }>;
  principles: Array<{ id: string; label: string; note: string }>;
  filters: Array<{ id: string; key: string; prompt: string }>;
  routines: {
    dailyAnchors: Array<{ id: string; label: string; durationMin: number; steps: string[] }>;
    weekly: {
      planning: { day: string; minutes: number };
      review: { day: string; minutes: number };
    };
  };
  habits: Habit[];
  productivity: {
    oneThing: string;
    listA: string[];
    listB: string[];
    inbox: string[];
    calendarRule: string;
  };
  emotions: {
    tools: Array<{ id: string; name: string; how: string }>;
    checkin: {
      hunger: number;
      anger: number;
      lonely: number;
      tired: number;
      note: string;
    };
  };
  goals: {
    identity: string;
    outcomes: Array<{ id: string; text: string }>;
    processes: Array<{ id: string; text: string }>;
  };
  tracking: {
    days: Record<string, DayRecord>;
    weekStartISO: string;
  };
}
