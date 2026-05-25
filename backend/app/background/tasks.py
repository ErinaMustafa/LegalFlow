from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import os


from app.db.database import SessionLocal
from app.models.ai_analysis import AIAnalysis
from app.models.user import User
from app.services.cache_service import delete_cache_by_pattern
from app.services.email_service import send_email


env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)


LOG_FILE = "background_tasks.log"


def write_background_log(message: str):
    with open(LOG_FILE, "a", encoding="utf-8") as file:
        file.write(f"[{datetime.utcnow()}] {message}\n")


def send_email_background(
    to_email: str,
    subject: str,
    body: str
):
    print("BACKGROUND JOB STARTED - Email")

    try:
        send_email(
            to_email,
            subject,
            body
        )

        write_background_log(
            f"Email sent successfully | To: {to_email} | Subject: {subject}"
        )

        print("BACKGROUND JOB FINISHED - Email")

    except Exception as e:
        write_background_log(
            f"Email failed | To: {to_email} | Subject: {subject} | Error: {str(e)}"
        )

        print(f"BACKGROUND JOB FAILED - Email | Error: {str(e)}")


def send_welcome_email_background(
    to_email: str,
    username: str
):
    subject = "Welcome to LegalFlow"

    body = (
        f"Hello {username},\n\n"
        f"Your LegalFlow account has been created successfully.\n\n"
        f"You can now log in and use the system.\n\n"
        f"Thank you,\n"
        f"LegalFlow Team"
    )

    send_email_background(
        to_email,
        subject,
        body
    )


def send_case_closed_email_background(
    to_email: str,
    username: str,
    case_title: str
):
    subject = "LegalFlow Case Closed"

    body = (
        f"Hello {username},\n\n"
        f"Your case has been marked as closed.\n\n"
        f"Case: {case_title}\n\n"
        f"Please log in to LegalFlow for more details.\n\n"
        f"LegalFlow Team"
    )

    send_email_background(
        to_email,
        subject,
        body
    )


def send_contract_expiration_email_background(
    to_email: str,
    username: str,
    contract_title: str,
    end_date: str
):
    subject = "LegalFlow Contract Expiration Warning"

    body = (
        f"Hello {username},\n\n"
        f"A contract is nearing expiration.\n\n"
        f"Contract: {contract_title}\n"
        f"End Date: {end_date}\n\n"
        f"Please review the contract in LegalFlow.\n\n"
        f"LegalFlow Team"
    )

    send_email_background(
        to_email,
        subject,
        body
    )


def send_court_decision_email_background(
    to_email: str,
    username: str,
    decision_title: str
):
    subject = "LegalFlow Court Decision Update"

    body = (
        f"Hello {username},\n\n"
        f"A new court decision has been registered.\n\n"
        f"Decision: {decision_title}\n\n"
        f"Please log in to LegalFlow for more details.\n\n"
        f"LegalFlow Team"
    )

    send_email_background(
        to_email,
        subject,
        body
    )


def send_notification_background(
    notification_id: int,
    title: str,
    message: str,
    user_id: int | None = None
):
    print("BACKGROUND JOB STARTED - Notification")

    write_background_log(
        f"Notification processed | ID: {notification_id} | "
        f"Title: {title} | Message: {message} | User ID: {user_id}"
    )

    if user_id:
        db = SessionLocal()

        try:
            user = db.query(User).filter(User.id == user_id).first()

            if user and user.email:
                important_words = [
                    "urgent",
                    "important",
                    "deadline",
                    "hearing",
                    "court"
                ]

                notification_text = f"{title} {message}".lower()

                is_important = any(
                    word in notification_text
                    for word in important_words
                )

                if is_important:
                    send_email(
                        user.email,
                        "Important LegalFlow Notification",
                        (
                            f"Hello {user.username},\n\n"
                            f"You have received an important notification.\n\n"
                            f"Title: {title}\n"
                            f"Message: {message}\n\n"
                            f"Please log in to LegalFlow for more details.\n\n"
                            f"LegalFlow Team"
                        )
                    )

                    write_background_log(
                        f"Important notification email sent | To: {user.email}"
                    )

        except Exception as e:
            write_background_log(
                f"Notification email failed | Error: {str(e)}"
            )

        finally:
            db.close()

    print("BACKGROUND JOB FINISHED - Notification")


def process_reminder_background(
    reminder_id: int,
    title: str,
    message: str,
    user_id: int | None = None
):
    print("BACKGROUND JOB STARTED - Reminder")

    write_background_log(
        f"Reminder processed | ID: {reminder_id} | "
        f"Title: {title} | Message: {message} | User ID: {user_id}"
    )

    print("BACKGROUND JOB FINISHED - Reminder")


def process_ai_analysis_background(
    prompt: str,
    analysis_type: str,
    user_id: int,
    case_id: int | None = None,
    document_id: int | None = None
):
    print("BACKGROUND JOB STARTED - AI Analysis")

    db = SessionLocal()

    try:
        api_key = os.getenv("OPENROUTER_API_KEY")

        if not api_key:
            write_background_log("AI background failed | OPENROUTER_API_KEY missing")
            print("BACKGROUND JOB FAILED - AI Analysis | OPENROUTER_API_KEY missing")
            return

        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )

        response = client.chat.completions.create(
            model="openrouter/auto",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional legal assistant for a Contract & Case Tracking System."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        ai_result = response.choices[0].message.content

        new_analysis = AIAnalysis(
            prompt=prompt,
            result=ai_result,
            analysis_type=analysis_type,
            created_at=datetime.utcnow(),
            user_id=user_id,
            case_id=case_id,
            document_id=document_id
        )

        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)

        delete_cache_by_pattern("ai_analyses:*")

        write_background_log(
            f"AI analysis completed | ID: {new_analysis.id} | User ID: {user_id}"
        )

        print("BACKGROUND JOB FINISHED - AI Analysis")

    except Exception as e:
        db.rollback()

        write_background_log(f"AI background failed | Error: {str(e)}")

        print(f"BACKGROUND JOB FAILED - AI Analysis | Error: {str(e)}")

    finally:
        db.close()