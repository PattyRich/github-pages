#!/usr/bin/env python3
"""
health.py
---------
Modernized health check script for the Bingo API.
Hits the /health endpoint and posts alerts to Discord.

Usage:
    python health.py
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import requests
from dotenv import load_dotenv


# Load .env file from the script's directory (robust execution context)
script_dir = Path(__file__).resolve().parent
dotenv_path = script_dir / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

from logger import get_logger
from utils import postToDiscord

log = get_logger(__name__)



def run_health_check():
    health_url = os.environ.get("HEALTH_CHECK_URL")
    if not health_url:
        log.error("Missing required environment variable: HEALTH_CHECK_URL")
        sys.exit(1)
    
    if not os.environ.get("DEBUG_WEBHOOK"):
        log.error("Missing required environment variable: DEBUG_WEBHOOK")
        sys.exit(1)
    webhook_var = "DEBUG_WEBHOOK"
    
    log.info("Starting health check against: %s", health_url)
    
    try:
        # Request health endpoint with a sensible timeout
        resp = requests.get(health_url, timeout=10)
        
        # Check HTTP status
        if resp.status_code != 200:
            error_msg = f"Non-200 response from health endpoint: HTTP {resp.status_code}"
            log.error(error_msg)
            postToDiscord(f"Cron health error: {error_msg}", webhook_var)
            sys.exit(1)
            
        # Parse JSON payload
        try:
            data = resp.json()
        except ValueError:
            error_msg = "Health endpoint returned invalid JSON"
            log.error(error_msg)
            postToDiscord(f"Cron health error: {error_msg}", webhook_var)
            sys.exit(1)
            
        # Check overall system status
        system_status = data.get("status")
        if system_status != "ok":
            # Extract specific details of degraded components
            unhealthy_services = []
            for component, details in data.items():
                if isinstance(details, dict) and details.get("status") != "ok":
                    error_detail = details.get("error", "unknown error")
                    unhealthy_services.append(f"{component} is unhealthy ({error_detail})")
            
            reasons = ", ".join(unhealthy_services) if unhealthy_services else "Overall status is not ok"
            error_msg = f"System is degraded: {reasons}"
            log.error(error_msg)
            postToDiscord(f"Cron health error: {error_msg}", webhook_var)
            sys.exit(1)
            
        # Success path
        log.info("Health check passed. System status: ok")
        uptime = data.get("uptime_seconds", "unknown")
        mongo_lat = data.get("mongo", {}).get("latency_ms", "unknown")
        redis_lat = data.get("redis", {}).get("latency_ms", "unknown")
        log.info("Metrics - Uptime: %ss, Mongo latency: %sms, Redis latency: %sms", uptime, mongo_lat, redis_lat)
        
    except requests.exceptions.RequestException as e:
        error_msg = f"Request to health endpoint failed: {e}"
        log.error(error_msg)
        postToDiscord(f"Cron health error: {error_msg}", webhook_var)
        sys.exit(1)
    except Exception as e:
        error_msg = f"Unexpected health check error: {e}"
        log.error(error_msg)
        postToDiscord(f"Cron health error: {error_msg}", webhook_var)
        sys.exit(1)

    current_time = datetime.now(timezone.utc).strftime("%H:%M:%S")
    print(f"Bingo health check complete: UTC time {current_time}")



if __name__ == "__main__":
    run_health_check()
