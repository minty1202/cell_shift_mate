import { StaffInput, ShiftInput, ShiftsInput } from '@/types';
import sampleStaffData from './sampleStaffData.json';

export const createShiftInput = (staffs: StaffInput[]): ShiftInput[] => {
  // 30日間の配列を作成
  const dateArray = [...Array(30)]

  // 定休日を設定
  const closedDays = [10, 21]

  // 忙しい日を設定 とりあえず土日を想定
  const busyDays = [1, 2, 8, 9, 15, 16, 22, 23, 29, 30]

  // requiredAttendanceTiers は 店長と当日責任者の 1 と 2 が必要
  const requiredAttendanceTiers = [1, 2]

  // 通常日の必要人数
  const requiredStaffCountOnNormal = 3

  // 忙しい日の必要人数
  const requiredStaffCountOnBusy = 4

  // shiftInput の配列を作成
  const shiftInputArray: ShiftInput[] = dateArray.map((_, index) => {
    const date = index + 1
    const requiredStaffCount: number = busyDays.includes(date) ? requiredStaffCountOnBusy : requiredStaffCountOnNormal

    // 定休日は lockedStaffs を確定させる
    const lockedStaffs = closedDays.includes(date) ? staffs.map((staff) => {
      return {
        id: staff.id,
        isWorking: false,
      }
    }) : []

    return {
      date,
      requiredStaffCount,
      requiredAttendanceTiers,
      requiredAttendanceTierCount: 1,
      lockedStaffs
    }
  })

  return shiftInputArray
}

export const postShift = async () => {
  const staffs: StaffInput[] = sampleStaffData;
  const shifts = createShiftInput(staffs)

  const shiftsInput: ShiftsInput = {
    staffs,
    shifts
  }

  return await fetch(`${import.meta.env.VITE_API_URL}/api/v1/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shiftsInput),
  });
};
