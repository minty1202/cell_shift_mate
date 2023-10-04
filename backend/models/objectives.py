import random
from enums import Tier

class ObjectivesBase:
    """
    目的関数の基底クラス
    compute_objective_value() メソッドを持つ

    作られたインスタンスは ShiftScheduleModel クラスの compute_objective_value() メソッドに渡される
    """
    def compute_objective_value(self, _, __):
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

    def compute_objective_value(self, _, schedule_list):
        """
        目的関数の値を計算するメソッド

        Parameters:
            - schedule_list: list, ScheduleAttributes のリスト
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        return self._compute_desired_off_days_objective_value(schedule_dict)

class ShiftBalanceTierObjectives(ObjectivesBase):
    """
    特定日のシフトに対して、役職バランスに関する目的関数を追加するクラス
    作られたインスタンスは ShiftScheduleModel クラスの compute_objective_value() メソッドに渡される

    2023/10/04 現在では
    通常層、新人層の人数が
    店長クラス、当日責任者、優秀層の人数よりも多い場合にペナルティを与える

    Parameters:
        - shifts: list, Shift のリスト
        - staffs: list, Staff のリスト
    """
    def __init__(self, shifts, staffs):
        self.shifts = shifts
        self.staffs = staffs
        self.penalty_dict = {
            'shift_balance_tier': 20
        }
        self.heights_tier_staff_ids = self._create_tiers_ids([Tier.MANAGER.value, Tier.DAY_MANAGER.value, Tier.UPPER.value])
        self.lower_tier_staff_ids = self._create_tiers_ids([Tier.MIDDLE.value, Tier.JUNIOR.value])

    def _create_tiers_ids(self, target_tiers):
        """
        対象 Tier に属するスタッフの ID のリストを作成する
        """

        return [staff.id for staff in self.staffs if staff.tier in target_tiers]

    def _create_schedule_dict(self, schedule_list):
        """
        スケジュールを辞書にし、Shift の日付をキーとしてまとめる
        ex {date_1: {staff_id_1: schedule, staff_id_2: schedule, ...}, date_2: {staff_id_1: schedule, staff_id_2: schedule, ...}, ...}

        Parameters:
            - schedule_list: list, ScheduleAttributes のリスト
        """
        return {shift.date: {s.staff_id: s for s in schedule_list if s.date == shift.date} for shift in self.shifts}
    
    def _compute_shift_balance_tier_objective_value(self, model, schedule_dict):
        """
        シフトスケジュールにおける役職バランスに関する目的関数（ペナルティ値）を計算する
        特定の日に、通常層や新人層のスタッフの数が店長クラス、当日責任者、優秀層の人数よりも多い場合、その差分に対してペナルティを与える
        ペナルティは非負、つまり上位レイヤーの人数が下位レイヤーの人数よりも多い場合はペナルティは 0 にするため各種制約を追加する

        Parameters:
            - schedule_dict: 辞書型。キーに日付、値に（スタッフIDをキー、関連するスケジュールリストを値とする辞書）を持つ。
        """
        total_staff_count = len(self.staffs)
        # ペナルティの合計値を保持する変数を0からスタッフの最大数までの範囲で作成
        penalty_var = model.NewIntVar(0, total_staff_count, "shift_balance_tier_penalty")

        for _, schedule_dict in schedule_dict.items():
            # 高レベル層と低レベル層の一日の勤務数を計算
            heights_tier_count = sum([schedule.is_working_variable for staff_id, schedule in schedule_dict.items() if staff_id in self.heights_tier_staff_ids])
            lower_tier_count = sum([schedule.is_working_variable for staff_id, schedule in schedule_dict.items() if staff_id in self.lower_tier_staff_ids])

            # diff_var は lower_tier_count と heights_tier_count の差を保持する変数
            diff_var = model.NewIntVar(-total_staff_count, total_staff_count, "diff")
            model.Add(diff_var == lower_tier_count - heights_tier_count)

            # is_diff_positive は diff_var が 0 以上であるかどうかを示すブール変数
            is_diff_positive = model.NewBoolVar("is_diff_positive")
            
            # diff_var が 0 以上の場合、is_diff_positive をTrueとして設定
            model.Add(diff_var >= 0).OnlyEnforceIf(is_diff_positive)
            
            # diff_var が負の場合、is_diff_positive をFalseとして設定
            model.Add(diff_var < 0).OnlyEnforceIf(is_diff_positive.Not())

            # is_diff_positive が True の場合、penalty_var は diff_var 以上にする制約を追加
            model.Add(penalty_var >= diff_var).OnlyEnforceIf(is_diff_positive)
            
            # is_diff_positive が False の場合、penalty_var は最低でも 0 にする制約を追加
            model.Add(penalty_var >= 0).OnlyEnforceIf(is_diff_positive.Not())

            # 以上で penalty_var が非負であることを保証する

        # ペナルティの値を penalty_dict の重み付け値で掛けたものを戻り値として返す
        return penalty_var * self.penalty_dict['shift_balance_tier']

    def compute_objective_value(self, model, schedule_list):
        """
        目的関数の値を計算するメソッド

        Parameters:
            - schedule_list: list, ScheduleAttributes のリスト
        """
        schedule_dict = self._create_schedule_dict(schedule_list)
        return self._compute_shift_balance_tier_objective_value(model, schedule_dict)

class RandomizedObjective(ObjectivesBase):
    """
    ランダムな目的関数を追加するクラス
    作られたインスタンスは ShiftScheduleModel クラスの compute_objective_value() メソッドに渡される

    Parameters:
        - seed: int, ランダムシード 解を再現ないし、固定するために使用する
    """
    def __init__(self, seed=None):
        self.random = random.Random(seed)

    def compute_objective_value(self, _, schedule_list):
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
