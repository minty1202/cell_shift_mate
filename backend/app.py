import os
from flask import Flask

app = Flask(__name__)
app.config['DEBUG'] = os.environ.get('FLASK_ENV') == 'dev'

@app.route("/")
def hello():
    return "Hello, World"
