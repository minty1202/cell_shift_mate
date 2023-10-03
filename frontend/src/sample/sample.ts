import { StaffInput, ShiftInput, LockedShift, AssignedShift } from '@/types';
import sampleStaffData from './sampleStaffData.json';

const staffs: StaffInput[] = sampleStaffData;

// 定休日
const closedDays = [10, 21]

// 忙しい日 とりあえず土日を想定
const busyDays = [1, 2, 8, 9, 15, 16, 22, 23, 29, 30]

const createShiftInput = ({
  closedDays,
  busyDays,
}: {
  closedDays: number[];
  busyDays: number[];
}): ShiftInput[] => {
  // 30日間の配列を作成
  const dateArray = [...Array(30)]

  // requiredAttendanceTiers は 店長と当日責任者の 1 と 2 が必要
  const requiredAttendanceTiers = [1, 2]

  // 通常日の必要人数
  const requiredStaffCountOnNormal = 3

  // 忙しい日の必要人数
  const requiredStaffCountOnBusy = 4

  const calculateRequiredStaffCount = ({
    date,
    busyDays,
    closedDays,
    requiredStaffCountOnNormal,
    requiredStaffCountOnBusy,
  }: {
    date: number;
    busyDays: number[];
    closedDays: number[];
    requiredStaffCountOnNormal: number;
    requiredStaffCountOnBusy: number;
  }) => {
    if (busyDays.includes(date) && closedDays.includes(date)) {
      throw new Error('busyDays と closedDays に同じ日付が含まれています');
    }

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
  return dateArray.map((_, index) => {
    const date = index + 1
    const requiredStaffCount: number = calculateRequiredStaffCount({
      date,
      busyDays,
      closedDays,
      requiredStaffCountOnNormal,
      requiredStaffCountOnBusy,
    })

    return {
      date,
      requiredStaffCount,
      requiredAttendanceTiers,
      requiredAttendanceTierCount: requiredAttendanceTiers.length,
    }
  })
}

const shifts = createShiftInput({ closedDays, busyDays })

const createLockedShift = ({ closedDays, staffs }: { closedDays: number[]; staffs: StaffInput[] }) => {
  return closedDays.map((date) => {
    return staffs.map((staff) => {
      return {
        date,
        staffId: staff.id,
        isWorking: false,
      }
    })
  }).flat()
}

const lockedShift: LockedShift[] = createLockedShift({ closedDays, staffs })

const createAssignedShifts = ({
  staffs,
  shifts,
  lockedShift,
}: {
  staffs: StaffInput[];
  shifts: ShiftInput[];
  lockedShift: LockedShift[];
}): AssignedShift[] => {
  const assignedShifts: AssignedShift[] = []

  shifts.forEach((shift) => {
    staffs.forEach((staff) => {
      assignedShifts.push({
        date: shift.date,
        staffId: staff.id,
        isWorking: false,
        locked: false
      })
    })
  })

  assignedShifts.forEach((assignedShift) => {
    const locked = lockedShift.find((lockedShift) => {
      return lockedShift.date === assignedShift.date && lockedShift.staffId === assignedShift.staffId
    })

    if (locked) {
      assignedShift.isWorking = locked.isWorking
      assignedShift.locked = true
    }
  })

  return assignedShifts
}

const assignedShifts = createAssignedShifts({ staffs, shifts, lockedShift })

export {
  staffs,
  shifts,
  lockedShift,
  closedDays,
  busyDays,
  assignedShifts
}
