import json
from app.core.redis_client import redis_client, REDIS_AVAILABLE




def get_cache(key: str):


    if not REDIS_AVAILABLE:
        return None


    data = redis_client.get(key)


    if data:
        print("CACHE HIT")
        return json.loads(data)


    return None




def set_cache(key: str, data, expire: int = 3600):


    if not REDIS_AVAILABLE:
        return


    redis_client.set(
        key,
        json.dumps(data, default=str),
        ex=expire
    )




def delete_cache_by_pattern(pattern: str):


    if not REDIS_AVAILABLE:
        return


    keys = redis_client.keys(pattern)


    if keys:
        redis_client.delete(*keys)

