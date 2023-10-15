import { ReactElement } from "react";
import { Space, ConfigProvider } from 'antd';
import { InputCounter } from '@/components/common/InputCounter'
import { DayStatusColorMap } from '@/constants'

interface RequiredStaffCountProps {
  value: number
  type: 'normal' | 'busy'
  onChange: (count: number) => void
}

export function RequiredStaffCount({ value, type, onChange }: RequiredStaffCountProps): ReactElement {

  const nameMap = {
    normal: '通常日',
    busy: '忙しい日',
  }

  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            ...(type === 'busy' && { colorPrimary: DayStatusColorMap.busy[4] })
          },
          components: {
            Button: {
              ...(type === 'busy' && {
                defaultBorderColor: DayStatusColorMap.busy[1],
                defaultColor: DayStatusColorMap.busy[4],
                defaultBg: DayStatusColorMap.busy[0],
              })
            },
            Input: {
              ...(type === 'busy' && { colorBorder: DayStatusColorMap.busy[1] })
            }
          }
        }}
      >
        <Space>
          <span style={{ fontSize: 12 }}>{nameMap[type]}</span>
          <InputCounter
            value={value}
            onChange={onChange}
            size="small"
            min={0}
          />
        </Space>
      </ConfigProvider>
    </>
  )
}
