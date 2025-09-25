# app/__init__.py

"""
App package initializer.
Ensures relative imports work across modules (routers, models, services, etc.).
"""

from .config import settings  # expose settings globally if needed
