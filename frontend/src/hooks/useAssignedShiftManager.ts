import { useState } from 'react';
import type { Staff, ShiftInput,  AssignedShift, LockedAssignedShiftInput } from '@/types';

/**
 * AssignedShift を扱うためのカスタムフック
 * 
 * 主に以下を行う
 * - AssignedShift を Staff, ShiftInput と同期させる
 * - AssignedShift から LockedAssignedShiftInput を作成
 */
export const useAssignedShiftManager = () => {
  const [assignedShifts, setAssignedShifts] = useState<AssignedShift[]>([]);

  /**
   * Staff, ShiftInput から AssignedShift を作成, 更新する
   * 
   * @param {Staff[]} staffs - Staff のリスト
   * @param {ShiftInput[]} shiftInput - ShiftInput のリスト
   */
  type SyncAssignedShiftsArgs = {
    staffs: Staff[],
    shiftInput: ShiftInput[],
  }
  const syncAssignedShifts = ({ staffs, shiftInput }: SyncAssignedShiftsArgs) => {
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

    const syncedAssignedShifts = shiftInput.map((shift) => {
      return staffs.map((staff) => ({
        date: shift.date,
        staffId: staff.id,
        isWorking: dateStaffMap[shift.date]?.[staff.id]?.isWorking ?? false,
        locked: dateStaffMap[shift.date]?.[staff.id]?.locked ?? false,
      }));
    }).flat().sort((a, b) => a.date - b.date);
    setAssignedShifts(syncedAssignedShifts);
  }

  /**
   * AssignedShift の単体を更新する
   * 
   * @param {AssignedShift} assignedShift - 更新する AssignedShift
   */
  const updateAssignedShiftOne = (assignedShift: AssignedShift) => {
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
