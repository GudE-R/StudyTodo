import { Session } from '@pomarc/shared';
import { isSameDay, subDays, startOfDay, differenceInCalendarDays } from 'date-fns';

export interface StreakStats {
    currentStreak: number;
    longestStreak: number;
}

export const calculateStreak = (sessions: Session[]): StreakStats => {
    if (sessions.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // 日付のみのユニークな配列を作成し、降順（新しい順）にソート
    const uniqueDates = Array.from(new Set(
        sessions.map(s => startOfDay(new Date(s.createdAt)).getTime())
    )).sort((a, b) => b - a);

    if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const today = startOfDay(new Date());

    // Current Streak Calculation
    let currentStreak = 0;
    const lastStudyDate = new Date(uniqueDates[0]);

    // 今日勉強していれば1、していなくて昨日勉強していれば昨日からカウント開始
    if (isSameDay(lastStudyDate, today)) {
        currentStreak = 1;
        // 連続性を逆順にチェック
        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const expectedDate = subDays(new Date(uniqueDates[i - 1]), 1);
            if (isSameDay(prevDate, expectedDate)) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else if (isSameDay(lastStudyDate, subDays(today, 1))) {
        // 最終学習日が昨日なら、まだストリークは途切れていないとみなす（ただし今日の分はまだカウントしないなら0？いや、昨日の時点で連続していたら表示したいはず）
        // 一般的なストリーク表示では、「昨日まで連続していた」場合、今日やらなければ途切れるが、表示上は昨日の時点の数値を出すことが多い。
        // ここではシンプルに「昨日までの連続日数」を計算する
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const expectedDate = subDays(new Date(uniqueDates[i - 1]), 1);
            if (isSameDay(prevDate, expectedDate)) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0;
    }

    // Longest Streak Calculation
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i - 1]); // 新しい方がi-1

        // 注意: uniqueDatesは降順（新しい順）
        // prevDate (明日) - currentDate (今日) == 1日差なら連続
        if (differenceInCalendarDays(prevDate, currentDate) === 1) {
            tempStreak++;
        } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
        }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    return { currentStreak, longestStreak };
};
