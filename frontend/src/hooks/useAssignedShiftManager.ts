import { useState } from 'react';
import type { Staff, ShiftInput,  AssignedShift, LockedAssignedShiftInput } from '@/types';

/**
 * AssignedShift を扱うためのカスタムフック
 * 
 * 主に以下を行う
 * - AssignedShift を Staff, ShiftInput と同期させる
 * - AssignedShift から LockedAssignedShiftInput を作成
 */
interface UseAssignedShiftManagerArgs {
  staffs: Staff[],
  shiftInput: ShiftInput[],
  closedDays: number[],
}

export const useAssignedShiftManager = ({ staffs, shiftInput, closedDays }: UseAssignedShiftManagerArgs) => {

  type CalculateDayStatusArgs = {
    date: number,
    target: 'isWorking' | 'locked',
    closedDays: number[],
    current?: boolean,
  }

  const calculateClosedDayStatus = ({ date, target, closedDays, current }: CalculateDayStatusArgs) => {
    const overrideOnClosedDayMap = {
      isWorking: false,
      locked: true,
    };

    if (closedDays.includes(date)) {
      return overrideOnClosedDayMap[target];
    }
    return current ?? false;
  }

  /**
   * Staff, ShiftInput から AssignedShift を作成する
   * calculateDayStatus を関数として渡し、date と staffId から isWorking と locked を計算する
   * 
   * @param {Staff[]} staffs - Staff のリスト
   * @param {ShiftInput[]} shiftInput - ShiftInput のリスト
   * @param {function} calculateClosedDayStatus - 状態を判定するための date, staffId, および target を受け取り、boolean を返す関数
   */
  type DayStatusQueryArgs  = {
    date: number,
    staffId: number,
    target: 'isWorking' | 'locked',
  }

  type initializeAssignedShiftsArgs = {
    staffs: Staff[],
    shiftInput: ShiftInput[],
    calculateClosedDayStatus: (args: DayStatusQueryArgs) => boolean,
  }

  const initializeAssignedShifts = ({ staffs, shiftInput, calculateClosedDayStatus }: initializeAssignedShiftsArgs): AssignedShift[] => {

    const calculateDayStatus = (args: DayStatusQueryArgs) => calculateClosedDayStatus(args);

    return shiftInput.map((shift) => {
      return staffs.map((staff) => ({
        date: shift.date,
        staffId: staff.id,
        isWorking: calculateDayStatus({ date: shift.date, staffId: staff.id, target: 'isWorking' }),
        locked: calculateDayStatus({ date: shift.date, staffId: staff.id, target: 'locked' }),
      }));
    }).flat().sort((a, b) => a.date - b.date);
  }

  const [assignedShifts, setAssignedShifts] = useState<AssignedShift[]>(initializeAssignedShifts({
    staffs,
    shiftInput,
    calculateClosedDayStatus: (args) => calculateClosedDayStatus({ ...args, closedDays })
  }));

  /**
   * Staff, ShiftInput, closedDays から AssignedShift を作成, 更新する
   * closedDays に含まれる日付は isWorking を false にし、locked を true にする
   * closedDays から除外された場合は、locked を false にする
   * 
   * @param {Staff[]} staffs - Staff のリスト
   * @param {ShiftInput[]} shiftInput - ShiftInput のリスト
   * @param {number[]} closedDays - 休業日の日付のリスト
   * @param {number[]} oldClosedDays - 変更前の休業日の日付のリスト
   */
  type SyncAssignedShiftsArgs = {
    staffs: Staff[],
    shiftInput: ShiftInput[],
    closedDays: number[],
    oldClosedDays: number[],
  }
  const syncAssignedShifts = ({ staffs, shiftInput, closedDays, oldClosedDays }: SyncAssignedShiftsArgs) => {
    if (staffs.length === 0 || shiftInput.length === 0) return

    // 既存の assignedShifts を 検索しやすいように { date: { staffId: { isWorking: boolean, locked: boolean } } } の形にする
    // TODO: date と staffId の型を変更する
    const dateStaffMap: { [date: number]: { [staffId: number]: { isWorking: boolean, locked: boolean } } } = {};
    assignedShifts.forEach((assignedShift) => {
      if (!dateStaffMap[assignedShift.date]) {
        dateStaffMap[assignedShift.date] = {};
      }

      dateStaffMap[assignedShift.date][assignedShift.staffId] = { isWorking: assignedShift.isWorking, locked: assignedShift.locked };
    });

    const syncedAssignedShifts = initializeAssignedShifts({
      staffs,
      shiftInput,
      calculateClosedDayStatus: ({date, staffId, target }) => calculateClosedDayStatus({ 
        closedDays,
        target,
        date,
        current: dateStaffMap[date]?.[staffId]?.[target] ?? false,
      }),
    });

    // 古い closedDays から除外された場合は、locked を false にする
    const removedClosedDays = oldClosedDays.filter((day) => !closedDays.includes(day));
    removedClosedDays.forEach((day) => {
      syncedAssignedShifts.forEach((assignedShift) => {
        if (assignedShift.date === day) {
          assignedShift.locked = false;
        }
      });
    });

    setAssignedShifts(syncedAssignedShifts);
  }

  /**
   * AssignedShift の単体を更新する
   * 
   * @param {Partial<AssignedShift>} assignedShift - 更新する AssignedShift
   */
  const updateAssignedShiftOne = (assignedShift: Partial<AssignedShift>) => {
    const newAssignedShifts = assignedShifts.map((state) => {
      if (state.date === assignedShift.date && state.staffId === assignedShift.staffId) {
        return {
          ...state,
          ...assignedShift,
        }
      } else {
        return state;
      }
    });
    setAssignedShifts(newAssignedShifts);
  }

  /**
   * AssignedShift を一新する
   * 
   * @param {AssignedShift[]} assignedShifts - 更新する AssignedShift のリスト
   */
  const updateAssignedShifts = (assignedShifts: AssignedShift[]) => {
    // 既存の assignedShifts と 総数が同じかチェック
    if (assignedShifts.length !== assignedShifts.length) throw new Error('assignedShifts の数が異なります');
    setAssignedShifts(assignedShifts);
  }

  /**
   * AssignedShift から LockedAssignedShiftInput を作成する
   */
  const createLockedAssignedShiftInput = (assignedShifts: AssignedShift[]): LockedAssignedShiftInput[] => {
    return assignedShifts
      .filter(({ locked }) => locked)
      .map(({ locked, ...rest }) => rest);
  };

  return {
    assignedShifts,
    syncAssignedShifts,
    updateAssignedShiftOne,
    updateAssignedShifts,
    createLockedAssignedShiftInput,
  }
}
