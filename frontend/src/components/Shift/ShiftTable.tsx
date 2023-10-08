import { Staff, ShiftInput, AssignedShift } from '@/types';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DayStatusColorMap } from '@/constants';
import './ShiftTable.module.css'

const SHIFT_DATA_INDEX_PREFIX = 'shifts';

const busyDaysStyle = {
  backgroundColor: DayStatusColorMap['busy'][1],
  color: DayStatusColorMap['busy'][4],
}

const closedDaysStyle = {
  backgroundColor: DayStatusColorMap['closed'][1],
  color: DayStatusColorMap['closed'][4],
}

const selectDayStatusStyle = ({ isClosed, isBusy }: { isClosed: boolean, isBusy: boolean }) => {
  if (isClosed) {
    return closedDaysStyle
  }
  if (isBusy) {
    return busyDaysStyle
  }
  return {}
}

interface ShiftDataType {
  [key: string]: {
    isWorking: boolean;
    isClosed: boolean;
    isBusy: boolean;
  }
}

interface HeaderCellProps {
  date: number;
  isClosed: boolean;
  isBusy: boolean;
}

function HeaderCell({ date, isClosed, isBusy }: HeaderCellProps) {

  return (
    <div
      style={{
        ...selectDayStatusStyle({ isClosed, isBusy }),
        padding: '8px 8px',
      }}
    >
      {date}
    </div>
  );
}

interface CellProps {
  value: ShiftDataType[keyof ShiftDataType];
}

function Cell({ value }: CellProps) {
  const { isWorking, isClosed, isBusy } = value

  return (
    <div
    style={{
      ...selectDayStatusStyle({ isClosed, isBusy }),
      padding: '8px 8px',
    }}
    >
      {isWorking ? '○' : '×'}
    </div>
  );
}

const addShiftDataIndexPrefix = (date: number) => `${SHIFT_DATA_INDEX_PREFIX}.${date}`;


interface DataType {
  name: string;
  shifts: ShiftDataType;
}

interface CreateColumnsArgs {
  shifts: ShiftInput[];
  closedDays: number[];
  busyDays: number[];
}

const createColumns = ({ shifts, closedDays, busyDays}: CreateColumnsArgs): ColumnsType<DataType> => {

  const dateWithDayStatus = shifts.map((shift) => {
    const isClosed = closedDays.some((day) => day === shift.date);
    const isBusy = busyDays.some((day) => day === shift.date);

    return {
      date: shift.date,
      isClosed,
      isBusy,
    };
  })
  
  const columns: ColumnsType<DataType> = [
    {
      title: 'Staff',
      dataIndex: 'name',
      key: 'name',
      render: (value: string) => <div style={{ padding: '8px 8px'}}>{value}</div>,
    },
    ...dateWithDayStatus.map((shift) => ({
      title: () => <HeaderCell {...shift} />,
      dataIndex: ['shifts', addShiftDataIndexPrefix(shift.date)],
      key: shift.date,
      render: (value: ShiftDataType[keyof ShiftDataType]) => <Cell value={value} />,
    })),
  ];
  return columns;
}

interface CreateDataArgs {
  staffs: Staff[];
  assignedShifts: AssignedShift[];
  closedDays: number[];
  busyDays: number[];
}

const createData = ({ staffs, assignedShifts, closedDays, busyDays }: CreateDataArgs): DataType[] => {
  return staffs.map((staff) => {
    const myShifts = assignedShifts.filter((assignedShift) => assignedShift.staffId === staff.id);

    const sortedShifts = myShifts.sort((a, b) => a.date - b.date);

    const shifts = sortedShifts.reduce((acc: ShiftDataType, shift) => {
      acc[addShiftDataIndexPrefix(shift.date)] = {
        isWorking:  shift.isWorking,
        isClosed: closedDays.some((day) => day === shift.date),
        isBusy: busyDays.some((day) => day === shift.date),
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
  closedDays,
  busyDays,
  staffs,
  shifts,
  assignedShifts,
}: ShiftTableProps) {

  const columns = createColumns({ shifts, closedDays, busyDays });
  const data = createData({ staffs, assignedShifts, closedDays, busyDays });

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
