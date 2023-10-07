import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAssignedShiftManager } from '@/hooks/useAssignedShiftManager';
import { useShiftScheduleManager } from '@/hooks/useShiftScheduleManager';
import { useStaffManager } from '@/hooks/useStaffManager';
import { Staff, StaffInput, ShiftSchedule, ShiftInput, AssignedShift, ShiftsInput } from '@/types';
import dayjs from 'dayjs';


/**
 * useAssignedShiftManager useShiftScheduleManager useStaffManager を使用して
 * 
 * Staff, ShiftSchedule, AssignedShift を同期的に管理する Context
 */
interface State {
  staffs: Staff[];
  shifts: ShiftInput[];
  shiftSchedules: ShiftSchedule;
  assignedShifts: AssignedShift[];
}

interface Actions {
  addStaff: (input: Pick<StaffInput, 'tier'>) => void;
  removeStaff: (staffId: Staff['id']) => void;
  updateStaff: (staff: Staff) => void;
  updateShiftSchedule: (shiftSchedule: Partial<ShiftSchedule>) => void;
  updateAssignedShiftOne: (assignedShift: AssignedShift) => void;
  updateAssignedShifts: (assignedShifts: AssignedShift[]) => void;
  createShiftsInput: () => ShiftsInput;
}

export const ShiftManagementContext = createContext<{
  state: State;
  actions: Actions;
} | undefined>(undefined);

export function ShiftManagementProvider({ children }: { children: ReactNode }) {

  const {
    staffs,
    addStaff: addStaffCore,
    removeStaff: removeStaffCore,
    updateStaff,
    createStaffsInput,
  } = useStaffManager();

  // shiftSchedules の対象月の初期値は、翌月
  const defaultMonth = dayjs().add(1, 'month').format('YYYY-MM');
  const {
    shiftSchedules,
    updateShiftSchedule: updateShiftScheduleCore,
    createShiftInput,
  } = useShiftScheduleManager({ targetMonth: defaultMonth });

  const {
    assignedShifts,
    syncAssignedShifts,
    updateAssignedShiftOne,
    updateAssignedShifts,
    createLockedAssignedShiftInput,
  } = useAssignedShiftManager({ staffs, shiftInput: createShiftInput(shiftSchedules) });

  const addStaff = (input: Pick<StaffInput, 'tier'>) => {
    addStaffCore(input, newStaffs => {
      syncAssignedShifts({
        staffs: newStaffs,
        shiftInput: createShiftInput(shiftSchedules),
      });
    });
  }

  const removeStaff = (staffId: Staff['id']) => {
    removeStaffCore(staffId, newStaffs => {
      syncAssignedShifts({
        staffs: newStaffs,
        shiftInput: createShiftInput(shiftSchedules),
      });
    });
  }

  const updateShiftSchedule = (shiftSchedule: Partial<ShiftSchedule>) => {
    updateShiftScheduleCore(shiftSchedule, newShiftSchedules => {
      syncAssignedShifts({
        staffs,
        shiftInput: createShiftInput(newShiftSchedules),
      });
    });
  }

  const createShiftsInput = ():ShiftsInput  => {
    const staffsInput = createStaffsInput(staffs);
    const shiftInput = createShiftInput(shiftSchedules);
    const lockedAssignedShift = createLockedAssignedShiftInput(assignedShifts);

    return {
      staffs: staffsInput,
      shifts: shiftInput,
      locked: lockedAssignedShift,
    }
  }

  const shifts = useMemo(() => createShiftInput(shiftSchedules), [shiftSchedules]);

  return (
    <ShiftManagementContext.Provider
      value={{
        state: {
          staffs,
          shifts,
          shiftSchedules,
          assignedShifts,
        },
        actions: {
          addStaff,
          removeStaff,
          updateStaff,
          updateShiftSchedule,
          updateAssignedShiftOne,
          updateAssignedShifts,
          createShiftsInput,
        }
      }}
    >
      {children}
    </ShiftManagementContext.Provider>
  );
}

export const useShiftManagement = () => {
  const context = useContext(ShiftManagementContext);
  if (context === undefined) {
    throw new Error('useShiftManagement must be used within a ShiftManagementProvider');
  }
  return context;
}

/**
 * これらは以下のようにして使用する
 * 
 * const SampleComponent = () => {
 *   const { state, actions } = useShiftManagement();
 *   const { staffs, shiftSchedules, assignedShifts } = state;
 * 
 *   return (
 *     <div>
 *       <button onClick={() => actions.updateStaff({ name: 'sample' })}>update</button>
 *     </div>
 *   )
 * }
 */
