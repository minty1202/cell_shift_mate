import { ReactElement } from "react";
import { InputCounter } from '@/components/common/InputCounter'

interface RequiredAttendanceTierCounterProps {
  value: number
  onChange: (count: number) => void
}

export function RequiredAttendanceTierCounter({ value, onChange }: RequiredAttendanceTierCounterProps): ReactElement {

  return (
    <>
      <InputCounter
        value={value}
        onChange={onChange}
        size="small"
        min={0}
      />
    </>
  )
}
