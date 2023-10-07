import { ReactElement } from "react";
import { Typography } from 'antd';
import { InputCounter } from '@/components/common/InputCounter'

interface RequiredAttendanceTierCountProps {
  value: number
  onChange: (count: number) => void
}

export function RequiredAttendanceTierCount({ value, onChange }: RequiredAttendanceTierCountProps): ReactElement {
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
