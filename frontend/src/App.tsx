import { ShiftSchedulePage } from '@/pages/ShiftSchedulePage'
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
dayjs.locale('ja'); // dayjs のロケールを設定

function App() {

  return (
    <>
      <ShiftSchedulePage />
    </>
  )
}

export default App
