import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

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
  
  shifts = data['shifts']
  staffs = data['staffs']
  locked = data['locked']

  shift_list = [
    {
      'date': shift['date'],
      'staffId': staff['id'],
      'isWorking': True,
      'locked': False
    }
    for shift in shifts
    for staff in staffs
  ]

  return jsonify(shift_list), 200
