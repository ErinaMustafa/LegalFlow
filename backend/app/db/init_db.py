from app.db.database import Base, engine
from app.models.calendar_event import CalendarEvent
from app.models.department import Department
from app.models.practice_area import PracticeArea
from app.models.document_category import DocumentCategory

from app.models.role import Role
from app.models.user import User
from app.models.client import Client
from app.models.case import Case
from app.models.task import Task
from app.models.document import Document
from app.models.contract import Contract
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.hearing import Hearing
from app.models.case_note import CaseNote
from app.models.notification import Notification
from app.models.comment import Comment
from app.models.expense import Expense
from app.models.time_entry import TimeEntry
from app.models.reminder import Reminder
from app.models.appointment import Appointment
from app.models.ai_analysis import AIAnalysis








try:
    Base.metadata.create_all(bind=engine)

    print("===================================")
    print("Database tables created successfully!")
    print("===================================")

except Exception as e:
    print("===================================")
    print("ERROR creating database tables!")
    print("===================================")

    print(str(e))