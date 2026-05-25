import os
import redis
from dotenv import load_dotenv


load_dotenv()


try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT")),
        password=os.getenv("REDIS_PASSWORD"),
        db=int(os.getenv("REDIS_DB", 0)),
        decode_responses=True,
        socket_connect_timeout=5
    )


    redis_client.ping()
    REDIS_AVAILABLE = True
    print("Redis connected successfully!")


except Exception as e:
    redis_client = None
    REDIS_AVAILABLE = False
    print("Redis connection failed:", str(e))

