import { useState, ReactElement } from "react";
import { ShiftTable } from '@/components/Shift/ShiftTable'
import { optimizeShift } from '@/api/shift/optimizeShiftApi'
import { DatePicker } from '@/components/DatePicker/DatePicker'

import { staffs as sampleStaffs, shifts as sampleShifts, lockedShift } from '@/sample/sample';

import { ShiftManagementProvider, useShiftManagement } from '@/contexts/ShiftManagementContext'

function ShiftSchedule() : ReactElement {
  const [staffCount, setStaffCount] = useState<number>(0)
  const { state, actions } = useShiftManagement()
  const { staffs, shiftSchedules, shifts, assignedShifts } = state

  const handlePost = async () => {
    const res = await optimizeShift(actions.createShiftsInput())
    const data = await res.json()
    console.log(data)
    actions.updateAssignedShifts(data)
  }

  const handelAddStaffs = () => {
    if (staffCount === sampleStaffs.length) {
      alert('サンプルもうないで')
      return 
    }

    const staff = sampleStaffs[staffCount]
    actions.addStaff({
      id: staff.id,
      tier: staff.tier,
      desiredOffDays: staff.desiredOffDays,
      workDays: staff.workDays,
    })
    setStaffCount(staffCount + 1)
  }

  return (
    <>
      <DatePicker value={shiftSchedules.month} onChange={(month) => actions.updateShiftSchedule({ month })} />
      <br />
      <button onClick={handelAddStaffs}>add staffs</button>
      <br />
      <button onClick={handlePost}>post</button>
      <ShiftTable
        closedDays={shiftSchedules.closedDays}
        busyDays={shiftSchedules.busyDays}
        staffs={staffs}
        shifts={shifts}
        assignedShifts={assignedShifts}
      />
    </>
  )
}

export function ShiftSchedulePage(): ReactElement {
  return (
    <ShiftManagementProvider>
      <ShiftSchedule />
    </ShiftManagementProvider>
  )
}