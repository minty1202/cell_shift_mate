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
}

export type Staff = StaffInput & {
  name: string;
};

export type AssignedShift = {
  date: number;
  staffId: number;
  isWorking: boolean;
  locked: boolean;
}

export type LockedShift = Omit<AssignedShift, 'locked'>;

export type ShiftsInput = {
  staffs: StaffInput[],
  shifts: ShiftInput[],
  locked: LockedShift[]
}
