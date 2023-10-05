import { DatePicker as AntdDatePicker } from 'antd';

export function DatePicker() {
  return (
    <AntdDatePicker
      format={'YYYY年MM月'}
      picker="month"
    />
  )
}
