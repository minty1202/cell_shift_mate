import { ShiftsInput } from '@/types';
import { staffs, shifts, lockedShift } from '@/sample/sample';

export const postShift = async () => {
  const shiftsInput: ShiftsInput = {
    staffs,
    shifts,
    locked: lockedShift,
  }

  return await fetch(`${import.meta.env.VITE_API_URL}/api/v1/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shiftsInput),
  });
};
