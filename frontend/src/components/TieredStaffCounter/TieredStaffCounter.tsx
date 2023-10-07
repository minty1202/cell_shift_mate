import { ReactElement } from "react"
import { Input as AntdInput, Space, Button, ConfigProvider } from 'antd';
import { TierNameMap, TierColorMap } from '@/constants'


interface AddonProps {
  type: 'before' | 'after'
  tier: number
  disabled?: boolean
  onClick: () => void
}

function AddonButton({ type, tier, disabled = false, onClick }: AddonProps) {
  const addonNameMap = {
    before: '-',
    after: '+',
  }

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      style={{
        backgroundColor: !disabled ? TierColorMap[tier][1] : undefined,
        color: !disabled ? TierColorMap[tier][4] : undefined,
      }}
    >
      {addonNameMap[type]}
    </Button>
  )
}

interface InputProps {
  tier: number
  value: number
  onChange: ({ tier, count }: { tier: number, count: number }) => void
}

function Input({  tier, value, onChange }: InputProps) {

  return (
    <>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: TierColorMap[tier][4],
        },
        components: {
          Button: {
            defaultBorderColor: TierColorMap[tier][1],
          },
          Input: {
            colorBorder: TierColorMap[tier][1],
          }
        }
      }}
    >
      <Space>
        <span>{TierNameMap[tier]}</span>
        <Space.Compact>
          <AddonButton
            type="before"
            tier={tier}
            disabled={value === 0}
            onClick={() => onChange({ tier, count: value - 1 })}
          />
          <AntdInput 
            readOnly
            value={value}
            min={0}
            style={{
              textAlign: 'right',
              width: '40px',
            }}
          />
          <AddonButton type="after" tier={tier} onClick={() => onChange({ tier, count: value + 1 })} />
        </Space.Compact>
      </Space>
      </ConfigProvider>
    </>
  )
}

interface TieredStaffCounterProps {
  value: { tier: number, count: number }[]
  onChange: (value: { tier: number, count: number }[]) => void
}

/**
 * Tier ごとのスタッフ数を入力するコンポーネント
 */
export function TieredStaffCounter({ value, onChange }: TieredStaffCounterProps): ReactElement {

  return (
    <>
      <Space size="middle">
        {value.map((v) => {
          return (
            <Input
              key={`${TierNameMap[v.tier]}-${v.tier}`}
              tier={v.tier}
              value={v.count}
              onChange={({ tier, count }) => {
                const newTierCounts = value.map((tc) => {
                  if (tc.tier === tier) {
                    return { ...tc, count }
                  }
                  return tc
                })
                onChange(newTierCounts)
              }}
            />
          )
        })}
      </Space>
    </>
  )
}
