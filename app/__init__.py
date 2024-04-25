from flask import Flask
from flask_cors import CORS

from app.config import Config

# Create a Flask application instance
app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}})

# Import routes
from app import processor, routes
