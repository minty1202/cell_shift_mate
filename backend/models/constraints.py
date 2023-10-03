from dataclasses import dataclass

class ConstraintsBase:
    """
    制約を追加するの基底クラス
    add_constraints()メソッドを持つ
    """
    def add_constraints(self, _, __):
        """
        制約を追加するメソッド

        Parameters:
        - self
        - model: cp_model
        - schedule_list: ScheduleAttributes のリスト
        """
        raise NotImplementedError("add_constraints() must be implemented.")

class StaffConstraints(ConstraintsBase):
    """
    スタッフメンバーに関する制約を追加するクラス
    作られたインスタンスは ShiftScheduleModel クラスの add_constraints() メソッドに渡される
    """

    def __init__(self, staffs):
        self.staffs = staffs
        self.staffs_dict = {staff.id: staff for staff in staffs}

    def _create_schedule_dict(self, schedule_list):
        """
        スタッフメンバーのIDをキーとして、スケジュールを辞書にまとめる
        ex {staff_id_1: [schedule_list], staff_id_2: [schedule_list], ...}

        Parameters:
            - schedule_list: list, ScheduleAttributesのリスト
        """
        return {staff.id: [s for s in schedule_list if s.staff_id == staff.id] for staff in self.staffs}

    def _add_work_days_constraints(self, model, schedule_dict):
        """
        スタッフの出勤数が work_days と一致するように制約を追加する

        Parameters:
            - model: cp_model.CpModel, 制約プログラミングモデル
            - schedule_dict: dict, スタッフIDをキーとし、そのスタッフに関連するスケジュールリストを値とする辞書
        """
        for staff_id, schedule_list in schedule_dict.items():
            staff = self.staffs_dict[staff_id]
            model.Add(sum([s.is_working_variable for s in schedule_list]) == staff.work_days)

    def _add_consecutive_working_days_constraints(self, model, schedule_dict):
        """
        過度な連勤を防ぐ制約を追加する
        2023/10/03 時点では、最大連勤数は5日

        TODO: 連勤数を変更できるようにする

        Parameters:
            - model: cp_model.CpModel, 制約プログラミングモデル
            - schedule_dict: dict, スタッフIDをキーとし、そのスタッフに関連するスケジュールリストを値とする辞書

        このメソッドは、max_consecutive_work_days + 1日分のスライスを作成し、その期間で働く最大日数を max_consecutive_work_days に制約します
        各スライスは連勤日の可能性がある期間を表し、それぞれのスライスで働く日数が max_consecutive_work_days 以下であることを保証します
        """
        max_consecutive_work_days = 5
        for _, schedule_list in schedule_dict.items():
            for i in range(len(schedule_list) - max_consecutive_work_days):
                # 連続したmax_consecutive_work_days日 + 1日のスケジュールを取得し、この期間での連勤数を制約に追加する
                # 例えば max_consecutive_work_days = 5 の場合
                # 1回目のループでは 1日目から6日目までで5勤を防ぐ制約を追加する
                # 2回目のループでは 2日目から7日目までで5勤を防ぐ制約を追加する
                # これを繰り返すことで、最大連勤数を制約に追加する
                consecutive_days_schedule = schedule_list[i:i + max_consecutive_work_days + 1]
                model.Add(sum(s.is_working_variable for s in consecutive_days_schedule) <= max_consecutive_work_days)

    def add_constraints(self, model, schedule_list):
        """
        制約を追加するメソッド
        ShiftScheduleModel クラスの add_constraints() メソッドで呼び出される

        各制約追加のプライベートメソッドを呼び出す
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        self._add_work_days_constraints(model, schedule_dict)
        self._add_consecutive_working_days_constraints(model, schedule_dict)

class ShiftConstraints(ConstraintsBase):
    """
    シフトに関する制約を追加するクラス
    作られたインスタンスは ShiftScheduleModel クラスの add_constraints() メソッドに渡される
    """

    def __init__(self, shifts):
        self.shifts = shifts
        self.shifts_dict = {shift.date: shift for shift in shifts}

    def _create_schedule_dict(self, schedule_list):
        """
        シフトの日付をキーとして、スケジュールを辞書にまとめる
        ex {date_1: [schedule_list], date_2: [schedule_list], ...}

        Parameters:
            - schedule_list: list, ScheduleAttributesのリスト
        """
        return {shift.date: [s for s in schedule_list if s.date == shift.date] for shift in self.shifts}

    def _add_required_staff_count_constraints(self, model, schedule_dict):
        """
        必要なスタッフメンバー数を満たす制約を追加する

        Parameters:
            - model: cp_model.CpModel, 制約プログラミングモデル
            - schedule_dict: dict, シフトの日付をキーとし、その日のスケジュールリストを値とする辞書
        """
        for date, schedule_list in schedule_dict.items():
            shift = self.shifts_dict[date]
            model.Add(sum([s.is_working_variable for s in schedule_list]) >= shift.required_staff_count)

    def add_constraints(self, model, schedule_list):
        """
        制約を追加するメソッド
        ShiftScheduleModel クラスの add_constraints() メソッドで呼び出される

        各制約追加のプライベートメソッドを呼び出す
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        self._add_required_staff_count_constraints(model, schedule_dict)

@dataclass
class RequiredAttendanceAttributes:

    """
    特定日に必要な役職を持つスタッフIDと必要な役職の数を保持するクラス

    属性:
    - date (int): シフトの日付
    - staff_ids (list): 必要な権限を持つスタッフのIDのリスト
    - required_attendance_tier_count (int): 必要な役職の数
    """
    date: int
    staff_ids: list
    required_attendance_tier_count: int

class RequiredAttendanceConstraints(ConstraintsBase):
    """
    必須役職に関する制約を追加するクラス

    必須役職は Shift クラスの required_attendance_tiers によって定義される
    作られたインスタンスは ShiftScheduleModel クラスの add_constraints() メソッドに渡される
    """
    def __init__(self, shifts, staffs):
        self.shifts = shifts
        self.staffs = staffs
        self.required_attendance_attributes = self._create_required_attendance_attributes()


    def _create_required_attendance_attributes(self):
        """
        date をキーとし、その日に必要な役職を持つスタッフの情報を値とする辞書を作成する
        """
        required_attendance_attributes = {}
        for shift in self.shifts:
            staff_ids = [staff.id for staff in self.staffs if staff.tier in shift.required_attendance_tiers]
            required_attendance_attributes[shift.date] = RequiredAttendanceAttributes(
                date = shift.date,
                staff_ids = staff_ids,
                required_attendance_tier_count = shift.required_attendance_tier_count
            )
        return required_attendance_attributes

    def _create_schedule_dict(self, schedule_list):
        """
        required_attendance_attributes を参照し、date をキーとし、その日のスケジュールリストを値とする辞書を作成する
        """
        return {shift.date: [s for s in schedule_list if s.date == shift.date] for shift in self.shifts}

    def _add_required_attendance_tier_count_constraints(self, model, schedule_dict):
        """
        必要な役職の数を満たす制約を追加する

        Parameters:
            - model: cp_model.CpModel, 制約プログラミングモデル
            - schedule_dict: dict, required_attendance_attributes を参照し、date をキーとし、その日のスケジュールリストを値とする辞書
        """
        for date, schedule_list in schedule_dict.items():
            required_attendance_attributes = self.required_attendance_attributes[date]
            model.Add(sum([s.is_working_variable for s in schedule_list if s.staff_id in required_attendance_attributes.staff_ids]) >= required_attendance_attributes.required_attendance_tier_count)

    def add_constraints(self, model, schedule_list):
        """
        制約を追加するメソッド
        ShiftScheduleModel クラスの add_constraints() メソッドで呼び出される

        各制約追加のプライベートメソッドを呼び出す
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        self._add_required_attendance_tier_count_constraints(model, schedule_dict)
