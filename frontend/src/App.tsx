import { useState } from 'react'
import { ShiftTable } from './components/Shift/ShiftTable'
import { postShift } from './api/shift/postShiftApi'

function App() {
  const [shifts, setShifts] = useState({})

  const handlePost = async () => {
    const res = await postShift()
    const data = await res.json()
    setShifts(data)
  }

  return (
    <>
      <button onClick={handlePost}>post</button>
      <ShiftTable />
      {shifts && <div>{JSON.stringify(shifts)}</div>}
    </>
  )
}

export default App
