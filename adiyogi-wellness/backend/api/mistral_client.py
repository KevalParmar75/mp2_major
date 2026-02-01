from typing import Optional
from huggingface_hub import InferenceClient

# ⚠️ TEMP: keep token here (move to env later)
HF_TOKEN = "hf token here"

MODEL_ID = "Qwen/Qwen2.5-72B-Instruct"

client = InferenceClient(
    model=MODEL_ID,
    token=HF_TOKEN,
)

def build_therapy_prompt(
    client_name: str,
    issue: str,
    context_text: str,
):
    system = (
        "You are a warm, professional mental-health therapist. "
        "Use evidence-informed, non-judgmental language. "
        "Do NOT give medical diagnoses or emergency instructions. "
        "If the user mentions self-harm or suicide, gently encourage "
        "them to contact local emergency services or a trusted adult."
    )

    user = (
        f"Client name: {client_name}\n"
        f"Presenting issue: {issue}\n\n"
        f"Client message:\n{context_text}\n\n"
        "Reply as the therapist in one supportive paragraph. "
        "Validate feelings and ask at most one gentle follow-up question."
    )

    return system, user


def call_mistral_therapy(
    client_name: str,
    issue: str,
    context_text: str,
    temperature: float = 0.7,
    max_tokens: int = 300,
) -> Optional[str]:

    system_content, user_content = build_therapy_prompt(
        client_name, issue, context_text
    )

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )

    return response.choices[0].message.content


if __name__ == "__main__":
    reply = call_mistral_therapy(
        client_name="Arpan",
        issue="anxiety",
        context_text="I feel very tense before exams and my mind keeps overthinking.",
    )
    print("Therapist:", reply)
