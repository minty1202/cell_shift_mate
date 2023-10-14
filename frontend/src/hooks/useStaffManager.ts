import { useState, useMemo } from 'react';
import { Tiers, TierNameMap } from '@/constants';
import type { Staff, StaffInput, StaffManagement, PartialExceptFor } from '@/types';

type InitialStaffManagement = PartialExceptFor<StaffManagement, 'workDays'>;

/**
 * Staff を扱うためのカスタムフック
 * 
 * @param {InitialStaffManagement} [initialStaffManagement] - 初期値
 */
export const useStaffManager = (initialStaffManagement: InitialStaffManagement) => {

  const initializeStaffManagement = (initialStaffManagement: InitialStaffManagement): StaffManagement => {
    const { workDays } = initialStaffManagement;

    // とりあえずの初期値を作成
    const staffs = Tiers.map((tier, i) => {
      return {
        id: i + 1,
        tier,
        workDays,
        desiredOffDays: [],
        name: `${TierNameMap[tier]} ${i + 1}`,
        custom: {}
      }
    });

    return {
      workDays,
      staffs,
    }
  }

  const [staffManagement, setStaffManagement] = useState<StaffManagement>(initializeStaffManagement(initialStaffManagement));

  const createStaffs = (inputStaffManagement?: StaffManagement): Staff[] => {
    const { workDays, staffs } = inputStaffManagement ?? staffManagement;

    return staffs.map((staff) => {
      return {
        id: staff.id,
        name: staff.name,
        tier: staff.tier,
        desiredOffDays: staff.desiredOffDays,
        workDays: staff.workDays ?? workDays,
      }
    });
  }

  /**
   * Staff を作成する、作成した Staffs をオプションのコールバックで返す
   * 
   * @param {Pick<StaffInput, 'tier'>} input - 作成する Staff の情報
   * @param {(newStaffs: Staff[]) => void} [callback] - Staff 作成後に実行する callback
   */
  const addStaff = (input: Pick<StaffInput, 'tier'>, callback?: (newStaffs: Staff[]) => void) => {
    const { workDays, staffs } = staffManagement;

    const staffId = staffs.length + 1;
    const staff = {
      ...input,
      id: staffId,
      desiredOffDays: [],
      name: `${TierNameMap[input.tier]} ${staffId}`,
      workDays: workDays,
    };

    const newStaffs = [...staffs, staff];
    const sorted = newStaffs.sort((a, b) => a.tier - b.tier);
    const newStaffManagement = {
      ...staffManagement,
      staffs: sorted,
    }
    setStaffManagement(newStaffManagement);

    // コールバックが提供されている場合、新しいスタッフリストを渡して実行する
    callback?.(createStaffs(newStaffManagement));
  }

  /**
   * Staff を更新する
   * 
   * @param {Staff} staff - 更新する Staff の情報
   */
  const updateStaff = (staff: Staff) => {
    const { staffs } = staffManagement;

    const newStaffs = staffs.map((state) => {
      if (state.id === staff.id) {
        return {
          ...state,
          ...staff,
        }
      } else {
        return staff;
      }
    });
    const sorted = newStaffs.sort((a, b) => a.tier - b.tier);
    setStaffManagement((prev) => ({
      ...prev,
      staffs: sorted,
    }));
  }

  /**
   * スタッフ全体の出勤日を更新する
   * TODO: ユーザーによって編集された場合は、そのstaffは除外する
   * TODO: 今は workDays だが、他の設定もできる命名にする
   * 
   * @param {number} 出勤数
   */
  const updateStaffsWorkDays = (workDays: number) => {
    const { staffs } = staffManagement;

    const newStaffs = staffs.map((state) => {
      return {
        ...state,
        workDays,
      }
    });
    setStaffManagement((prev) => ({
      ...prev,
      workDays,
      staffs: newStaffs,
    }));
  };

  /**
   * Staff を削除する、更新した Staffs をオプションのコールバックで返す
   * 
   * @param {number} staffId - 削除する Staff の id
   * @param {(newStaffs: Staff[]) => void} [callback] - Staff 削除後に実行する callback
   */
  const removeStaff = (staffId: number, callback?: (newStaffs: Staff[]) => void) => {
    const { staffs } = staffManagement;
    const newStaffs = staffs.filter((staff) => staff.id !== staffId);
    const newStaffManagement = {
      ...staffManagement,
      staffs: newStaffs,
    }
    setStaffManagement(newStaffManagement);

    // コールバックが提供されている場合、新しいスタッフリストを渡して実行する
    callback?.(createStaffs(newStaffManagement));
  }

  const createStaffsInput = (inputStaffManagement?: StaffManagement): StaffInput[] => {
    const staffs = createStaffs(inputStaffManagement ?? staffManagement);
    return staffs.map(({ name, ...rest }) => rest);
  }

  return {
    staffBaseSettings: useMemo(() => ({ workDays: staffManagement.workDays }), [staffManagement]),
    staffs: useMemo(() => createStaffs(), [staffManagement]),
    addStaff,
    updateStaff,
    removeStaff,
    updateStaffsWorkDays,
    createStaffsInput,
  }
};
