import { DatePicker } from 'antd';
import dayjs from 'dayjs';

interface MonthPickerProps {
  value: string
  onChange: (date: string) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  return (
    <DatePicker
      format='YYYY年MM月'
      size='small'
      picker="month"
      allowClear={false}
      value={dayjs(value)}
      onChange={(date) => {
        const month = dayjs(date).format('YYYY-MM')
        onChange(month)
      }}
    />
  )
}
