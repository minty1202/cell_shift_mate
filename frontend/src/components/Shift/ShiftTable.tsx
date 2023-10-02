import { useState } from 'react';
import './ShiftTable.css';
import { Staff, ShiftInput, AssignedShift } from '@/types';

const Tier = {
  Manager: 1,
  DayManager: 2,
  Upper: 3,
  Middle: 4,
  Junior: 5,
};

const TierNameMap = {
  [Tier.Manager]: '店長クラス',
  [Tier.DayManager]: '当日責任者',
  [Tier.Upper]: '優秀層',
  [Tier.Middle]: '一般層',
  [Tier.Junior]: '新人層',
};

interface ShiftTableProps {
  closedDays: number[];
  busyDays: number[];
  staffs: Staff[];
  shifts: ShiftInput[];
  assignedShifts: AssignedShift[];
}

export function ShiftTable({
  closedDays,
  busyDays,
  staffs,
  shifts,
  assignedShifts,
}: ShiftTableProps) {

  const createStaffWithShifts = (staffs: Staff[], assignedShifts: AssignedShift[]) => {
    return staffs.map((staff) => {
      const myShifts = assignedShifts.filter((assignedShift) => assignedShift.staffId === staff.id);

      const sortedShifts = myShifts.sort((a, b) => a.date - b.date);

      return {
        ...staff,
        assignedShifts: sortedShifts,
      };
    });
  };

  const staffWithShifts = createStaffWithShifts(staffs, assignedShifts);

  return (
    <table className="shift-table">
      <thead>
        <tr>
          <th>Staff</th>
          {shifts.map((shift, index) => (
            <th key={index}>{shift.date}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {staffWithShifts.map((staff, staffIndex) => (
          <tr key={staffIndex}>
            <td>Staff {staff.name}</td>
            {staff.assignedShifts.map((shift, dayIndex) => (
              <td key={dayIndex}>{shift.isWorking ? '○' : '×'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
