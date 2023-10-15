import { ReactElement } from "react";
import { Select, Space, Tag, Typography } from 'antd';
import type { SelectProps } from 'antd';
import { Tiers, TierNameMap, TierColorMap } from '@/constants'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { CloseCircleOutlined } from '@ant-design/icons';

const tagRender = (props: CustomTagProps) => {
  const { label, value, closable, onClose } = props;
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Tag
      onMouseDown={onPreventMouseDown}
      style={{
        backgroundColor: TierColorMap[value][0],
        color: TierColorMap[value][4],
        marginRight: 3
      }}
    >
      <div style={{display: 'flex'}}>
        {label}&nbsp;
        {closable && <CloseCircleOutlined onClick={onClose} />}
      </div>
    </Tag>
  );
};

interface RequiredAttendanceTiersProps {
  value: number[]
  onChange: (value: number[]) => void
}

export function RequiredAttendanceTiers({ value, onChange }: RequiredAttendanceTiersProps): ReactElement {
  const { Text } = Typography;

  const options: SelectProps['options'] = Tiers.map((tier) => {
    return { label: TierNameMap[tier], value: tier }
  })

  const handleChange = (value: number[]) => {
    const sorted = value.sort((a, b) => a - b)
    onChange(sorted)
  }

  return (
    <>
      <Space style={{ width: '20%' }} direction="vertical">
      <Text strong>必須役職の選択</Text>
        <Select
          mode="multiple"
          options={options}
          value={value}
          tagRender={tagRender}
          style={{ width: '100%' }}
          placeholder="役職を選択選択してください"
          onChange={handleChange}
        />
      </Space>
    </>
  )
}
