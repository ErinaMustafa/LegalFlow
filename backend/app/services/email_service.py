import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(
    to_email: str,
    subject: str,
    body: str
):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_host or not smtp_email or not smtp_password:
        raise Exception("SMTP configuration is missing")

    message = MIMEMultipart()
    message["From"] = smtp_email
    message["To"] = to_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_email, smtp_password)
    server.send_message(message)
    server.quit()