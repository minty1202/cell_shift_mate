import { ReactElement } from "react"
import { Space, ConfigProvider } from 'antd';
import { InputCounter } from '@/components/common/InputCounter'
import { TierNameMap, TierColorMap } from '@/constants'

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
            defaultColor: TierColorMap[tier][4],
            defaultBg: TierColorMap[tier][0],
          },
          Input: {
            colorBorder: TierColorMap[tier][1],
          }
        }
      }}
    >
      <Space>
        <span
          style={{ fontSize: 12 }}
        >
          {TierNameMap[tier]}
        </span>
        <InputCounter
          value={value}
          onChange={(num) => onChange({ tier, count: num })}
          size="small"
          min={0}
        />
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
