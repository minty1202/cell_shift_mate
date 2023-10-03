class ConstraintsBase:
    """
    制約を追加するの基底クラス
    add_constraints()メソッドを持つ
    """
    def add_constraints(self, _, __):
        """
        制約を追加するメソッド

        パラメータ:
        - self
        - model: cp_model
        - schedule_list: ScheduleAttributesのリスト
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
        """
        return {staff.id: [s for s in schedule_list if s.staff_id == staff.id] for staff in self.staffs}

    def _add_work_days_constraints(self, model, schedule_dict):
        """
        スタッフの出勤数が work_days と一致するように制約を追加する
        """
        for staff_id, schedule_list in schedule_dict.items():
            staff = self.staffs_dict[staff_id]
            model.Add(sum([s.is_working_variable for s in schedule_list]) == staff.work_days)

    def add_constraints(self, model, schedule_list):
        """
        制約を追加するメソッド
        ShiftScheduleModel クラスの add_constraints() メソッドで呼び出される

        各制約追加のプライベートメソッドを呼び出す
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        self._add_work_days_constraints(model, schedule_dict)
