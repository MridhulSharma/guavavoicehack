from dataclasses import dataclass, field
from typing import Any


@dataclass
class CallGoal:
    to_number: str
    objective: str
    must_ask: list[str] = field(default_factory=list)
    context: dict[str, Any] = field(default_factory=dict)
    fields_to_collect: list[str] = field(default_factory=list)

    @classmethod
    def from_json(cls, data: dict) -> "CallGoal":
        return cls(
            to_number=data["to_number"],
            objective=data["objective"],
            must_ask=data.get("must_ask", []),
            context=data.get("context", {}),
            fields_to_collect=data.get("fields_to_collect", []),
        )
