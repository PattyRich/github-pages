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
import time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


try:
    _LOG_TIME_ZONE = ZoneInfo("America/New_York")
except ZoneInfoNotFoundError:
    # Windows Python installations may not include the IANA timezone database.
    _LOG_TIME_ZONE = None


def _log_time(timestamp):
    if _LOG_TIME_ZONE is None:
        return time.localtime(timestamp)
    return datetime.fromtimestamp(timestamp, _LOG_TIME_ZONE).timetuple()


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
    # Use US East Coast time when available and the system timezone otherwise.
    formatter.converter = _log_time
    handler.setFormatter(formatter)

    root = logging.getLogger()
    # Avoid adding duplicate handlers if something already configured root
    if not root.handlers:
        root.addHandler(handler)
    root.setLevel(level)

    _configured = True
