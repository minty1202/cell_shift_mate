import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from models.parameters import Staff, Shift, LockedShift
from models.shift_schedule_model import ShiftScheduleModel
from models.constraints import StaffConstraints, ShiftConstraints

ALLOWED_PARAMS = ['shifts', 'staffs', 'locked']

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['DEBUG'] = os.environ.get('FLASK_ENV') == 'dev'

allowed_origin = os.environ.get('ALLOWED_ORIGIN')

CORS(app, origins=[allowed_origin])

@app.route("/api/v1/optimize", methods=['POST'])
def optimize_shifts():
    # post 出来ているか確認
    logger.debug(request)
    
    if not request.is_json:
        return jsonify({"error": "Expected JSON"}), 400

    data = request.get_json()

    if not all(param in data for param in ALLOWED_PARAMS):
        return jsonify({"error": "Missing required parameters"}), 400

    staffs = [
        Staff(
            id = staff['id'],
            tier = staff['tier'],
            desired_off_days = staff['desiredOffDays'],
            work_days = staff['workDays']
        )
        for staff in data['staffs']
    ]

    shifts = [
        Shift(
            date = shift['date'],
            required_staff_count = shift['requiredStaffCount'],
            required_attendance_tiers = shift['requiredAttendanceTiers'],
            required_attendance_tier_count = shift['requiredAttendanceTierCount']
        )
        for shift in data['shifts']
    ]

    locked = [
        LockedShift(
            date = lock['date'],
            staff_id = lock['staffId'],
            is_working = lock['isWorking']
        )
        for lock in data['locked']
    ]

    staff_constraints = StaffConstraints(staffs)
    shift_constraints = ShiftConstraints(shifts)
    shift_schedule_model = ShiftScheduleModel(shifts, staffs, locked)
    shift_schedule_model.add_constraints([staff_constraints, shift_constraints])
    shift_list = shift_schedule_model.solve()

    return jsonify(shift_list), 200
