export const getToday = () => {
    // Return YYYY-MM-DD in local time
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

export const differenceInDays = (date1Str, date2Str) => {
    if (!date1Str || !date2Str) return 0;

    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);

    // Normalize to midnight UTC to avoid timezone issues affecting day difference
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(d1 - d2);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isSameDay = (date1Str, date2Str) => {
    return date1Str === date2Str;
};
