import { useState, ReactElement } from "react";
import { ShiftTable } from '@/components/ShiftTable/ShiftTable'
import { optimizeShift } from '@/api/shift/optimizeShiftApi'
import { MonthPicker } from '@/components/MonthPicker/MonthPicker'
import { DaysStatusSelector } from '@/components/DaysStatusSelector/DaysStatusSelector'
import { RequiredAttendanceTiers } from '@/components/RequiredAttendance/RequiredAttendanceTiers'
import { RequiredAttendanceTierCounter } from '@/components/RequiredAttendance/RequiredAttendanceTierCounter'

import { Tiers } from '@/constants'
import { TieredStaffCounter } from '@/components/TieredStaffCounter/TieredStaffCounter'

import { ShiftManagementProvider, useShiftManagement } from '@/contexts/ShiftManagementContext'

import { RequiredStaffCount } from '@/components/RequiredStaffCount/RequiredStaffCount'

import { WorkDaysCounter } from '@/components/WorkDaysCounter/WorkDaysCounter'

import holiday_jp from '@holiday-jp/holiday_jp'
import dayjs from 'dayjs';
import { Space, Divider, Button, Typography } from "antd";

function ShiftSchedule() : ReactElement {
  const [loading, setLoading] = useState(false)
  const { state, actions } = useShiftManagement()
  const { staffs, staffBaseSettings, shiftSchedules, shifts, assignedShifts } = state
  const { Text } = Typography;

  const handlePost = async () => {
    setLoading(true)
    const res = await optimizeShift(actions.createShiftsInput())
    setLoading(false)
    const data = await res.json()
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
      <div
        style={{
          padding: 24,
          backgroundColor: '#fff',
          borderRadius: 6,
          width: '100%',
        }}
      >
        <Space
          direction="vertical"
          size='small'
          split={<Divider 
            style={{
              height: '100%',
              margin: '8px 0'
            }}
          />}
          style={{
            width: '100%',
          }}
        >
          <div>
            <Space direction="vertical">
            <Text strong>作成月を選択</Text>
            <MonthPicker value={shiftSchedules.month} onChange={(month) => actions.updateShiftSchedule({ month })} />
            </Space>
          </div>
          <div>
            <Space direction="vertical">
              <Text strong>スタッフの人数を設定</Text>
              <TieredStaffCounter value={tierCounts} onChange={handleChangeTierCounts} />
            </Space>
          </div>
          <div>
            <Space direction="vertical">
              <Text strong>スタッフの出勤日数を設定</Text>
              <WorkDaysCounter value={staffBaseSettings.workDays} month={shiftSchedules.month} onChange={(count) => actions.updateStaffsWorkDays(count)} />
            </Space>
          </div>
          <div>
            <Space direction="vertical">
              <Text strong>スケジュールを設定</Text>
              <DaysStatusSelector
                month={shiftSchedules.month}
                closedDays={shiftSchedules.closedDays}
                busyDays={shiftSchedules.busyDays}
                onChange={handleUpdateShiftSchedule}
              />
            </Space>
          </div>
          <div>
            <Space direction="vertical">
            <Text strong>必要人数を設定</Text>
              <Space size="middle">
                <RequiredStaffCount type='normal' value={shiftSchedules.requiredStaffCountOnNormal} onChange={(count) => actions.updateShiftSchedule({ requiredStaffCountOnNormal: count })} />
                <RequiredStaffCount type='busy' value={shiftSchedules.requiredStaffCountOnBusy} onChange={(count) => actions.updateShiftSchedule({ requiredStaffCountOnBusy: count })} />
              </Space>
            </Space>
          </div>
          <div>
            <RequiredAttendanceTiers value={shiftSchedules.requiredAttendanceTiers} onChange={(tiers) => actions.updateShiftSchedule({ requiredAttendanceTiers: tiers })} />
          </div>
          <div>
            <Space direction="vertical">
              <Text strong>必須役職の必要人数</Text>
              <RequiredAttendanceTierCounter value={shiftSchedules.requiredAttendanceTierCount} onChange={(count) => actions.updateShiftSchedule({ requiredAttendanceTierCount: count })} />
            </Space>
          </div>
        </Space>
      </div>
      <div
        style={{
          marginTop: '24px',
          padding: 24,
          backgroundColor: '#fff',
          borderRadius: 6,
        }}
      >
        <ShiftTable
          month={shiftSchedules.month}
          closedDays={shiftSchedules.closedDays}
          busyDays={shiftSchedules.busyDays}
          staffs={staffs}
          shifts={shifts}
          assignedShifts={assignedShifts}
          onChangeAssignedOne={actions.updateAssignedShiftOne}
          onChangeStaff={actions.updateStaff}
        />
         <div
          style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
         >
          <Button
            type="primary"
            loading={loading}
            onClick={handlePost}
          >
            作成する
          </Button>
         </div>
      </div>
    </>
  )
}

export function ShiftSchedulePage(): ReactElement {

  const nextMonth = dayjs().add(1, 'month').startOf('month')
  const nextMonthStr = nextMonth.format('YYYY-MM')

  // 祝日を取得する
  const firstDay = nextMonth.startOf('month').format('YYYY-MM-DD')
  const lastDay = nextMonth.endOf('month').format('YYYY-MM-DD')
  const holiday = [...holiday_jp.between(new Date(firstDay), new Date(lastDay))].map((h) => {
    return dayjs(new Date(h.date)).date()
  })

  //  土日を取得する
  const weekend = [...Array(nextMonth.daysInMonth()).keys()].map((i) => {
    const date = nextMonth.date(i + 1)
    if (date.day() === 0 || date.day() === 6) return i + 1
    return null
  }).filter((i) => i !== null) as number[]

  const busyDays = [...holiday, ...weekend].sort((a, b) => a - b)
  
  const initialStaffManagement = {
    workDays: 20
  }

  // とりあえず初期値を入れておく
  // 本来は staffs から計算したほうがいい
  const initialShiftSchedules = {
    month: nextMonthStr,
    busyDays: busyDays,
    requiredStaffCountOnNormal: 3,
    requiredStaffCountOnBusy: 4,
    requiredAttendanceTiers: [1, 2],
    requiredAttendanceTierCount: 1,
  }

  const initialState = {
    staffManagement: initialStaffManagement,
    shiftSchedule: initialShiftSchedules
  }

  return (
    <ShiftManagementProvider initialState={initialState}>
      <ShiftSchedule />
    </ShiftManagementProvider>
  )
}
