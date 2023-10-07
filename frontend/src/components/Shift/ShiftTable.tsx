import { Staff, ShiftInput, AssignedShift } from '@/types';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const SHIFT_DATA_INDEX_PREFIX = 'shifts';
interface ShiftDataType {
  [key: string]: {
    isWorking: boolean;
  }
}

function Cell({ value }: { value: ShiftDataType }) {
  return (
    <>
      {value.isWorking ? '○' : '×'}
    </>
  );
}

const addShiftDataIndexPrefix = (date: number) => `${SHIFT_DATA_INDEX_PREFIX}.${date}`;


interface DataType {
  name: string;
  shifts: ShiftDataType;
}

const createColumns = (shifts: ShiftInput[]): ColumnsType<DataType> => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'Staff',
      dataIndex: 'name',
      key: 'name',
    },
    ...shifts.map((shift) => ({
      title: shift.date,
      dataIndex: ['shifts', addShiftDataIndexPrefix(shift.date)],
      key: shift.date,
      render: (value: ShiftDataType) => <Cell value={value} />,
    })),
  ];
  return columns;
}

const createData = (staffs: Staff[], assignedShifts: AssignedShift[]) => {
  return staffs.map((staff) => {
    const myShifts = assignedShifts.filter((assignedShift) => assignedShift.staffId === staff.id);

    const sortedShifts = myShifts.sort((a, b) => a.date - b.date);

    const shifts = sortedShifts.reduce((acc: ShiftDataType, shift) => {
      acc[addShiftDataIndexPrefix(shift.date)] = {
        isWorking:  shift.isWorking
      };
      return acc;
    }, {});

    return {
      name: staff.name,
      shifts,
      key: staff.id,
    };
  });
};

interface ShiftTableProps {
  closedDays: number[];
  busyDays: number[];
  staffs: Staff[];
  shifts: ShiftInput[];
  assignedShifts: AssignedShift[];
}

export function ShiftTable({
  // closedDays,
  // busyDays,
  staffs,
  shifts,
  assignedShifts,
}: ShiftTableProps) {

  const columns = createColumns(shifts);
  const data = createData(staffs, assignedShifts);

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      size="small"
      scroll={{ x: 'max-content' }}
    />
  );
};
