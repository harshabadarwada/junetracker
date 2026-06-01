import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlarmClock,
  Award,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  Download,
  Dumbbell,
  Flame,
  Moon,
  PenLine,
  Smartphone,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import './App.css'

type Mood = 'locked' | 'focused' | 'calm' | 'tired' | 'reset'

type DisciplineTask = {
  id: string
  label: string
  time: string
  group: string
  points: number
  icon: typeof AlarmClock
  cues: string[]
}

type DayEntry = {
  completed: string[]
  notes: string
  mood: Mood
}

type Reminder = {
  id: string
  label: string
  time: string
  enabled: boolean
}

type DisciplineState = {
  entries: Record<number, DayEntry>
  reminders: Reminder[]
  selectedDay: number
  toggleTask: (day: number, taskId: string) => void
  setSelectedDay: (day: number) => void
  setNotes: (day: number, notes: string) => void
  setMood: (day: number, mood: Mood) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
}

const tasks: DisciplineTask[] = [
  {
    id: 'wake',
    label: 'Wake Up',
    time: '06:00',
    group: 'Morning Foundation',
    points: 10,
    icon: AlarmClock,
    cues: ['No phone', 'No social media', 'Cold water', 'Stretching'],
  },
  {
    id: 'planning',
    label: 'Planning & Clarity',
    time: '06:30',
    group: 'Morning Foundation',
    points: 10,
    icon: PenLine,
    cues: ['Daily goals', 'Organize workspace', 'Journal'],
  },
  {
    id: 'movement',
    label: 'Movement',
    time: '07:00',
    group: 'Morning Foundation',
    points: 15,
    icon: Dumbbell,
    cues: ['Run', 'Walk', 'Pull-ups', 'Yoga'],
  },
  {
    id: 'nutrition',
    label: 'Healthy Breakfast',
    time: '08:00',
    group: 'Morning Foundation',
    points: 10,
    icon: Activity,
    cues: ['Protein-rich', 'Healthy food', 'No junk'],
  },
  {
    id: 'deep-work',
    label: 'Deep Work',
    time: '09:00 - 12:00',
    group: 'Deep Work Block',
    points: 20,
    icon: Brain,
    cues: ['Single-tasking', 'Airplane mode', 'No distractions'],
  },
  {
    id: 'growth',
    label: 'Growth Session',
    time: '13:00 - 17:00',
    group: 'Growth Block',
    points: 20,
    icon: TrendingUp,
    cues: ['Study', 'Skill development', 'Career growth', 'Project work'],
  },
  {
    id: 'evening',
    label: 'Evening Reset',
    time: '17:00 - 18:00',
    group: 'Evening Reset',
    points: 10,
    icon: TimerReset,
    cues: ['Walk', 'Workout', 'Reflection'],
  },
  {
    id: 'reading',
    label: 'Reading & Family',
    time: '18:00 onwards',
    group: 'Night Routine',
    points: 10,
    icon: BookOpen,
    cues: ['Reading', 'Family time', 'Meaningful conversations', 'No social media'],
  },
  {
    id: 'sleep',
    label: 'Sleep On Time',
    time: '22:00',
    group: 'Night Routine',
    points: 15,
    icon: Moon,
    cues: ['Phone away', 'Lights out', 'Recovery'],
  },
]

const defaultReminders: Reminder[] = [
  { id: 'wake', label: 'Wake Up', time: '06:00', enabled: true },
  { id: 'planning', label: 'Plan Day', time: '06:30', enabled: true },
  { id: 'movement', label: 'Exercise', time: '07:00', enabled: true },
  { id: 'deep-work', label: 'Deep Work', time: '09:00', enabled: true },
  { id: 'evening', label: 'Evening Walk', time: '17:00', enabled: true },
  { id: 'sleep', label: 'Sleep', time: '22:00', enabled: true },
]

const moods: Mood[] = ['locked', 'focused', 'calm', 'tired', 'reset']
const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0)
const days = Array.from({ length: 31 }, (_, index) => index + 1)
const today = Math.min(new Date().getDate(), 31)

const quotes = [
  'Discipline is choosing your future self before your current mood.',
  'Win the morning, protect the day.',
  'Small promises kept daily become identity.',
  'Focus is a physical environment, not just a feeling.',
]

const completionPresets = [
  ['wake', 'planning', 'movement', 'nutrition', 'deep-work', 'growth', 'evening', 'reading', 'sleep'],
  ['wake', 'planning', 'movement', 'nutrition', 'deep-work', 'growth', 'reading'],
  ['wake', 'planning', 'nutrition', 'deep-work', 'growth', 'sleep'],
  ['wake', 'movement', 'nutrition', 'growth'],
  ['wake', 'planning', 'deep-work'],
]

const createInitialEntries = () =>
  days.reduce<Record<number, DayEntry>>((entries, day) => {
    if (day < today) {
      const preset = completionPresets[(day + Math.floor(day / 4)) % completionPresets.length]
      entries[day] = {
        completed: preset,
        mood: moods[day % moods.length],
        notes:
          day % 5 === 0
            ? 'Protected deep work, walked after lunch, and kept the phone away at night.'
            : '',
      }
    }

    if (day === today) {
      entries[day] = {
        completed: ['wake', 'planning', 'movement'],
        mood: 'focused',
        notes: 'Today is active. Finish the core blocks and close strong.',
      }
    }

    return entries
  }, {})

const getEntry = (entries: Record<number, DayEntry>, day: number): DayEntry =>
  entries[day] ?? { completed: [], mood: 'reset', notes: '' }

const scoreDay = (entry: DayEntry) => {
  const points = tasks
    .filter((task) => entry.completed.includes(task.id))
    .reduce((sum, task) => sum + task.points, 0)

  return {
    points,
    percent: Math.min(100, Math.round((points / totalPoints) * 100)),
  }
}

const getScoreTone = (percent: number) => {
  if (percent === 100) return 'perfect'
  if (percent >= 75) return 'excellent'
  if (percent >= 50) return 'good'
  if (percent >= 25) return 'average'
  return 'poor'
}

const useDisciplineStore = create<DisciplineState>()(
  persist(
    (set) => ({
      entries: createInitialEntries(),
      reminders: defaultReminders,
      selectedDay: today,
      toggleTask: (day, taskId) =>
        set((state) => {
          const entry = getEntry(state.entries, day)
          const completed = entry.completed.includes(taskId)
            ? entry.completed.filter((id) => id !== taskId)
            : [...entry.completed, taskId]

          return {
            entries: {
              ...state.entries,
              [day]: { ...entry, completed },
            },
          }
        }),
      setSelectedDay: (day) => set({ selectedDay: day }),
      setNotes: (day, notes) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [day]: { ...getEntry(state.entries, day), notes },
          },
        })),
      setMood: (day, mood) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [day]: { ...getEntry(state.entries, day), mood },
          },
        })),
      updateReminder: (id, updates) =>
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...updates } : reminder,
          ),
        })),
    }),
    {
      name: 'discipline-os-storage',
    },
  ),
)

const calculateStreaks = (entries: Record<number, DayEntry>) => {
  let current = 0
  let longest = 0
  let running = 0

  for (const day of days) {
    const percent = scoreDay(getEntry(entries, day)).percent
    if (percent >= 75) {
      running += 1
      longest = Math.max(longest, running)
    } else {
      running = 0
    }

    if (day === today) current = running
  }

  if (current === 0) {
    for (let day = today; day >= 1; day -= 1) {
      if (scoreDay(getEntry(entries, day)).percent >= 75) current += 1
      else break
    }
  }

  return { current, longest }
}

const requestNotifications = async () => {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

const scheduleBrowserReminders = (reminders: Reminder[]) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  reminders
    .filter((reminder) => reminder.enabled)
    .forEach((reminder) => {
      const [hours, minutes] = reminder.time.split(':').map(Number)
      const reminderAt = new Date()
      reminderAt.setHours(hours, minutes, 0, 0)
      const delay = reminderAt.getTime() - Date.now()

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        window.setTimeout(() => {
          new Notification(`31 Days: ${reminder.label}`, {
            body: 'A discipline checkpoint is ready. Keep the streak alive.',
            icon: '/favicon.svg',
          })
        }, delay)
      }
    })
}

function App() {
  const {
    entries,
    reminders,
    selectedDay,
    toggleTask,
    setSelectedDay,
    setNotes,
    setMood,
    updateReminder,
  } = useDisciplineStore()
  const [notificationState, setNotificationState] = useState(
    'Notification' in window ? Notification.permission : 'unsupported',
  )
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)

  const selectedEntry = getEntry(entries, selectedDay)
  const selectedScore = scoreDay(selectedEntry)
  const todayEntry = getEntry(entries, today)
  const todayScore = scoreDay(todayEntry)

  const chartData = useMemo(
    () =>
      days.map((day) => {
        const entry = getEntry(entries, day)
        const score = scoreDay(entry)
        return {
          day: `${day}`,
          productivity: score.percent,
          deepWork: entry.completed.includes('deep-work') ? 3 : 0,
          health: ['movement', 'nutrition', 'evening', 'sleep'].filter((id) =>
            entry.completed.includes(id),
          ).length,
        }
      }),
    [entries],
  )

  const stats = useMemo(() => {
    const scoredDays = days.map((day) => scoreDay(getEntry(entries, day)).percent)
    const productiveDays = scoredDays.filter((percent) => percent >= 75).length
    const average = Math.round(
      scoredDays.reduce((sum, percent) => sum + percent, 0) / scoredDays.length,
    )
    const streaks = calculateStreaks(entries)
    const taskDays = (taskId: string) =>
      days.filter((day) => getEntry(entries, day).completed.includes(taskId)).length

    return {
      ...streaks,
      productiveDays,
      average,
      deepWorkHours: taskDays('deep-work') * 3,
      exerciseDays: days.filter((day) => {
        const completed = getEntry(entries, day).completed
        return completed.includes('movement') || completed.includes('evening')
      }).length,
      readingDays: taskDays('reading'),
      sleepConsistency: Math.round((taskDays('sleep') / 31) * 100),
      disciplineScore: Math.round((average + streaks.longest * 2 + productiveDays) / 1.35),
      focusScore: Math.round((taskDays('deep-work') / 31) * 100),
      healthScore: Math.round(
        ((taskDays('movement') + taskDays('nutrition') + taskDays('sleep')) / 93) * 100,
      ),
    }
  }, [entries])

  const completedTasks = tasks.filter((task) => selectedEntry.completed.includes(task.id))
  const missedTasks = tasks.filter((task) => !selectedEntry.completed.includes(task.id))
  const quote = quotes[today % quotes.length]

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    scheduleBrowserReminders(reminders)
  }, [reminders, notificationState])

  const handleNotificationRequest = async () => {
    const permission = await requestNotifications()
    setNotificationState(permission)
    scheduleBrowserReminders(reminders)
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    const promptEvent = installPrompt as Event & { prompt: () => Promise<void> }
    await promptEvent.prompt()
    setInstallPrompt(null)
  }

  return (
    <main className="app-shell">
      <section className="wallpaper-panel" aria-label="Dynamic discipline dashboard">
        <div className="orb orb-one" />
        <div className="orb orb-two" />

        <nav className="topbar">
          <div className="brand-mark">
            <span className="h-logo" aria-hidden="true">
              H
            </span>
            <span>
              <strong>H Discipline</strong>
              <small>31 Days of Discipline</small>
            </span>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={handleNotificationRequest} type="button">
              <Bell size={16} />
              {notificationState === 'granted' ? 'Notifications on' : 'Enable reminders'}
            </button>
            <button
              className="ghost-button"
              disabled={!installPrompt}
              onClick={handleInstall}
              type="button"
            >
              <Download size={16} />
              Install PWA
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="hero-copy"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <p className="eyebrow hero-badge">
              <Sparkles size={14} />
              Productivity Operating System
            </p>
            <h1>Build visible discipline, one deliberate day at a time.</h1>
            <p className="hero-text">
              Track a structured routine, convert completion into a score, and watch your month
              become a living heatmap of consistency.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setSelectedDay(today)} type="button">
                Log today
              </button>
              <a className="secondary-button" href="#statistics">
                View analytics
              </a>
            </div>

            <div className="how-strip" aria-label="How the tracker works">
              {[
                ['01', 'Complete routine tasks', 'Each action adds discipline points.'],
                ['02', 'Score the day', 'Your daily percent is calculated out of 120.'],
                ['03', 'Color the month', 'The heatmap glows stronger as consistency improves.'],
              ].map(([step, title, text]) => (
                <div className="how-card" key={step}>
                  <span>{step}</span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="wallpaper-card"
            initial={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="wallpaper-header">
              <div>
                <p>Today</p>
                <strong>{todayScore.percent}%</strong>
              </div>
              <span className={`score-pill ${getScoreTone(todayScore.percent)}`}>
                {getScoreTone(todayScore.percent)}
              </span>
            </div>

            <div className="ring-wrap">
              <ResponsiveContainer height={218} width="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  data={[
                    { name: 'Discipline', value: todayScore.percent, fill: '#36f287' },
                    { name: 'Focus', value: stats.focusScore, fill: '#f8d84a' },
                    { name: 'Health', value: stats.healthScore, fill: '#ff8a3d' },
                  ]}
                  endAngle={-270}
                  innerRadius="52%"
                  outerRadius="96%"
                  startAngle={90}
                >
                  <PolarAngleAxis domain={[0, 100]} tick={false} type="number" />
                  <RadialBar background cornerRadius={18} dataKey="value" />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="ring-center">
                <span>{todayScore.points}</span>
                <small>/ {totalPoints} pts</small>
              </div>
            </div>

            <div className="wallpaper-dots">
              {days.map((day) => {
                const score = scoreDay(getEntry(entries, day))
                return (
                  <motion.button
                    animate={day === today ? { scale: [1, 1.18, 1] } : undefined}
                    className={`wallpaper-dot ${getScoreTone(score.percent)} ${
                      day === today ? 'current' : ''
                    }`}
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    title={`Day ${day}: ${score.percent}%`}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    type="button"
                  />
                )
              })}
            </div>

            <div className="quote-card">
              <Flame size={18} />
              <span>{quote}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Key productivity statistics">
        {[
          { label: 'Current Streak', value: `${stats.current} days`, icon: Flame },
          { label: 'Longest Streak', value: `${stats.longest} days`, icon: Award },
          { label: 'Productive Days', value: `${stats.productiveDays}/31`, icon: Target },
          { label: 'Monthly Average', value: `${stats.average}%`, icon: TrendingUp },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <motion.article
              className="metric-card"
              initial={{ opacity: 0, y: 14 }}
              key={metric.label}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Icon size={20} />
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </motion.article>
          )
        })}
      </section>

      <section className="content-grid">
        <article className="glass-card wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Monthly Heatmap</p>
              <h2>31-day consistency field</h2>
            </div>
            <CalendarDays size={24} />
          </div>

          <div className="heatmap-grid">
            {days.map((day) => {
              const score = scoreDay(getEntry(entries, day))
              const tone = getScoreTone(score.percent)
              return (
                <button
                  className={`day-cell ${tone} ${selectedDay === day ? 'selected' : ''} ${
                    day === today ? 'today' : ''
                  }`}
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  type="button"
                >
                  <span>{day}</span>
                  <small>{score.percent}%</small>
                </button>
              )
            })}
          </div>

          <div className="legend">
            {[
              ['poor', 'Red: Poor'],
              ['average', 'Orange: Average'],
              ['good', 'Yellow: Good'],
              ['excellent', 'Light Green: Excellent'],
              ['perfect', 'Dark Green: Perfect'],
            ].map(([tone, label]) => (
              <span key={tone}>
                <i className={tone} />
                {label}
              </span>
            ))}
          </div>
        </article>

        <article className="glass-card day-detail">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Day {selectedDay}</p>
              <h2>{selectedScore.percent}% complete</h2>
            </div>
            <span className={`score-pill ${getScoreTone(selectedScore.percent)}`}>
              {selectedScore.points} pts
            </span>
          </div>

          <div className="mood-row">
            {moods.map((mood) => (
              <button
                className={selectedEntry.mood === mood ? 'active' : ''}
                key={mood}
                onClick={() => setMood(selectedDay, mood)}
                type="button"
              >
                {mood}
              </button>
            ))}
          </div>

          <div className="task-list">
            {tasks.map((task) => {
              const Icon = task.icon
              const checked = selectedEntry.completed.includes(task.id)
              return (
                <button
                  className={`task-item ${checked ? 'done' : ''}`}
                  key={task.id}
                  onClick={() => toggleTask(selectedDay, task.id)}
                  type="button"
                >
                  <span className="task-check">{checked ? <Check size={16} /> : task.points}</span>
                  <span className="task-icon">
                    <Icon size={18} />
                  </span>
                  <span>
                    <strong>{task.label}</strong>
                    <small>
                      {task.time} · {task.group}
                    </small>
                  </span>
                </button>
              )
            })}
          </div>

          <label className="notes-box">
            Notes
            <textarea
              onChange={(event) => setNotes(selectedDay, event.target.value)}
              placeholder="What worked? What needs a reset?"
              value={selectedEntry.notes}
            />
          </label>
        </article>
      </section>

      <section className="content-grid" id="statistics">
        <article className="glass-card wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Statistics</p>
              <h2>Discipline trend</h2>
            </div>
            <Activity size={24} />
          </div>
          <div className="chart-panel">
            <ResponsiveContainer height={280} width="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="productivity" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#36f287" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#36f287" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" />
                <YAxis stroke="rgba(255,255,255,0.45)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(8, 12, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    color: '#fff',
                  }}
                />
                <Area
                  dataKey="productivity"
                  fill="url(#productivity)"
                  stroke="#36f287"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Focus + Health</p>
              <h2>Block performance</h2>
            </div>
            <Brain size={24} />
          </div>
          <div className="chart-panel compact">
            <ResponsiveContainer height={250} width="100%">
              <BarChart data={chartData.slice(Math.max(0, today - 10), today)}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" />
                <YAxis stroke="rgba(255,255,255,0.45)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(8, 12, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    color: '#fff',
                  }}
                />
                <Bar dataKey="deepWork" fill="#7cf7ff" radius={[10, 10, 0, 0]} />
                <Bar dataKey="health" fill="#36f287" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="glass-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Routine</p>
              <h2>Structured daily protocol</h2>
            </div>
            <Target size={24} />
          </div>
          <div className="routine-stack">
            {tasks.map((task) => {
              const Icon = task.icon
              return (
                <div className="routine-row" key={task.id}>
                  <Icon size={18} />
                  <div>
                    <strong>{task.time}</strong>
                    <span>{task.label}</span>
                    <small>{task.cues.join(' · ')}</small>
                  </div>
                  <b>{task.points}</b>
                </div>
              )
            })}
          </div>
        </article>

        <article className="glass-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Smart Notifications</p>
              <h2>Custom reminders</h2>
            </div>
            <Bell size={24} />
          </div>
          <div className="reminder-list">
            {reminders.map((reminder) => (
              <div className="reminder-row" key={reminder.id}>
                <label>
                  <input
                    checked={reminder.enabled}
                    onChange={(event) =>
                      updateReminder(reminder.id, { enabled: event.target.checked })
                    }
                    type="checkbox"
                  />
                  <span>{reminder.label}</span>
                </label>
                <input
                  onChange={(event) => updateReminder(reminder.id, { time: event.target.value })}
                  type="time"
                  value={reminder.time}
                />
              </div>
            ))}
          </div>
          <div className="pwa-note">
            <Smartphone size={18} />
            <span>Installable, offline-ready, and stored locally on this device.</span>
          </div>
        </article>
      </section>

      <section className="score-grid">
        {[
          ['Deep Work Hours', `${stats.deepWorkHours}h`],
          ['Exercise Days', `${stats.exerciseDays}`],
          ['Reading Days', `${stats.readingDays}`],
          ['Sleep Consistency', `${stats.sleepConsistency}%`],
          ['Discipline Score', `${stats.disciplineScore}`],
          ['Focus Score', `${stats.focusScore}%`],
          ['Health Score', `${stats.healthScore}%`],
          ['Missed Today', `${tasks.length - todayEntry.completed.length}`],
        ].map(([label, value]) => (
          <div className="score-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="summary-card">
        <div>
          <p className="eyebrow">Selected Day Summary</p>
          <h2>Completed vs missed</h2>
        </div>
        <div className="summary-columns">
          <div>
            <strong>Completed</strong>
            <p>
              {completedTasks.length
                ? completedTasks.map((task) => task.label).join(', ')
                : 'None yet'}
            </p>
          </div>
          <div>
            <strong>Missed</strong>
            <p>
              {missedTasks.length ? missedTasks.map((task) => task.label).join(', ') : 'Perfect day'}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
