"""Redis Pub/Sub fan-out for board Server-Sent Event connections.

Each API process owns one Redis pattern subscription and distributes refresh
notifications to its local SSE clients. This keeps Redis connection usage
constant as browser connections grow.
"""

from collections import defaultdict

from gevent import sleep, spawn
from gevent.lock import Semaphore
from gevent.queue import Empty, Full, Queue


BROKER_DISCONNECTED = object()
_REFRESH = object()


class RedisEventBroker:
    def __init__(self, redis_client, logger, channel_pattern="board:*"):
        self._redis = redis_client
        self._log = logger
        self._channel_pattern = channel_pattern
        self._subscribers = defaultdict(set)
        self._lock = Semaphore()
        self._runner = None

    def subscribe(self, channel):
        """Register one local SSE client and start the Redis listener lazily."""
        subscriber = Queue(maxsize=1)
        with self._lock:
            self._subscribers[channel].add(subscriber)
            if self._runner is None or self._runner.dead:
                self._runner = spawn(self._run)
        return subscriber

    def unsubscribe(self, channel, subscriber):
        with self._lock:
            channel_subscribers = self._subscribers.get(channel)
            if not channel_subscribers:
                return
            channel_subscribers.discard(subscriber)
            if not channel_subscribers:
                self._subscribers.pop(channel, None)

    def subscriber_count(self):
        with self._lock:
            return sum(len(subscribers) for subscribers in self._subscribers.values())

    def _run(self):
        retry_delay = 1
        while True:
            pubsub = None
            try:
                pubsub = self._redis.pubsub(ignore_subscribe_messages=True)
                pubsub.psubscribe(self._channel_pattern)
                initial_message = pubsub.get_message(timeout=5)
                if initial_message and initial_message.get("type") in ("message", "pmessage"):
                    self._dispatch_message(initial_message)
                self._log.info(
                    "Redis event broker subscribed  pattern=%s",
                    self._channel_pattern,
                )
                retry_delay = 1
                self._dispatch_all(_REFRESH)

                while True:
                    message = pubsub.get_message(timeout=5)
                    if message and message.get("type") in ("message", "pmessage"):
                        self._dispatch_message(message)
            except Exception as exc:
                self._log.error(
                    "Redis event broker disconnected  retry_seconds=%d  error=%s",
                    retry_delay,
                    exc,
                )
                self._disconnect_subscribers()
                sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 30)
            finally:
                if pubsub is not None:
                    try:
                        pubsub.close()
                    except Exception:
                        pass

    def _dispatch_message(self, message):
        channel = message.get("channel")
        if isinstance(channel, bytes):
            channel = channel.decode("utf-8")
        self._dispatch(channel, _REFRESH)

    def _dispatch(self, channel, event):
        with self._lock:
            subscribers = tuple(self._subscribers.get(channel, ()))

        for subscriber in subscribers:
            try:
                subscriber.put_nowait(event)
            except Full:
                # A refresh is already waiting; one notification is sufficient.
                pass

    def _dispatch_all(self, event):
        with self._lock:
            channels = tuple(self._subscribers)
        for channel in channels:
            self._dispatch(channel, event)

    def _disconnect_subscribers(self):
        with self._lock:
            subscribers = tuple(
                subscriber
                for channel_subscribers in self._subscribers.values()
                for subscriber in channel_subscribers
            )

        for subscriber in subscribers:
            try:
                subscriber.get_nowait()
            except Empty:
                pass
            try:
                subscriber.put_nowait(BROKER_DISCONNECTED)
            except Full:
                pass
