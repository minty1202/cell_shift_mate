import { ReactElement } from "react";
import { Typography, Space } from 'antd';
import { InputCounter } from '@/components/common/InputCounter'
import { getDaysInMonth } from '@/utils/date';

interface WorkDaysCounterProps {
  value: number
  month: string
  onChange: (count: number) => void
}

export function WorkDaysCounter({ value, month, onChange }: WorkDaysCounterProps): ReactElement {
  const { Text } = Typography;

  return (
    <>
      <Space>
        <InputCounter
          value={value}
          onChange={onChange}
          size="small"
          min={0}
        />
        <Text type="secondary">
          (休日 {getDaysInMonth(month) - value} 日)
        </Text>
      </Space>
    </>
  )
}
