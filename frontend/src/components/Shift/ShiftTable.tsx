import { useState } from 'react';
import './ShiftTable.css';

export const ShiftTable = () => {
  // 仮定: shiftDataは二次元配列で、各スタッフの30日分のシフトデータを保持しています。
  // 例: [['OFF', 'AM', 'PM', ...], [...], [...]]
  const [shiftData, setShiftData] = useState([
    Array(30).fill('OFF'), // スタッフ1
    Array(30).fill('OFF'), // スタッフ2
    // ... より多くのスタッフデータをここに追加できます。
  ]);

  return (
    <table className="shift-table">
      <thead>
        <tr>
          <th>Staff</th>
          {Array.from({ length: 30 }, (_, i) => (
            <th key={i}>{i + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shiftData.map((staffShifts, staffIndex) => (
          <tr key={staffIndex}>
            <td>Staff {staffIndex + 1}</td>
            {staffShifts.map((shift, dayIndex) => (
              <td key={dayIndex}>{shift}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
