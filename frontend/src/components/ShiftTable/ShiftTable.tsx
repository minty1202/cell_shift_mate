import { MouseEvent } from 'react';
import { Staff, ShiftInput, AssignedShift } from '@/types';
import { Table, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DayStatusColorMap } from '@/constants';
import { LockFilled, UnlockOutlined } from '@ant-design/icons';
import { grey } from '@ant-design/colors';
import './ShiftTable.module.css'

const SHIFT_DATA_INDEX_PREFIX = 'shifts';

interface  StaffDataType extends Staff {
  attendanceCount: number;
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

interface DataType {
  staff: Staff;
  shifts: ShiftDataType;
}

const commonCellStyle = {
  padding: '4px 4px',
  minWidth: '16px',
  textAlign: 'center' as const,
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

interface HeaderCellProps {
  date: number;
  isClosed: boolean;
  isBusy: boolean;
}

function ColumnHeaderCell({ date, isClosed, isBusy }: HeaderCellProps) {
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

function LabelColumn() {
  const { Text } = Typography
  return (
    <div style={commonCellStyle}>
      Staff&nbsp;
      <Text
        type="secondary"
        style={{
          fontSize: '12px',
          fontWeight: 'normal',
        }}
      >
        出勤数/予定数
      </Text>
    </div>
  );
}

interface RecordHeaderCellProps {
  staff: StaffDataType;
}
function RecordHeaderCell({ staff }: RecordHeaderCellProps) {
  const { Text } = Typography;
  return (
    <div style={commonCellStyle}>
        <Space>
          {staff.name}
          <Text type="secondary">
            ({staff.attendanceCount}/{staff.workDays})
          </Text>
        </Space>
      </div>
  )
}

interface CellProps {
  value: ShiftDataType[keyof ShiftDataType];
}

function Cell({ value }: CellProps) {
  const { isWorking, isClosed, isBusy, isLocked, onLockIconClick } = value

  
  const busyDaysStyle = {
    backgroundColor: DayStatusColorMap['busy'][0],
    color: DayStatusColorMap['busy'][4],
  }

  const closedDaysStyle = {
    backgroundColor: DayStatusColorMap['closed'][0],
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
      title: () => <LabelColumn />,
      dataIndex: 'staff',
      key: 'staff',
      render: (staff: StaffDataType) => <RecordHeaderCell staff={staff} />,
    },
    ...dateWithDayStatus.map((shift) => ({
      title: () => <ColumnHeaderCell {...shift} />,
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
      staff: {
        ...staff,
        attendanceCount: sortedShifts.filter((shift) => shift.isWorking).length,
      },
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
