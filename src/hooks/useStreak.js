import { useState, useEffect } from 'react';
import { getToday, differenceInDays } from '../utils/dateUtils';

const STORAGE_KEY = 'studyStreak';

export const useStreak = () => {
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        lastCompletionDate: null,
        lastBreakDate: null,
        history: [] // Array of YYYY-MM-DD strings
    });

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Validate/Recalculate streak on load (e.g. if user opens app after 3 days)
                // However, we only update streak on *action* (completing a task) or *viewing*?
                // Typically we show the stored streak, but if it's been days, it's visually "active" until they try to complete a task?
                // Or checks on load? Let's check on load to show 0 if they missed it.

                const today = getToday();
                const lastDate = parsed.lastCompletionDate;

                if (lastDate) {
                    const diff = differenceInDays(today, lastDate);

                    // If diff is huge, streak is effectively 0, but we don't overwrite storage until next action?
                    // Or we reset state display?
                    if (diff > 1) {
                        // Check break logic here or just display? 
                        // If we just load, we might not want to destructively update storage just by visiting.
                        // But for UI, if diff > 1 and (diff > 2 OR break used), effective streak is 0.
                        // Let's keep strict state in storage.
                    }
                }

                setStreakData(parsed);
            } catch (e) {
                console.error("Failed to parse streak", e);
            }
        }
    }, []);

    const saveStreak = (data) => {
        setStreakData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const markTaskCompleted = () => {
        const today = getToday();
        const { currentStreak, lastCompletionDate, lastBreakDate, history = [] } = streakData;

        // Helper to update history
        const updateHistory = (date) => {
            if (!history.includes(date)) {
                return [...history, date];
            }
            return history;
        };

        // If simple first time
        if (!lastCompletionDate) {
            const newHistory = updateHistory(today);
            saveStreak({
                currentStreak: 1,
                lastCompletionDate: today,
                lastBreakDate,
                history: newHistory
            });
            return { updated: true, streak: 1 };
        }

        const diff = differenceInDays(today, lastCompletionDate);

        if (diff === 0) {
            // Already completed a task today
            return { updated: false, streak: currentStreak };
        }

        if (diff === 1) {
            // Consecutive day
            const newStreak = currentStreak + 1;
            const newHistory = updateHistory(today);
            saveStreak({
                currentStreak: newStreak,
                lastCompletionDate: today,
                lastBreakDate,
                history: newHistory
            });
            return { updated: true, streak: newStreak };
        }

        if (diff === 2) {
            // Missed exactly one day. Check weekly break logic.
            const daysSinceLastBreak = lastBreakDate ? differenceInDays(today, lastBreakDate) : 999;

            if (daysSinceLastBreak >= 7) {
                // Use break
                console.log("Streak saved by weekly break!");
                const newHistory = updateHistory(today);
                saveStreak({
                    currentStreak: currentStreak + 1,
                    lastCompletionDate: today,
                    lastBreakDate: getToday(),
                    history: newHistory
                });
                return { updated: true, streak: currentStreak + 1, savedByBreak: true };
            }
        }

        // Gap too large or break already used
        const newHistory = updateHistory(today);
        saveStreak({
            currentStreak: 1, // Reset to 1 (today is done)
            lastCompletionDate: today,
            lastBreakDate, // Keep track of last break
            history: newHistory
        });
        return { updated: true, streak: 1, reset: true };
    };

    return {
        streak: streakData.currentStreak,
        history: streakData.history || [],
        markTaskCompleted
    };
};
