from dataclasses import dataclass
from ortools.sat.python import cp_model

@dataclass
class ShiftScheduleModelAttributes:
    """
    シフトスケジュールモデルの属性を格納するデータクラス

    属性:
    - date (int): シフトの日付
    - staff_id (int): スタッフのID
    - locked (bool): シフトがロックされているかどうかを示すフラグ
    - is_working_variable (cp_model.IntVar): スタッフがシフトで働いているかどうかを示すCP-SATモデルのブール変数
    """
    date: int
    staff_id: int
    locked: bool
    is_working_variable: cp_model.IntVar = None

class ShiftScheduleModel:
    """
    スタッフスケジューリングのCP-SATモデルと変数を管理するクラス

    メソッド:
    - __init__(shifts, staffs, locked): init
    - _create_shift_schedule_model_attributes(shifts, staffs, locked): 
      与えられたシフトとスタッフに対するShiftScheduleModelAttributesオブジェクトを作成し、リストとして返します
    """
    def __init__(self, shifts, staffs, locked):
        """
        与えられたシフト、スタッフ、ロックされたシフトでShiftScheduleModelを初期化します

        パラメータ:
        - shifts (list of Shift): 各シフトには日付、必要なスタッフ数などの情報が含まれています
        - staffs (list of Staff): 各スタッフにはID、役職レベル、希望休、週に働ける日数などの情報が含まれています
        - locked (list of LockedShift): 各要素はロックされているシフトの情報を保持し、スタッフID、シフト日、働いているかどうかの情報を含んでいます
        """
        self.model = cp_model.CpModel()
        self.shift_schedule_model_attributes = self._create_shift_schedule_model_attributes(shifts, staffs, locked)

    def _create_shift_schedule_model_attributes(self, shifts, staffs, locked):
        """
        与えられたシフトとスタッフに対するShiftScheduleModelAttributesオブジェクトを作成し、リストとして返します
        
        パラメータ:
        - shifts (list): init メソッドのパラメータと同じ
        - staffs (list): init メソッドのパラメータと同じ
        - locked (list): init メソッドのパラメータと同じ

        戻り値:
        - ShiftScheduleModelAttributesのリスト: 各シフトとスタッフメンバーに関連するシフト属性と関連するCP-SATモデル変数を含むリスト
        """
        locked_shifts_dict = {(l.date, l.staff_id): l.is_working for l in locked}

        shift_list = [
            ShiftScheduleModelAttributes(
                date = shift.date,
                staff_id = staff.id,
                locked = locked_shifts_dict.get((shift.date, staff.id), False),
                is_working_variable=self.model.NewBoolVar(f"shift_{shift.date}_{staff.id}")
            )
            for shift in shifts
            for staff in staffs
        ]

        for shift in shift_list:
            if (shift.date, shift.staff_id) in locked_shifts_dict:
                self.model.Add(shift.is_working_variable == int(locked_shifts_dict[(shift.date, shift.staff_id)]))

        return shift_list

    def solve(self):
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            print('Solution found:')
        else:
            print('No solution found.')
