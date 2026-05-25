from app.core.redis_client import redis_client, REDIS_AVAILABLE


print("Redis available:", REDIS_AVAILABLE)


if REDIS_AVAILABLE:
    redis_client.set("legalflow_test", "Redis is working", ex=60)
    print(redis_client.get("legalflow_test"))

