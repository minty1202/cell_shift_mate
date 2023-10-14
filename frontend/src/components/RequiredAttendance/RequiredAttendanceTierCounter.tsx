import { ReactElement } from "react";
import { Typography } from 'antd';
import { InputCounter } from '@/components/common/InputCounter'

interface RequiredAttendanceTierCounterProps {
  value: number
  onChange: (count: number) => void
}

export function RequiredAttendanceTierCounter({ value, onChange }: RequiredAttendanceTierCounterProps): ReactElement {
  const { Text } = Typography;

  return (
    <>
      <Text strong>必須役職の必要人数</Text>
      <br />
      <InputCounter
        value={value}
        onChange={onChange}
        size="small"
        min={0}
      />
    </>
  )
}
