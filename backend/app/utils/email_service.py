import random
import logging
from datetime import datetime

logger = logging.getLogger("bpl_email")

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Sends an email with the verification OTP.
    In development or standalone mode, prints and logs the OTP clearly.
    Can be plugged with standard SendGrid / SMTP / Gmail credentials if configured.
    """
    message = f"""
    =======================================================
    [BAIRAJESHWAR PREMIER LEAGUE - VERIFICATION OTP]
    To: {to_email}
    Your OTP Code is: {otp_code}
    Valid for 10 minutes.
    =======================================================
    """
    print(message)
    logger.info(f"OTP {otp_code} sent to {to_email}")
    return True

def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"
