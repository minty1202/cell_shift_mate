import { useState, ReactElement } from 'react';
import { Staff, ShiftInput, AssignedShift } from '@/types';
import { Table, Typography, Space, Popover, Flex, Input, Select, ConfigProvider, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DayStatusColorMap } from '@/constants';
import { LockFilled, EditOutlined } from '@ant-design/icons';
import { grey } from '@ant-design/colors';
import './ShiftTable.module.css'
import { gray } from '@ant-design/colors';
import type { SelectProps } from 'antd';
import { getDaysInMonth } from '@/utils/date';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { DesiredOffDayColor } from '@/constants';
import { InputCounter } from '@/components/common/InputCounter';

const SHIFT_DATA_INDEX_PREFIX = 'shifts';
const desiredOffDayColor = DesiredOffDayColor[4]

interface  StaffDataType extends Staff {
  month: string;
  attendanceCount: number;
  onChange: (staff: Staff) => void;
}

interface ShiftDataType {
  [key: string]: {
    value: {
      isWorking: boolean;
      isLocked: boolean;
      isClosed: boolean;
      isBusy: boolean;
      isDesiredOffDay: boolean;
    };
    actions: {
      onChangeLock: (toggle: boolean) => void;
      onChangeAttendance: (toggle: boolean) => void;
    }
  }
}

interface DataType {
  staff: StaffDataType;
  shifts: ShiftDataType;
}

const commonCellStyle = {
  padding: '4px 4px',
  minWidth: '16px',
  textAlign: 'center' as const,
}

function LockedIcon(): ReactElement {

  const iconStyle = {
    zIndex: 20,
    color: grey[0],
  }

  return (
    <span
      style={{
        position: 'absolute',
        top: '0',
        right: '0',
        cursor: 'pointer',
      }}
    >
      <LockFilled style={{...iconStyle, opacity: 0.8 }} />
    </span>
  );
}

interface HeaderCellProps {
  date: number;
  isClosed: boolean;
  isBusy: boolean;
}

function ColumnHeaderCell({ date, isClosed, isBusy }: HeaderCellProps): ReactElement {
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

  const style = {
    ...commonCellStyle,
    textAlign: 'left' as const,
  }

  return (
    <div style={style}>
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
function RecordHeaderCell({ staff }: RecordHeaderCellProps): ReactElement {
  const { name, desiredOffDays, attendanceCount, workDays, month, onChange } = staff
  const { Text } = Typography;

  const daysInMonth = getDaysInMonth(month)

  const options: SelectProps['options'] = [...Array(daysInMonth)].map((_, index) => {
    return { label: `${index + 1}日`, value: index + 1 }
  })

  const tagRender = (props: CustomTagProps) => {
    const { label, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{
          borderColor: desiredOffDayColor,
          backgroundColor: '#fff',
          marginRight: 3
        }}
      >
        {label}
      </Tag>
    );
  };

  const handleChangeDesiredOffDays = (value: number[]) => {
    const sorted = value.sort((a, b) => a - b)
    onChange({ ...staff, desiredOffDays: sorted })
  }


  const content = (
    <span>
      <ConfigProvider
        theme={{
          token: {
            fontSize: 12,
          },
        }}
      >
        <div style={{ width: '300px' }}>
          <Text style={{color: gray[0]}}>
            名前
            <Input
              size='small'
              value={name}
              onChange={(e) => onChange({ ...staff, name: e.target.value })}
            />
          </Text >
          <Text style={{color: gray[0]}}>
            出勤数
            <div>
              <InputCounter
                size='small'
                value={workDays}
                max={daysInMonth}
                onChange={(count) => onChange({ ...staff, workDays: count })}
              />
            </div>
          </Text>
          <Text style={{color: gray[0]}}>
            希望休
            <Select
              mode="multiple"
              size="small"
              options={options}
              tagRender={tagRender}
              value={desiredOffDays}
              style={{ width: '100%' }}
              placeholder="希望休を選択してください"
              onChange={handleChangeDesiredOffDays}
            />
          </Text>
        </div>

      </ConfigProvider>
    </span>
  );

  const style = {
    ...commonCellStyle,
    textAlign: 'left' as const,
    cursor: 'pointer',
  }

  return (
    <Popover placement="rightTop" content={content} trigger="click">
      <div style={style}>
        <Flex justify="space-between">
          <Space>
            {staff.name}
            <Text type="secondary">
              ({attendanceCount}/{workDays})
            </Text>
          </Space>
          <EditOutlined style={{ color: gray[0]}} />
        </Flex>
      </div>
    </Popover>
  )
}

function DesiredOffDayDot(): ReactElement {

  return (
    <div
      style={{
        position: 'absolute',
        top: '1px',
        left: '1px',
        width: '8px',
        height: '8px',
        borderRadius: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        backgroundColor: desiredOffDayColor,
      }}
    />
  )
}

interface CellProps {
  data: ShiftDataType[keyof ShiftDataType];
}

function Cell({ data }: CellProps): ReactElement {
  const [clickTimeout, setClickTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { value, actions } = data
  const { isWorking, isClosed, isBusy, isLocked, isDesiredOffDay } = value
  const { onChangeLock, onChangeAttendance } = actions

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

  const handleSingleClick = () => {
    onChangeAttendance(!isWorking)
  }

  const handleDoubleClick = () => {
    onChangeLock(!isLocked)
  }

  const handleClick = () => {
    if (clickTimeout == null) {
      const timeout = setTimeout(() => {
        handleSingleClick();
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    } else {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      handleDoubleClick();
    }
  };

  const ContentButton: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => {
    return (
      <Button
        type="text"
        style={{ fontSize: 12 }}
        onClick={() => {
          onClick();
          setIsPopoverOpen(false);
        }}
      >
        {text}
      </Button>
    )
  }

  const content = (
    <span>
      <div>
        <ContentButton
          text={`${isWorking ? '休日' : '出勤'}に変更する`}
          onClick={() => onChangeAttendance(!isWorking)}
        />
      </div>
      <div>
        <ContentButton
          text={isLocked ? 'ロックを解除する' : 'ロックする'}
          onClick={() => onChangeLock(!isLocked)}
        />
      </div>
    </span>
  )

  return (
    <Popover
      placement="rightTop"
      content={content}
      trigger="contextMenu"
      open={isPopoverOpen}
      onOpenChange={(visible) => setIsPopoverOpen(visible)}
    >
      <div
        style={{
          ...selectDayStatusStyle({ isClosed, isBusy }),
          ...commonCellStyle,
          borderColor: DesiredOffDayColor[0],
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
        }}
        onClick={handleClick}
      >
        {isDesiredOffDay && <DesiredOffDayDot />}
        {isLocked && <LockedIcon />}
        {isWorking ? '○' : '×'}
      </div>
    </Popover>
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
      render: (value: ShiftDataType[keyof ShiftDataType]) => <Cell data={value} />,
    })),
  ];
  return columns;
}

interface CreateDataArgs {
  staffs: Staff[];
  assignedShifts: AssignedShift[];
  month: string;
  closedDays: number[];
  busyDays: number[];
  onChangeAssigned: (assigned: AssignedShift) => void;
  onChangeStaff: (staff: Staff) => void;
}

const createData = ({ staffs, month, assignedShifts, closedDays, busyDays, onChangeAssigned, onChangeStaff }: CreateDataArgs): DataType[] => {
  return staffs.map((staff) => {
    const myShifts = assignedShifts.filter((assignedShift) => assignedShift.staffId === staff.id);

    const sortedShifts = myShifts.sort((a, b) => a.date - b.date);

    const shifts = sortedShifts.reduce((acc: ShiftDataType, shift) => {
      acc[addShiftDataIndexPrefix(shift.date)] = {
        value: {

          isWorking:  shift.isWorking,
          isLocked: shift.locked,
          isClosed: closedDays.some((day) => day === shift.date),
          isBusy: busyDays.some((day) => day === shift.date),
          isDesiredOffDay: staff.desiredOffDays.some((day) => day === shift.date),
        },
        actions: {
          onChangeLock: (toggle) => {
            onChangeAssigned({
              staffId: staff.id,
              date: shift.date,
              isWorking: shift.isWorking,
              locked: toggle
            });
          },
          onChangeAttendance: (toggle) => {
            onChangeAssigned({
              staffId: staff.id,
              date: shift.date,
              locked: shift.locked,
              isWorking: toggle,
            });
          }
        }
      };
      return acc;
    }, {});

    const staffDataType = {
      ...staff,
      month,
      attendanceCount: sortedShifts.filter((shift) => shift.isWorking).length,
      onChange: onChangeStaff,
    }

    return {
      staff: staffDataType,
      shifts,
      key: staff.id,
    };
  });
};

interface ShiftTableProps {
  closedDays: number[];
  month: string;
  busyDays: number[];
  staffs: Staff[];
  shifts: ShiftInput[];
  assignedShifts: AssignedShift[];
  onChangeAssignedOne: (assigned: AssignedShift) => void;
  onChangeStaff: (staff: Staff) => void;
}

export function ShiftTable({
  closedDays,
  month,
  busyDays,
  staffs,
  shifts,
  assignedShifts,
  onChangeAssignedOne,
  onChangeStaff,
}: ShiftTableProps): ReactElement {

  const columns = createColumns({ shifts, closedDays, busyDays });
  const data = createData({ 
    staffs,
    month,
    assignedShifts,
    closedDays,
    busyDays,
    onChangeAssigned: onChangeAssignedOne,
    onChangeStaff
  });

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
