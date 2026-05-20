"""
logger.py
---------
Centralised logging configuration for the API.

Usage:
    from logger import get_logger
    log = get_logger(__name__)

Log level is controlled by the LOG_LEVEL environment variable (default INFO).
Set LOG_LEVEL=DEBUG in your .env for verbose output during development.
"""

from datetime import datetime
import logging
import os
from zoneinfo import ZoneInfo


def get_logger(name: str) -> logging.Logger:
    """
    Return a logger for *name* using the shared root configuration.
    Safe to call multiple times — logging.getLogger is idempotent.
    """
    _configure_root()
    return logging.getLogger(name)


_configured = False

def _configure_root():
    global _configured
    if _configured:
        return

    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    handler = logging.StreamHandler()
    handler.setLevel(level)
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Set logging time to US East Coast time (America/New_York)
    formatter.converter = lambda ts: datetime.fromtimestamp(ts, ZoneInfo("America/New_York")).timetuple()
    handler.setFormatter(formatter)

    root = logging.getLogger()
    # Avoid adding duplicate handlers if something already configured root
    if not root.handlers:
        root.addHandler(handler)
    root.setLevel(level)

    _configured = True
