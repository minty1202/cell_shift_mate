import { useState } from 'react';
import { TierNameMap } from '@/constants';
import type { Staff, StaffInput } from '@/types';

/**
 * Staff を扱うためのカスタムフック
 */
export const useStaffManager = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  /**
   * Staff を作成する、作成した Staffs をオプションのコールバックで返す
   * 
   * @param {Omit<StaffInput, 'id'>} staffInput - 作成する Staff の情報
   * @param {(newStaffs: Staff[]) => void} [callback] - Staff 作成後に実行する callback
   */
  const addStaff = (staffInput: Omit<StaffInput, 'id'>, callback?: (newStaffs: Staff[]) => void) => {
    const staffId = staffs.length + 1;
    const staff: Staff = {
      ...staffInput,
      id: staffId,
      name: `${TierNameMap[staffInput.tier]} ${staffId}`
    };

    const newStaffs = [...staffs, staff];
    const sorted = newStaffs.sort((a, b) => a.tier - b.tier);
    setStaffs(sorted);

    // コールバックが提供されている場合、新しいスタッフリストを渡して実行する
    callback?.(sorted);
  }

  /**
   * Staff を更新する
   * 
   * @param {Staff} staff - 更新する Staff の情報
   */
  const updateStaff = (staff: Staff) => {
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
    setStaffs(sorted);
  }

  /**
   * Staff を削除する、更新した Staffs をオプションのコールバックで返す
   * 
   * @param {number} staffId - 削除する Staff の id
   * @param {(newStaffs: Staff[]) => void} [callback] - Staff 削除後に実行する callback
   */
  const removeStaff = (staffId: number, callback?: (newStaffs: Staff[]) => void) => {
    const newStaffs = staffs.filter((staff) => staff.id !== staffId);
    setStaffs(newStaffs);

    // コールバックが提供されている場合、新しいスタッフリストを渡して実行する
    callback?.(newStaffs);
  }

  const createStaffsInput = (staffs: Staff[]) => {
    return staffs.map(({ name, ...rest }) => rest);
  }

  return {
    staffs,
    addStaff,
    updateStaff,
    removeStaff,
    createStaffsInput,
  }
};