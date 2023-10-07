import { MouseEvent } from 'react';
import { Staff, ShiftInput, AssignedShift } from '@/types';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DayStatusColorMap } from '@/constants';
import './ShiftTable.module.css'
import { LockFilled, UnlockOutlined } from '@ant-design/icons';
import { grey } from '@ant-design/colors';

const SHIFT_DATA_INDEX_PREFIX = 'shifts';

const busyDaysStyle = {
  backgroundColor: DayStatusColorMap['busy'][1],
  color: DayStatusColorMap['busy'][4],
}

const closedDaysStyle = {
  backgroundColor: DayStatusColorMap['closed'][1],
  color: DayStatusColorMap['closed'][4],
}

const commonCellStyle = {
  padding: '8px 8px',
  minWidth: '20px',
  textAlign: 'center' as const,
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

interface LockIconProps {
  isLocked: boolean;
  onClick: (toggle: boolean) => void;
}

function LockIcon({ isLocked, onClick }: LockIconProps) {

  const iconStyle = {
    zIndex: 20,
    color: grey[0],
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick(!isLocked);
  }

  return (
    <span
      style={{
        position: 'absolute',
        top: '0',
        right: '0',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {isLocked ? <LockFilled style={{...iconStyle, opacity: 0.8 }} /> : <UnlockOutlined style={{...iconStyle, opacity: 0.4 }} />}
    </span>
  );
}

interface ShiftDataType {
  [key: string]: {
    isWorking: boolean;
    isLocked: boolean;
    isClosed: boolean;
    isBusy: boolean;
    onLockIconClick: (toggle: boolean) => void;
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
        ...commonCellStyle,
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
  const { isWorking, isClosed, isBusy, isLocked, onLockIconClick } = value

  return (
    <div
    style={{
      ...selectDayStatusStyle({ isClosed, isBusy }),
      ...commonCellStyle,
      position: 'relative',
    }}
    >
      <LockIcon isLocked={isLocked} onClick={onLockIconClick} />
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
      title: () => <div style={commonCellStyle}>Staff</div>,
      dataIndex: 'name',
      key: 'name',
      render: (value: string) => <div style={commonCellStyle}>{value}</div>,
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
  onChangeLock: ({ staffId, date, isLocked }: { staffId: number, date: number, isLocked: boolean }) => void;
}

const createData = ({ staffs, assignedShifts, closedDays, busyDays, onChangeLock }: CreateDataArgs): DataType[] => {
  return staffs.map((staff) => {
    const myShifts = assignedShifts.filter((assignedShift) => assignedShift.staffId === staff.id);

    const sortedShifts = myShifts.sort((a, b) => a.date - b.date);

    const shifts = sortedShifts.reduce((acc: ShiftDataType, shift) => {
      acc[addShiftDataIndexPrefix(shift.date)] = {
        isWorking:  shift.isWorking,
        isLocked: shift.locked,
        isClosed: closedDays.some((day) => day === shift.date),
        isBusy: busyDays.some((day) => day === shift.date),
        onLockIconClick: (toggle) => {
          onChangeLock({ staffId: staff.id, date: shift.date, isLocked: toggle });
        },
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
  onChangeLock: ({ staffId, date, isLocked }: { staffId: number, date: number, isLocked: boolean }) => void;
}

export function ShiftTable({
  closedDays,
  busyDays,
  staffs,
  shifts,
  assignedShifts,
  onChangeLock,
}: ShiftTableProps) {

  const columns = createColumns({ shifts, closedDays, busyDays });
  const data = createData({ staffs, assignedShifts, closedDays, busyDays, onChangeLock });

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
