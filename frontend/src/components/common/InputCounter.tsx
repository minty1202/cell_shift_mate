import { ReactElement } from "react"
import { Input as AntdInput, Space, Button } from 'antd';

interface AddonProps {
  type: 'before' | 'after'
  disabled?: boolean
  size: 'small' | 'middle' | 'large'
  onClick: () => void
}

function AddonButton({ type, disabled = false, size, onClick }: AddonProps) {
  const addonNameMap = {
    before: '-',
    after: '+',
  }

  return (
    <Button
      size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {addonNameMap[type]}
    </Button>
  )
}

interface InputProps {
  value: number
  onChange: (count: number) => void
  size?: 'small' | 'middle' | 'large'
  min?: number
  max?: number
}

export function InputCounter({
  value,
  onChange,
  size = 'middle',
  min = 0,
  max = Infinity,
}: InputProps): ReactElement {
  const { Compact } = Space;

  return (
    <>
      <Compact>
        <AddonButton
          type="before"
          size={size}
          disabled={value === min}
          onClick={() => onChange(value - 1)}
        />
        <AntdInput 
          readOnly
          size={size}
          value={value}
          min={0}
          style={{
            textAlign: 'right',
            width: '40px',
          }}
        />
        <AddonButton
          type="after"
          size={size}
          disabled={value === max}
          onClick={() => onChange(value + 1)}
        />
      </Compact>
    </>
  )
}
