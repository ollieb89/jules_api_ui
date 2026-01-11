from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from queue import Queue
from threading import Lock
from typing import Any


@dataclass(frozen=True)
class StreamEvent:
    event_type: str
    data: Any


class StreamHub:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[Queue[StreamEvent]]] = defaultdict(set)
        self._lock = Lock()

    def subscribe(self, topic: str) -> Queue[StreamEvent]:
        queue: Queue[StreamEvent] = Queue()
        with self._lock:
            self._subscribers[topic].add(queue)
        return queue

    def unsubscribe(self, topic: str, queue: Queue[StreamEvent]) -> None:
        with self._lock:
            subscribers = self._subscribers.get(topic)
            if not subscribers:
                return
            subscribers.discard(queue)
            if not subscribers:
                self._subscribers.pop(topic, None)

    def publish(self, topic: str, event: StreamEvent) -> None:
        with self._lock:
            subscribers = list(self._subscribers.get(topic, set()))
        for queue in subscribers:
            queue.put(event)


_stream_hub = StreamHub()


def subscribe(topic: str) -> Queue[StreamEvent]:
    return _stream_hub.subscribe(topic)


def unsubscribe(topic: str, queue: Queue[StreamEvent]) -> None:
    _stream_hub.unsubscribe(topic, queue)


def publish(topic: str, event_type: str, data: Any) -> None:
    _stream_hub.publish(topic, StreamEvent(event_type=event_type, data=data))
