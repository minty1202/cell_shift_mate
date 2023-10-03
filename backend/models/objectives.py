import random

class ObjectivesBase:
    """
    目的関数の基底クラス
    compute_objective_value() メソッドを持つ

    作られたインスタンスは ShiftScheduleModel クラスの compute_objective_value() メソッドに渡される
    """
    def compute_objective_value(self, _):
        """
        目的関数の値を計算するメソッド
        """
        raise NotImplementedError("compute_objective_value() must be implemented.")
    
class StaffObjectives(ObjectivesBase):
    """
    スタッフメンバーに関する目的関数を追加するクラス
    作られたインスタンスは ShiftScheduleModel クラスの compute_objective_value() メソッドに渡される
    """

    def __init__(self, staffs):
        self.staffs = staffs
        self.staffs_dict = {staff.id: staff for staff in staffs}
        self.penalty_dict = {
            'desired_off_days': 10
        }


    def _create_schedule_dict(self, schedule_list):
        """
        スケジュールを辞書にし、スタッフメンバーのIDをキーとしてまとめる
        ex {staff_id_1: {date_1: schedule, date_2: schedule, ...}, staff_id_2: {date_1: schedule, date_2: schedule, ...}, ...}

        Parameters:
            - schedule_list: list, ScheduleAttributes のリスト
        """
        return {staff.id: {s.date: s for s in schedule_list if s.staff_id == staff.id} for staff in self.staffs}
    
    def _compute_desired_off_days_objective_value(self, schedule_dict):
        """
        希望休の日数に関する目的関数の値を計算する

        Parameters:
            - schedule_dict: dict, スタッフIDをキーとし、そのスタッフに関連するスケジュールリストを値とする辞書
        """
        penalty = 0
        for staff_id, schedule_list in schedule_dict.items():
            staff = self.staffs_dict[staff_id]
            for day in staff.desired_off_days:
                schedule = schedule_list[day]
                penalty += self.penalty_dict['desired_off_days'] * schedule.is_working_variable
        return penalty

    def compute_objective_value(self, schedule_list):
        """
        目的関数の値を計算するメソッド

        Parameters:
            - schedule_list: list, ScheduleAttributes のリスト
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        return self._compute_desired_off_days_objective_value(schedule_dict)


class RandomizedObjective(ObjectivesBase):
    """
    ランダムな目的関数を追加するクラス
    作られたインスタンスは ShiftScheduleModel クラスの compute_objective_value() メソッドに渡される

    Parameters:
        - seed: int, ランダムシード 解を再現ないし、固定するために使用する
    """
    def __init__(self, seed=None):
        self.random = random.Random(seed)

    def compute_objective_value(self, schedule_list):
        """
        目的関数の値を計算するメソッド
        出勤時に -1 か 1 をランダムに選び、その値をペナルティとする

        Parameters:
            - schedule_list: list, ScheduleAttributes のリスト
        """
        penalty = 0
        for schedule in schedule_list:
            penalty += self.random.choice([-1, 1]) * schedule.is_working_variable
        return penalty
