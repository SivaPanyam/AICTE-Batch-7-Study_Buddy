import { supabase } from '../lib/supabase';

/**
 * Completely wipes all application data from localStorage and the database.
 * @param {string} userId - The ID of the current user.
 */
export const wipeAllStorage = async (userId) => {
    try {
        // 1. Clear Supabase Database Data (if userId is provided)
        if (userId) {
            const { error: dbError } = await supabase
                .from('study_plans')
                .delete()
                .eq('user_id', userId);

            if (dbError) {
                console.error("Failed to clear Supabase data:", dbError);
                throw dbError;
            }
        }

        // 2. Clear LocalStorage
        // We clear everything because the user requested a "completely clean" state.
        localStorage.clear();

        // 3. Optional: Clear Supabase Session/Sign Out
        // This ensures the user starts from a fresh state entirely.
        await supabase.auth.signOut();

        return { success: true };
    } catch (error) {
        console.error("Error during storage cleanup:", error);
        return { success: false, error: error.message };
    }
};
