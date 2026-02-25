import React, { useEffect, useState } from 'react';
import { useStreak } from '../hooks/useStreak';
import { useGamification } from '../hooks/useGamification';
import Card from '../components/Card';
import { BrainCircuit, Calendar as CalendarIcon, CheckCircle2, Target, Trophy, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import PomodoroTimer from '../components/PomodoroTimer';
import { getToday, isSameDay } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Calendar = ({ history = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isCompleted = history.includes(dateStr);
            const isToday = dateStr === getToday();

            days.push(
                <div key={i} className="flex items-center justify-center h-8 md:h-10">
                    <div className={clsx(
                        "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        isCompleted ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20" :
                            isToday ? "border border-primary-start text-primary-start" : "text-gray-400 hover:bg-gray-800"
                    )}>
                        {i}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-4 bg-hover/20 rounded-2xl border border-border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-text">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-hover rounded-lg text-text-secondary hover:text-text transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-hover rounded-lg text-text-secondary hover:text-text transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-500 py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {generateDays()}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 justify-center border-t border-gray-800 pt-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600"></div>
                    Study Done
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-primary-start"></div>
                    Today
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { streak, history, markTaskCompleted } = useStreak();
    const { xp, level, XP_PER_LEVEL } = useGamification();
    const [plans, setPlans] = useState([]);
    const [activePlanIndex, setActivePlanIndex] = useState(0);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        progress: 0,
        currentWeek: 1,
        activeDay: null
    });

    const fetchPlans = async () => {
        if (user) {
            try {
                const { data, error } = await supabase
                    .from('study_plans')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (error) throw error;
                if (data) {
                    setPlans(data);
                    if (data.length > 0) {
                        const activeIndex = activePlanIndex < data.length ? activePlanIndex : 0;
                        calculateStats(data[activeIndex]);
                    }
                    return; // Ensure we don't fall back to localStorage if logged in
                }
            } catch (e) {
                console.error("Dashboard Fetch Error:", e);
            }
        } else {
            const savedPlans = localStorage.getItem('studyGoalPlans');
            if (savedPlans) {
                try {
                    const parsed = JSON.parse(savedPlans);
                    setPlans(parsed);
                    if (parsed.length > 0) {
                        const activeIndex = activePlanIndex < parsed.length ? activePlanIndex : 0;
                        calculateStats(parsed[activeIndex]);
                    }
                } catch (e) {
                    console.error("Failed to parse plans", e);
                }
            }
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [user, activePlanIndex]);

    const calculateStats = (data) => {
        if (!data || !data.weeks) return;
        let total = 0;
        let completed = 0;
        let foundActiveDay = null;

        data.weeks.forEach((week, wIndex) => {
            week.days.forEach((day, dIndex) => {
                const dayTasks = (day.tasks || []).length;
                const dayCompleted = (day.tasks || []).filter(t => t.completed).length;

                total += dayTasks;
                completed += dayCompleted;

                if (!foundActiveDay && dayCompleted < dayTasks) {
                    foundActiveDay = {
                        ...day,
                        week: week.weekNumber,
                        weekTheme: week.theme,
                        wIndex,
                        dIndex
                    };
                }
            });
        });

        setStats({
            totalTasks: total,
            completedTasks: completed,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            activeDay: foundActiveDay
        });
    };

    const toggleTask = async (wIndex, dIndex, tIndex) => {
        if (plans.length === 0) return;

        const newPlans = [...plans];
        const activePlan = newPlans[activePlanIndex];
        const task = activePlan.weeks[wIndex].days[dIndex].tasks[tIndex];

        if (!task.completed) {
            markTaskCompleted();
        }

        task.completed = !task.completed;
        setPlans(newPlans);

        if (user && activePlan.id) {
            const { error } = await supabase
                .from('study_plans')
                .update({ weeks: activePlan.weeks })
                .eq('id', activePlan.id);
            if (error) console.error("Toggle Sync Error:", error);
        } else {
            localStorage.setItem('studyGoalPlans', JSON.stringify(newPlans));
        }
        calculateStats(activePlan);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20 space-y-8">
            <header>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--theme-heading-gradient)' }}>
                            Dashboard
                        </h1>
                        <p className="mt-2 text-text-secondary">Welcome back! Here's your study overview.</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        {plans.length > 1 && (
                            <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
                                {plans.map((p, idx) => (
                                    <button
                                        key={p.id || idx}
                                        onClick={() => setActivePlanIndex(idx)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                            activePlanIndex === idx
                                                ? "bg-primary-start text-white shadow-lg"
                                                : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        Plan {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="bg-card/50 p-3 rounded-xl border border-border flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Level {level}</span>
                                <span className="text-lg font-bold text-text">{xp} <span className="text-xs text-text-muted">XP</span></span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500"
                        style={{ width: `${(xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100}%` }}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 bg-card/50 border border-border p-4 rounded-2xl h-full">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-primary-start" />
                        <h2 className="text-sm font-bold text-text">Study Habit</h2>
                    </div>
                    <Calendar history={history} />
                </div>

                <Card
                    className="md:col-span-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:border-primary-start/30 transition-colors p-4 h-full"
                >
                    <div className="flex flex-col h-full justify-between gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-primary-start mb-1 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    Active Goal
                                </p>
                                {plans[activePlanIndex] ? (
                                    <>
                                        <h2 className="text-lg font-bold text-text mb-1">{plans[activePlanIndex].title}</h2>
                                        <p className="text-xs text-text-secondary line-clamp-1">{plans[activePlanIndex].description}</p>
                                    </>
                                ) : (
                                    <div className="text-gray-400 italic text-sm">No active goal set. Start planning!</div>
                                )}
                            </div>

                            {plans[activePlanIndex] && (
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-text">{stats.progress}%</span>
                                    <p className="text-[10px] text-text-muted uppercase">Completion</p>
                                </div>
                            )}
                        </div>

                        {plans[activePlanIndex] ? (
                            <div className="mt-2">
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-primary-start to-primary-end h-full transition-all duration-500"
                                        style={{ width: `${stats.progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <Link to="/goals" className="self-start bg-primary-start text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                                Create Goal
                            </Link>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card title="Today's Focus" icon={CalendarIcon} className="h-full p-4">
                        {plans.length > 0 ? (
                            stats.activeDay ? (
                                <div className="space-y-4">
                                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-primary-start uppercase tracking-wider">
                                                Week {stats.activeDay.week} • {stats.activeDay.day}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-semibold text-text">{stats.activeDay.focus}</h3>
                                    </div>

                                    <div className="space-y-2">
                                        {stats.activeDay.tasks.map((task, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => toggleTask(stats.activeDay.wIndex, stats.activeDay.dIndex, idx)}
                                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-pointer border border-transparent hover:border-gray-800"
                                            >
                                                <div className={clsx(
                                                    "mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                    task.completed
                                                        ? "bg-primary-start border-primary-start"
                                                        : "border-gray-600 group-hover:border-primary-start"
                                                )}>
                                                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                                <p className={clsx(
                                                    "text-sm flex-1 leading-snug transition-all",
                                                    task.completed ? "text-gray-500 line-through" : "text-gray-300 group-hover:text-white"
                                                )}>
                                                    {task.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Link to="/goals" className="text-xs font-medium text-primary-start hover:text-white transition-colors flex items-center gap-1">
                                            View Full Plan <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                    <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
                                    <p className="text-xs text-gray-400 mt-1">You've completed all scheduled tasks.</p>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-6 text-gray-500">
                                <p className="text-sm">No active plan found.</p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20 p-4">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Daily Quiz</h3>
                                    <p className="text-[10px] text-gray-400">Test: <strong>{stats.activeDay?.focus || "General"}</strong></p>
                                </div>
                            </div>

                            <Link
                                to="/quiz"
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-bold text-center text-sm transition-colors mt-auto"
                            >
                                Start Quiz
                            </Link>
                        </div>
                    </Card>

                    <div className="bg-card border border-gray-800 rounded-2xl p-4">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Progress</h4>
                        <div className="flex justify-between items-center py-1 border-b border-gray-800">
                            <span className="text-xs text-gray-300">Total Tasks</span>
                            <span className="text-sm text-white font-bold">{stats.totalTasks}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 pt-2">
                            <span className="text-xs text-gray-300">Completed</span>
                            <span className="text-sm text-green-400 font-bold">{stats.completedTasks}</span>
                        </div>
                    </div>

                    <PomodoroTimer />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
