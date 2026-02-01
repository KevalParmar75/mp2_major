from langgraph.graph import StateGraph
from typing import TypedDict
from .vectorstore import LocalVectorStore
from .mistral_client import call_mistral_therapy


class GraphState(TypedDict):
    question: str
    context: str
    answer: str


store = LocalVectorStore()


def retrieve(state):
    user_id = state.get("user_id", "guest")

    chunks = store.search(
        state["question"],
        user_id=user_id,
        k=3,
    )

    return {"context": "\n".join(chunks)}



def generate(state):
    prompt = f"""
Previous therapy context:
{state['context']}

User:
{state['question']}
"""

    reply = call_mistral_therapy(
        client_name="Client",
        issue="therapy",
        context_text=prompt
    )

    return {"answer": reply}


builder = StateGraph(GraphState)

builder.add_node("retrieve", retrieve)
builder.add_node("generate", generate)

builder.set_entry_point("retrieve")
builder.add_edge("retrieve", "generate")

graph = builder.compile()
