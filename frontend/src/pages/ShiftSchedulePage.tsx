import { ReactElement } from "react";
import { ShiftTable } from '@/components/Shift/ShiftTable'
import { optimizeShift } from '@/api/shift/optimizeShiftApi'
import { DatePicker } from '@/components/DatePicker/DatePicker'
import { DaysStatusSelector } from '@/components/DaysStatusSelector/DaysStatusSelector'

import { Tiers } from '@/constants'
import { TieredStaffCounter } from '@/components/TieredStaffCounter/TieredStaffCounter'

import { ShiftManagementProvider, useShiftManagement } from '@/contexts/ShiftManagementContext'

function ShiftSchedule() : ReactElement {
  const { state, actions } = useShiftManagement()
  const { staffs, shiftSchedules, shifts, assignedShifts } = state

  const handlePost = async () => {
    const res = await optimizeShift(actions.createShiftsInput())
    const data = await res.json()
    console.log(data)
    actions.updateAssignedShifts(data)
  }

  const tierCounts = Tiers.map((tier) => {
    const count = staffs.filter((s) => s.tier === tier).length
    return { tier, count }
  })

  /**
   * tierCounts が変更されたときに、staffs を更新する
   * カウントが増えたときは、新しいスタッフを追加する
   * カウントが減ったときは、古いスタッフを削除する
   */
  const handleChangeTierCounts = (tierCounts: { tier: number, count: number }[]) => {
    tierCounts.forEach((tc) => {
      const staffsCount = staffs.filter((s) => s.tier === tc.tier).length
      if (staffsCount === tc.count) return
      
      if (staffsCount < tc.count) {
        actions.addStaff({
          tier: tc.tier,
        })
      } else {
        const staffsToDelete = staffs.filter((s) => s.tier === tc.tier).slice(0, staffsCount - tc.count)
        staffsToDelete.forEach((s) => actions.removeStaff(s.id))
      }
    })
  }

  const handleUpdateShiftSchedule = (days: { closedDays: number[], busyDays: number[] }) => {
    actions.updateShiftSchedule(days)
  }

  return (
    <>
      <DatePicker value={shiftSchedules.month} onChange={(month) => actions.updateShiftSchedule({ month })} />
      <br />
      <TieredStaffCounter value={tierCounts} onChange={handleChangeTierCounts} />
      <br />
      <DaysStatusSelector
        month={shiftSchedules.month}
        closedDays={shiftSchedules.closedDays}
        busyDays={shiftSchedules.busyDays}
        onChange={handleUpdateShiftSchedule}
      />
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