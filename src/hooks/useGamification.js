
import { useState, useEffect } from 'react';

const XP_PER_LEVEL = 100;

export const useGamification = () => {
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        const savedData = localStorage.getItem('studyGamification');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setXp(parsed.xp || 0);
                setLevel(parsed.level || 1);
                setBadges(parsed.badges || []);
            } catch (e) {
                console.error("Failed to load gamification data", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('studyGamification', JSON.stringify({ xp, level, badges }));
    }, [xp, level, badges]);

    const addXP = (amount) => {
        if (typeof amount !== 'number' || isNaN(amount)) return;
        
        setXp(prev => {
            const newXp = prev + amount;
            // Check for level up
            const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
            if (newLevel > level) {
                setLevel(newLevel);
                // Trigger a celebratory effect if implemented elsewhere
                console.log(`Leveled up to ${newLevel}!`);
            }
            return newXp;
        });
    };

    const awardBadge = (badgeId) => {
        if (!badges.includes(badgeId)) {
            setBadges(prev => [...prev, badgeId]);
            return true; // Badge awarded
        }
        return false;
    };

    return { xp, level, badges, addXP, awardBadge, XP_PER_LEVEL };
};
