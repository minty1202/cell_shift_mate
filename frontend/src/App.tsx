import { ShiftSchedulePage } from '@/pages/ShiftSchedulePage'

import { ConfigProvider } from 'antd';

import locale from 'antd/lib/locale/ja_JP';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
dayjs.locale('ja');

function App() {

  return (
    <>
      <ConfigProvider locale={locale}>
        <ShiftSchedulePage />
      </ConfigProvider>
    </>
  )
}

export default App
