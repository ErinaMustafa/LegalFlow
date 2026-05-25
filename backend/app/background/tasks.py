from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
import os


from app.db.database import SessionLocal
from app.models.ai_analysis import AIAnalysis
from app.services.cache_service import delete_cache_by_pattern


env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)


LOG_FILE = "background_tasks.log"


def write_background_log(message: str):
    with open(LOG_FILE, "a", encoding="utf-8") as file:
        file.write(f"[{datetime.utcnow()}] {message}\n")


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