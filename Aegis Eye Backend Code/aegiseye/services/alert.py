"""
Step 5 — Emergency Alert (F5)
Sends SMS via Twilio API when accident detected.
"""

import config

# Set to True once you've configured Twilio credentials in config.py
TWILIO_ENABLED = False


def send_alert(event: dict) -> str:
    """
    Sends an SMS alert with accident details.

    Args:
        event: dict with keys: severity, vehicles, gps, timestamp

    Returns:
        Twilio message SID (or "disabled" if Twilio not configured)
    """
    if not TWILIO_ENABLED:
        print(f"[ALERT] (Twilio disabled) Would send: "
              f"Severity={event['severity']}, "
              f"Vehicles={event['vehicles']}, "
              f"GPS={event['gps']}")
        return "disabled"

    from twilio.rest import Client

    client = Client(config.TWILIO_SID, config.TWILIO_TOKEN)
    message = client.messages.create(
        body=(
            f"\U0001f6a8 AegisEye ACCIDENT ALERT\n"
            f"Severity: {event['severity']}\n"
            f"Vehicles: {', '.join(event['vehicles'])}\n"
            f"Location: {event['gps']['lat']}, {event['gps']['lng']}\n"
            f"Time: {event['timestamp']}"
        ),
        from_=config.TWILIO_FROM,
        to=config.EMERGENCY_TO,
    )
    return message.sid
