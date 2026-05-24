from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os


env_path = Path(__file__).resolve().parent / ".env"


load_dotenv(dotenv_path=env_path)


key = os.getenv("OPENROUTER_API_KEY")


print("KEY:", key)


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=key
)


response = client.chat.completions.create(
    model="openrouter/auto",
    messages=[
        {
            "role": "user",
            "content": "Tell me one short fact about law."
        }
    ]
)


print(response.choices[0].message.content)