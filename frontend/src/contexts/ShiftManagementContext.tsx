import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAssignedShiftManager } from '@/hooks/useAssignedShiftManager';
import { useShiftScheduleManager } from '@/hooks/useShiftScheduleManager';
import { useStaffManager } from '@/hooks/useStaffManager';
import { StaffManagement, Staff, StaffInput, ShiftSchedule, ShiftInput, AssignedShift, ShiftsInput } from '@/types';
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

// TODO: どこかで直接引数情報を取得できるように変更する
interface Actions {
  addStaff: (input: Pick<StaffInput, 'tier'>) => void;
  removeStaff: (staffId: Staff['id']) => void;
  updateStaff: (staff: Staff) => void;
  updateShiftSchedule: (shiftSchedule: Partial<ShiftSchedule>) => void;
  updateAssignedShiftOne: (assignedShift: Partial<AssignedShift>) => void;
  updateAssignedShifts: (assignedShifts: AssignedShift[]) => void;
  createShiftsInput: () => ShiftsInput;
}

export const ShiftManagementContext = createContext<{
  state: State;
  actions: Actions;
} | undefined>(undefined);

interface ShiftManagementProviderProps {
  children: ReactNode;
  initialState? :{
    shiftSchedule?: Partial<ShiftSchedule>;
    staffManagement?: Partial<StaffManagement>;
  };
}

export function ShiftManagementProvider({ 
  children,
  initialState: {
    shiftSchedule: initialShiftSchedule = {},
    staffManagement: initialStaffManagement = {}
  } = {
    shiftSchedule: {},
    staffManagement: {}
  }
}: ShiftManagementProviderProps) {

  const populatedInitialStaffManagement = {
    workDays: 20,
    ...initialStaffManagement
  }

  const {
    staffs,
    addStaff: addStaffCore,
    removeStaff: removeStaffCore,
    updateStaff,
    createStaffsInput,
  } = useStaffManager(populatedInitialStaffManagement);

  const populatedInitialShiftSchedule   = {
    // shiftSchedules の対象月の初期値は、翌月
    month: dayjs().add(1, 'month').format('YYYY-MM'),
    ...initialShiftSchedule
  };

  const {
    shiftSchedules,
    updateShiftSchedule: updateShiftScheduleCore,
    createShiftInput,
  } = useShiftScheduleManager(populatedInitialShiftSchedule );

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
        closedDays: shiftSchedules.closedDays,
        oldClosedDays: shiftSchedules.closedDays,
      });
    });
  }

  const removeStaff = (staffId: Staff['id']) => {
    removeStaffCore(staffId, newStaffs => {
      syncAssignedShifts({
        staffs: newStaffs,
        shiftInput: createShiftInput(shiftSchedules),
        closedDays: shiftSchedules.closedDays,
        oldClosedDays: shiftSchedules.closedDays,
      });
    });
  }

  const updateShiftSchedule = (shiftScheduleInput: Partial<ShiftSchedule>) => {
    updateShiftScheduleCore(shiftScheduleInput, newShiftSchedules => {
      syncAssignedShifts({
        staffs,
        shiftInput: createShiftInput(newShiftSchedules),
        closedDays: newShiftSchedules.closedDays,
        oldClosedDays: shiftSchedules.closedDays,
      });
    });
  }

  const createShiftsInput = ():ShiftsInput  => {
    const staffsInput = createStaffsInput();
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
 * function SampleComponent() {
 *   const { state, actions } = useShiftManagement();
 *   const { staffs, shiftSchedules, assignedShifts } = state;
 * 
 *   return (
 *     <div>
 *       <button onClick={() => actions.updateStaff({ name: 'sample' })}>update</button>
 *     </div>
 *   )
 * }
 * 
 * function ParentComponent() {
 *   return (
 *     <ShiftManagementProvider>
 *       <SampleComponent />
 *     </ShiftManagementProvider>
 *   )
 * }
 */
