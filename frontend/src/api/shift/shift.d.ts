
export type StaffInput = {
  id: number;
  tier: number;
  desiredOffDays: number[];
  workDays: number;
};

export type ShiftInput = {
  date: number;
  requiredStaffCount: number;
  requiredAttendanceTiers: number[];
  requiredAttendanceTierCount: number;
  lockedStaffs: Array<{
    id: StaffInput['id'];
    isWorking: boolean;
  }>;
}

export type ShiftsInput = {
  staffs: StaffInput[],
  shifts: ShiftInput[]
}
