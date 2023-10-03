from dataclasses import dataclass
from ortools.sat.python import cp_model
import logging
logger = logging.getLogger(__name__)

@dataclass
class ScheduleAttributes:
    """
    特定日に誰が出勤するかを示す属性を保持するクラス
    シフトスケジュールモデルの

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
      与えられたシフトとスタッフに対するScheduleAttributesオブジェクトを作成し、リストとして返します
    """
    def __init__(self, shifts, staffs, locked):
        """
        与えられたシフト、スタッフ、ロックされたシフトでShiftScheduleModelを初期化します

        Parameters:
        - shifts (list of Shift): 各シフトには日付、必要なスタッフ数などの情報が含まれています
        - staffs (list of Staff): 各スタッフにはID、役職レベル、希望休、週に働ける日数などの情報が含まれています
        - locked (list of LockedShift): 各要素はロックされているシフトの情報を保持し、スタッフID、シフト日、働いているかどうかの情報を含んでいます
        """
        self.model = cp_model.CpModel()
        self.shift_schedule_model_attributes = self._create_shift_schedule_model_attributes(shifts, staffs, locked)

    def _create_shift_schedule_model_attributes(self, shifts, staffs, locked):
        """
        与えられたシフトとスタッフに対するScheduleAttributesオブジェクトを作成し、リストとして返します
        
        Parameters:
        - shifts (list): init メソッドの Parameters と同じ
        - staffs (list): init メソッドの Parameters と同じ
        - locked (list): init メソッドの Parameters と同じ

        戻り値:
        - ScheduleAttributesのリスト: 各シフトとスタッフメンバーに関連するシフト属性と関連するCP-SATモデル変数を含むリスト
        """
        locked_shifts_dict = {(l.date, l.staff_id): l.is_working for l in locked}

        shift_list = [
            ScheduleAttributes(
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

    def add_constraints(self, constraints):
        """
        制約を追加するメソッド
        models/constraints.py で作られた各クラスのインスタンスのリストを受け取り、
        それぞれのインスタンスに定義された add_constraints() メソッドを実行することで制約を追加する
        """
        for constraint in constraints:
            constraint.add_constraints(self.model, self.shift_schedule_model_attributes)

    def solve(self):
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            logger.info('解あり')
            logger.info(solver.ObjectiveValue())
            return [
                {
                    'date': shift.date,
                    'staffId': shift.staff_id,
                    'isWorking': solver.Value(shift.is_working_variable),
                    'locked': shift.locked
                }
                for shift in self.shift_schedule_model_attributes
            ]
        else:
            logger.error('解なし')
