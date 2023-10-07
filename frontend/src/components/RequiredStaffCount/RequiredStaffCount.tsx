import { ReactElement } from "react";
import { Typography } from 'antd';
import { InputCounter } from '@/components/common/InputCounter'

interface RequiredStaffCountProps {
  value: number
  type: 'normal' | 'busy'
  onChange: (count: number) => void
}

export function RequiredStaffCount({ value, type, onChange }: RequiredStaffCountProps): ReactElement {
  const { Text } = Typography;

  const nameMap = {
    normal: '通常日',
    busy: '忙しい日',
  }

  return (
    <>
      <Text strong>{nameMap[type]}の必要人数</Text>
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
