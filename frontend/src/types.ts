/**
 * PartialExceptFor
 * T のうち K に含まれるプロパティは必須とし、それ以外は任意とする
 * 
 * ex) type Sample = { a: number, b: string, c: boolean }
 *     type PartialExceptForSample = PartialExceptFor<Sample, 'a'>
 *     // PartialExceptForSample = { a: number, b?: string, c?: boolean }
 */
export type PartialExceptFor<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

export type StaffInput = {
  id: number;
  tier: number;
  desiredOffDays: number[];
  workDays: number;
};

export type Staff = StaffInput & {
  name: string;
};

export type StaffManagement = {
  workDays: number;
  staffs: Staff[];
}

export type ShiftInput = {
  date: number;
  requiredStaffCount: number;
  requiredAttendanceTiers: number[];
  requiredAttendanceTierCount: number;
}

/**
 * ShiftInput を作成するために扱う state の型
 * 月ごとに作成する
 *
 * @typedef {Object} ShiftSchedule
 * @property {string} month - 月 (YYYY-MM 形式)
 * @property {number[]} closedDays - 休業日
 * @property {number[]} busyDays - 混雑日
 * @property {number[]} requiredAttendanceTiers - 必須役職者の役職
 * @property {number} requiredAttendanceTierCount - 必須役職者の人数
 * @property {number} requiredStaffCountOnNormal - 通常日の必要人数
 * @property {number} requiredStaffCountOnBusy - 混雑日の必要人数
 * 
 * 以下は 特定日に対して変更する場合に使用する { [key: number]: number } とし、日付を key とするオブジェクト
 * @property {Object.<number, number[]>} [overrideRequiredAttendanceTiers] - 特定日に対して必須役者を変更するオブジェクト
 * @property {Object.<number, number>} [overrideRequiredAttendanceTierCount] - 特定日に対して必須役者の人数を変更するオブジェクト
 * @property {Object.<number, number>} [overrideRequiredStaffCount] - 特定日に対して必要人数を変更するオブジェクト
 */
export type ShiftSchedule = {
  month: string;
  closedDays: number[];
  busyDays: number[];
  requiredAttendanceTiers: number[];
  requiredAttendanceTierCount: number;
  requiredStaffCountOnNormal: number;
  requiredStaffCountOnBusy: number;

  overrideRequiredAttendanceTiers?: { [key: number]: number[] };
  overrideRequiredAttendanceTierCount?: { [key: number]: number };
  overrideRequiredStaffCount?: { [key: number]: number };
}

export type AssignedShift = {
  date: number;
  staffId: number;
  isWorking: boolean;
  locked: boolean;
}

export type LockedAssignedShiftInput = Omit<AssignedShift, 'locked'>;

export type ShiftsInput = {
  staffs: StaffInput[],
  shifts: ShiftInput[],
  locked: LockedAssignedShiftInput[]
}

export type TierKeys = 'Manager' | 'DayManager' | 'Upper' | 'Middle' | 'Junior';

export type DayStatus = 'closed' | 'busy';
