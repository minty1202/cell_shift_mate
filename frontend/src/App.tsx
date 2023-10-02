import { useState } from 'react'
import { ShiftTable } from './components/Shift/ShiftTable'
import { postShift } from './api/shift/postShiftApi'
import { AssignedShift } from '@/types'

import { staffs as staffInput, shifts, closedDays, busyDays, assignedShifts as assignedShiftsData } from '@/sample/sample';

function App() {
  const [assignedShifts, setAssignedShifts] = useState<AssignedShift[]>(assignedShiftsData)

  const handlePost = async () => {
    const res = await postShift()
    const data = await res.json()
    console.log(data)
    setAssignedShifts(data)
  }

  const staffs = staffInput.map((staff) => {
    return {
      id: staff.id,
      name: String(staff.id),
      tier: staff.tier,
      desiredOffDays: staff.desiredOffDays,
      workDays: staff.workDays,
    }
  })

  return (
    <>
      <button onClick={handlePost}>post</button>
      <ShiftTable
        closedDays={closedDays}
        busyDays={busyDays}
        staffs={staffs}
        shifts={shifts}
        assignedShifts={assignedShifts}
      />
    </>
  )
}

export default App
