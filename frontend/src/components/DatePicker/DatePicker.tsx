import { DatePicker as AntdDatePicker } from 'antd';
import dayjs from 'dayjs';

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <AntdDatePicker
      format={'YYYY年MM月'}
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
