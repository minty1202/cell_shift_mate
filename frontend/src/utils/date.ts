import dayjs from 'dayjs';

/**
 * 月の日数を取得する
 */
export const getDaysInMonth = (month: string) => dayjs(month).daysInMonth();
