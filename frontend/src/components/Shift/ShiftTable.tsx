import { useState } from 'react';
import './ShiftTable.css';

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
