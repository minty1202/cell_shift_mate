import { useState } from 'react'
import { ShiftTable } from './components/Shift/ShiftTable'
import { postShift } from './api/shift/postShiftApi'

function App() {
  const [shifts, setShifts] = useState({})

  const handlePost = async () => {
    const res = await fetch('http://localhost:5000/api/v1/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shifts: 'test',
        staffs: 'test',
      })
    })
    const data = await res.json()
    setShifts(data)
  }

  return (
    <>
      <button onClick={handlePost}>post</button>

      <button onClick={postShift}>postShift</button>
      <ShiftTable />
    </>
  )
}

export default App
