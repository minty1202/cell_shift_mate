import { useState } from 'react';
import { Tier } from '@/constants';
import type { PartialExceptFor, ShiftInput, ShiftSchedule } from '@/types';
import { getDaysInMonth } from '@/utils/date';
import dayjs from 'dayjs';
import holiday_jp from '@holiday-jp/holiday_jp'

/**
 * ShiftSchedule から ShiftInput を作成する
 * 
 * このコードは必ず純粋関数にするために、意図的に useShiftScheduleManager から分離している
 */
const createShiftInput = (shiftSchedule: ShiftSchedule): ShiftInput[] => {
  const {
    month,
    closedDays,
    busyDays,
    requiredAttendanceTiers,
    requiredAttendanceTierCount,
    requiredStaffCountOnNormal,
    requiredStaffCountOnBusy,
    overrideRequiredAttendanceTiers,
    overrideRequiredAttendanceTierCount,
    overrideRequiredStaffCount
  } = shiftSchedule;

  // 月の日数を取得
  const daysInMonth = getDaysInMonth(month);

  // 月の日付の配列を作成
  const dateArray = [...Array(daysInMonth)].map((_, index) => index + 1);

  // override を適用した配列を作成する
  type DaySetting = {
    date: ShiftInput['date'];
    requiredAttendanceTiers?: number[];
    requiredAttendanceTierCount?: number;
    requiredStaffCount?: number;
  };
  const dailySetting: DaySetting[] = dateArray.map((date) => {
    return {
      date,
      requiredAttendanceTiers: overrideRequiredAttendanceTiers?.[date],
      requiredAttendanceTierCount: overrideRequiredAttendanceTierCount?.[date],
      requiredStaffCount: overrideRequiredStaffCount?.[date],
    };
  });

  // 必要人数を計算する
  type calculateRequiredStaffCountArgs = {
    date: ShiftInput['date'];
    busyDays: ShiftSchedule['busyDays'];
    closedDays: ShiftSchedule['closedDays'];
    requiredStaffCountOnNormal: ShiftSchedule['requiredStaffCountOnNormal'];
    requiredStaffCountOnBusy: ShiftSchedule['requiredStaffCountOnBusy'];
  };
  const calculateRequiredStaffCount = ({
    date,
    busyDays,
    closedDays,
    requiredStaffCountOnNormal,
    requiredStaffCountOnBusy,
  }: calculateRequiredStaffCountArgs): ShiftInput['requiredStaffCount'] => {
    switch (true) {
      case busyDays.includes(date):
        return requiredStaffCountOnBusy;
      case closedDays.includes(date):
        return 0;
      default:
        return requiredStaffCountOnNormal;
    }
  };

  // shiftInput の配列を作成
  const shiftInput = dailySetting.map((day) => {
    const {
      date,
      requiredAttendanceTiers: customRequiredAttendanceTiers,
      requiredAttendanceTierCount: customRequiredAttendanceTierCount,
      requiredStaffCount: customRequiredStaffCount,
    } = day;
    const requiredStaffCount: number = calculateRequiredStaffCount({
      date,
      busyDays,
      closedDays,
      requiredStaffCountOnNormal,
      requiredStaffCountOnBusy,
    });

    const attendanceTiers = customRequiredAttendanceTiers ?? requiredAttendanceTiers
    const attendanceTierCount = customRequiredAttendanceTierCount ?? requiredAttendanceTierCount

    return {
      date,
      requiredStaffCount: customRequiredStaffCount ?? requiredStaffCount,
      requiredAttendanceTiers: closedDays.includes(date) ? [] : attendanceTiers,
      requiredAttendanceTierCount: closedDays.includes(date) ? 0 : attendanceTierCount,
    };
  });

  return shiftInput;
}

type InitialShiftSchedule = PartialExceptFor<ShiftSchedule, 'month'>;

/**
 * ShiftSchedule を扱うためのカスタムフック
 * 
 * 主に以下を行う
 * - ShiftSchedule の 作成, 更新
 * - ShiftSchedule から ShiftInput を作成する createShiftInput を export
 * 
 * @param {InitialShiftSchedule} initialShiftSchedule - 初期値
 */
export const useShiftScheduleManager = (initialShiftSchedule: InitialShiftSchedule) => {

  const initializedShiftSchedule: ShiftSchedule = {
    closedDays: [],
    busyDays: [],
    requiredAttendanceTiers: [Tier.Manager, Tier.DayManager],
    requiredAttendanceTierCount: 0,
    requiredStaffCountOnNormal: 1,
    requiredStaffCountOnBusy: 1,
    ...initialShiftSchedule,
  }

  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule>(initializedShiftSchedule);

  /**
   * ShiftSchedule を更新する、更新した ShiftSchedule をオプションのコールバックで返す
   * 月が変わる際は、リセットする
   * 
   * @param {Partial<ShiftSchedule>} shiftScheduleInput - 作成する ShiftSchedule の情報
   * @param {(newShiftSchedule: ShiftSchedule) => void} callback - 更新した ShiftSchedule を引数に受け取るコールバック
   */
    const updateShiftSchedule  = (shiftScheduleInput: Partial<ShiftSchedule>, callback?: (newShiftSchedule: ShiftSchedule) => void) => {
      // 月が変わる際は、リセットする
      if (shiftScheduleInput.month && shiftScheduleInput.month !== shiftSchedules.month) {

        // 一旦ここで休業日を計算するが、後で別の場所に移動する
        const targetMonth = dayjs(shiftScheduleInput.month).startOf('month')
        const firstDay = targetMonth.startOf('month').format('YYYY-MM-DD')
        const lastDay = targetMonth.endOf('month').format('YYYY-MM-DD')
        const holiday = [...holiday_jp.between(new Date(firstDay), new Date(lastDay))].map((h) => {
          return dayjs(new Date(h.date)).date()
        })

        //  土日を取得する
        const weekend = [...Array(targetMonth.daysInMonth()).keys()].map((i) => {
          const date = targetMonth.date(i + 1)
          if (date.day() === 0 || date.day() === 6) return i + 1
          return null
        }).filter((i) => i !== null) as number[]

        const busyDays = [...holiday, ...weekend].sort((a, b) => a - b)

        const newShiftSchedules = {
          ...initializedShiftSchedule,
          month: shiftScheduleInput.month,
          busyDays,
        };

        setShiftSchedules(newShiftSchedules)
        callback?.(newShiftSchedules)
        return;
      }

      if (shiftScheduleInput.closedDays !== undefined && shiftScheduleInput.busyDays !== undefined) {
        const { closedDays, busyDays } = shiftScheduleInput;
        const newClosedDays = shiftScheduleInput.closedDays.filter((day) => !busyDays.includes(day));
        const newBusyDays = busyDays.filter((day) => !closedDays.includes(day));
        shiftScheduleInput.closedDays = newClosedDays;
        shiftScheduleInput.busyDays = newBusyDays;
      } else if (shiftScheduleInput.closedDays) {
        // closedDays が送られた際は、busyDays から削除する
        const { closedDays: newClosedDays } = shiftScheduleInput;
        const { busyDays: currentBusyDays } = shiftSchedules;
        const busyDays = currentBusyDays.filter((day) => !newClosedDays.includes(day));
        shiftScheduleInput.busyDays = busyDays;
      } else if (shiftScheduleInput.busyDays) {
        // busyDays が送られた際は、closedDays から削除する
        const { busyDays: newBusyDays } = shiftScheduleInput;
        const { closedDays: currentClosedDays } = shiftSchedules;
        const closedDays = currentClosedDays.filter((day) => !newBusyDays.includes(day));
        shiftScheduleInput.closedDays = closedDays;
      }

      /**
       * closedDays が送られた場合は該当する
       * overrideRequiredAttendanceTiers,
       * overrideRequiredAttendanceTierCount,
       * overrideRequiredStaffCount
       * を削除する
       */
      if (shiftScheduleInput.closedDays) {
        const closedDays = shiftScheduleInput.closedDays;
        const {
          overrideRequiredAttendanceTiers,
          overrideRequiredAttendanceTierCount,
          overrideRequiredStaffCount,
        } = shiftSchedules;

        const newOverrideRequiredAttendanceTiers = { ...overrideRequiredAttendanceTiers };
        const newOverrideRequiredAttendanceTierCount = { ...overrideRequiredAttendanceTierCount };
        const newOverrideRequiredStaffCount = { ...overrideRequiredStaffCount };

        const removeOverride = (day: ShiftSchedule['closedDays'][number]) => {
          delete newOverrideRequiredAttendanceTiers?.[day];
          delete newOverrideRequiredAttendanceTierCount?.[day];
          delete newOverrideRequiredStaffCount?.[day];
        }

        closedDays.forEach(removeOverride);
        shiftScheduleInput.overrideRequiredAttendanceTiers = newOverrideRequiredAttendanceTiers;
        shiftScheduleInput.overrideRequiredAttendanceTierCount = newOverrideRequiredAttendanceTierCount;
        shiftScheduleInput.overrideRequiredStaffCount = newOverrideRequiredStaffCount;
      }

      const newShiftSchedules = {
        ...shiftSchedules,
        ...shiftScheduleInput,
      };

      setShiftSchedules(newShiftSchedules);
      callback?.(newShiftSchedules);
    }


  return {
    shiftSchedules,
    updateShiftSchedule,
    createShiftInput,
  }
};
