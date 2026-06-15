"""
utils.py
--------
Shared utilities used by both server.py and health.py.
"""

import os
import requests
from logger import get_logger

log = get_logger(__name__)


def postToDiscord(message: str, webhook_env_var: str) -> bool:
    """
    Post *message* to the Discord webhook named by *webhook_env_var*.
    Returns True on success, False on any failure (missing env var or request error).
    """
    webhook_url = os.getenv(webhook_env_var)
    if not webhook_url:
        log.error("Failed to post to Discord: %s is not set in environment.", webhook_env_var)
        return False
    try:
        requests.post(webhook_url, json={"content": message}, timeout=10)
        return True
    except Exception as e:
        log.error("Failed to post to Discord  webhook=%s  error=%s", webhook_env_var, e)
        return False
