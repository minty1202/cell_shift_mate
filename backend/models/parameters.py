from dataclasses import dataclass

@dataclass
class Staff:
    """"
    スタッフメンバーに関するデータを保持するクラス

    属性:
    - id (int): スタッフメンバーのID
    - tier (int): スタッフメンバー役職のレベル
    - desired_off_days (list): スタッフメンバーが休みを希望する日のリスト
    - work_days (int): スタッフメンバーが働くことができる日数
    """
    id: int
    tier: int
    desired_off_days: list
    work_days: int

@dataclass
class Shift:
    """
    シフトに関するデータを保持するクラス

    属性:
    - date (int): シフトの日付
    - required_staff_count (int): 必要なスタッフメンバー数
    - required_attendance_tiers (list): 必要なスタッフメンバーの役職のリスト
    - required_attendance_tier_count (int): 必要なスタッフメンバーの役職の数
    """
    date: int
    required_staff_count: int
    required_attendance_tiers: list
    required_attendance_tier_count: int

@dataclass
class LockedShift:
    """
    ロックされたシフトに関するデータを保持するクラス

    属性:
    - date (int): シフトの日付
    - staff_id (int): スタッフメンバーのID
    - is_working (bool): スタッフメンバーが働いているかどうかを示すフラグ
    """
    date: int
    staff_id: int
    is_working: bool
