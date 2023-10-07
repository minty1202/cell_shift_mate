import { useState } from 'react';
import { Tier } from '@/constants';
import type { ShiftInput, ShiftSchedule } from '@/types';
import dayjs from 'dayjs';

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
  const daysInMonth = dayjs(month).daysInMonth();

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

    return {
      date,
      requiredStaffCount: customRequiredStaffCount ?? requiredStaffCount,
      requiredAttendanceTiers: customRequiredAttendanceTiers ?? requiredAttendanceTiers,
      requiredAttendanceTierCount: customRequiredAttendanceTierCount ?? requiredAttendanceTierCount,
    };
  });

  return shiftInput;
}

interface ShiftScheduleManagerArgs {
  targetMonth: string; // YYYY-MM
}

/**
 * ShiftSchedule を扱うためのカスタムフック
 * 
 * 主に以下を行う
 * - ShiftSchedule の 作成, 更新
 * - ShiftSchedule から ShiftInput を作成する createShiftInput を export
 */
export const useShiftScheduleManager = ({ targetMonth }: ShiftScheduleManagerArgs) => {

  const createDefaultShiftSchedule = (month: string): ShiftSchedule => {
    return {
      month,
      closedDays: [],
      busyDays: [],
      requiredAttendanceTiers: [Tier.Manager, Tier.DayManager],
      requiredAttendanceTierCount: 0,
      requiredStaffCountOnNormal: 1,
      requiredStaffCountOnBusy: 1,
    };
  }

  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule>(createDefaultShiftSchedule(targetMonth));

  /**
   * ShiftSchedule を更新する、更新した ShiftSchedule をオプションのコールバックで返す
   * 月が変わる際は、リセットする
   * 
   * @param {Partial<ShiftSchedule>} shiftScheduleInput - 作成する ShiftSchedule の情報
   * @param {(newShiftSchedule: ShiftSchedule) => void} callback - 更新した ShiftSchedule を引数に受け取るコールバック
   */
    const updateShiftSchedule  = (shiftScheduleInput: Partial<ShiftSchedule>, callback?: (newShiftSchedule: ShiftSchedule) => void) => {
      // 月が変わる際は、リセットする
      if (shiftScheduleInput.month && shiftScheduleInput.month !== shiftScheduleInput.month) {
        setShiftSchedules(createDefaultShiftSchedule(shiftScheduleInput.month));
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

      // closedDays が送られた場合は該当する overrideRequiredAttendanceTiers, overrideRequiredAttendanceTierCount, overrideRequiredStaffCount を削除する
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
