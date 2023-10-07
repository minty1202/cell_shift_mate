import { ShiftsInput } from '@/types';

export const optimizeShift = async (input: ShiftsInput) => {
  return await fetch(`${import.meta.env.VITE_API_URL}/api/v1/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
};
