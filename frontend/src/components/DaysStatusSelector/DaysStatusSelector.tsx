import { ReactElement } from "react";
import { ConfigProvider, Calendar as AntdCalendar, Popover, Button, Tag, Space } from 'antd';
import { DayStatus } from '@/types'
import { DayStatusColorMap } from '@/constants'

import dayjs, { Dayjs } from 'dayjs';

import { CalendarOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface CalendarProps {
  month: string
  target: DayStatus
  closedDays: number[]
  busyDays: number[]
  onChange: (targetDays: number[]) => void
}

function Calendar({ month, target, closedDays, busyDays, onChange }: CalendarProps): ReactElement {
  const startMonth = dayjs(month).startOf('month')


  const disabledDate = (month: string, current: Dayjs) => {
    return !current || current.isBefore(dayjs(month).startOf('month')) || current.isAfter(dayjs(month).endOf('month'));
  };

  const headerRender = () => {

    const commonStyle = {
      width: '24px',
      height: '24px',
      borderRadius: 4,
    }

    return (
      <Space
        style={{
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Space>
          <div style={{ ...commonStyle, backgroundColor: DayStatusColorMap['closed'][1]}} />
          <span style={{ marginRight: '8px' }}>定休日</span>
        </Space>
        <Space>
          <div style={{ ...commonStyle, backgroundColor: DayStatusColorMap['busy'][1] }} />
          <span>忙しい日</span>
        </Space>
      </Space>
    )
  }

  const dateCellRender = (date: Dayjs) => {
    const closedDaysWithYearMonth = closedDays.map((d) => dayjs(`${month}-${d}`))
    const isClosed = closedDaysWithYearMonth.some((d) => d.isSame(date, 'day'))

    const busyDaysWithYearMonth = busyDays.map((d) => dayjs(`${month}-${d}`))
    const isBusy = busyDaysWithYearMonth.some((d) => d.isSame(date, 'day'))

    const closedDaysStyle = {
      backgroundColor: DayStatusColorMap['closed'][1],
      color: DayStatusColorMap['closed'][6],
      borderRadius: 4,
      cursor: target === 'closed' ? 'pointer' : 'default',
    }

    const busyDaysStyle = {
      backgroundColor: DayStatusColorMap['busy'][1],
      color: DayStatusColorMap['busy'][6],
      borderRadius: 4,
      cursor: target === 'busy' ? 'pointer' : 'default',
    }

    const applyStyle = () => {
      if (isClosed) {
        return closedDaysStyle
      }
      if (isBusy) {
        return busyDaysStyle
      }
      return {}
    }

    const handleClick = () => {
      switch (target) {
        case 'closed':
          if (isBusy) return
          if (isClosed) {
            onChange(closedDays.filter((d) => d !== date.date()))
          } else {
            onChange([...closedDays, date.date()].sort((a, b) => a - b))
          }
          break
        case 'busy':
          if (isClosed) return
          if (isBusy) {
            onChange(busyDays.filter((d) => d !== date.date()))
          } else {
            onChange([...busyDays, date.date()].sort((a, b) => a - b))
          }
          break
      }
    }

    return (
      <div
        style={{
          display: 'inline-block',
          minWidth: '24px',
          height: '24px',
          lineHeight: '24px',
        }}
      >
        <div
          style={applyStyle()}
          onClick={handleClick}
        >
          {date.date()}
        </div>
      </div>
    )
  }

  return (
    <>
      <AntdCalendar
        defaultValue={startMonth}
        fullscreen={false}
        disabledDate={(current) => disabledDate(month, current)}
        style={{ width: 300 }}
        headerRender={headerRender}
        fullCellRender={dateCellRender}
      />
    </>
  )
}

interface DaySelector {
  month: string
  target: DayStatus
  closedDays: number[]
  busyDays: number[]
  onChange: ({ closedDays, busyDays }: { closedDays: number[], busyDays: number[] }) => void
}

const DaySelector = ({ month, target, closedDays, busyDays, onChange }: DaySelector) => {

  const title = (
    <div style={{ textAlign: 'right' }}>
      {dayjs(month).format('YYYY年MM月')}
    </div>
  )

  const closedContent = (
    <Calendar
      month={month}
      target='closed'
      closedDays={closedDays}
      busyDays={busyDays}
      onChange={(targetDays) => {
        onChange({ closedDays: targetDays, busyDays })
      }}
    />
  )

  const busyContent = (
    <Calendar
      month={month}
      target='busy'
      closedDays={closedDays}
      busyDays={busyDays}
      onChange={(targetDays) => {
        onChange({ closedDays, busyDays: targetDays })
      }}
    />
  )

  const targetDaysMap = {
    closed: {
      name: '定休日',
      days: closedDays,
      color: DayStatusColorMap['closed'],
      content: closedContent,
    },
    busy: {
      name: '忙しい日',
      days: busyDays,
      color: DayStatusColorMap['busy'],
      content: busyContent,
    },
  }

  const dayStatus = targetDaysMap[target]

  return (
    <>
      {/* Tag の API では文字色等のカスタマイズができないため、ConfigProvider を使用 */}
      <ConfigProvider
        theme={{
          components: {
            Tag: {
              defaultBg: dayStatus['color'][1],
              defaultColor: dayStatus['color'][6],
              colorBorder: dayStatus['color'][1],
            },
          },
        }}
      >
        <Space>
          <Popover placement="bottomLeft" title={title} content={dayStatus.content} trigger="click">
              <Button
                type='text'
                style={{
                  textAlign: 'left',
                  minWidth: '160px',
                }}
              >
                {dayStatus.name}を選択
                <CalendarOutlined />
              </Button>
          </Popover>
          {dayStatus.days.map((d) => (
            <Tag key={`${target}-${month}-${d}`}>
              <div style={{display: 'flex'}}>
                {d}日&nbsp;
                <CloseCircleOutlined
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onChange({
                      closedDays: target === 'closed' ? closedDays.filter((day) => day !== d) : closedDays,
                      busyDays: target === 'busy' ? busyDays.filter((day) => day !== d) : busyDays,
                    })
                  }}
                />
              </div>
            </Tag>
          ))}
        </Space>
      </ConfigProvider>
    </>
  )
}

interface DaysStatusSelector {
  month: string
  closedDays: number[]
  busyDays: number[]
  onChange: ({ closedDays, busyDays }: { closedDays: number[], busyDays: number[] }) => void
}

export function DaysStatusSelector({ month, closedDays, busyDays, onChange }: DaysStatusSelector): ReactElement {
  const daySelectorCommonProps = {
    month,
    closedDays,
    busyDays,
    onChange,
  }

  return (
    <>
      <DaySelector 
        {...daySelectorCommonProps}
        target='closed'
      />
      <br />
      <DaySelector 
        {...daySelectorCommonProps}
        target='busy'
      />
    </>
  )
}
