"""HuggingFace dataset service for security testing."""

import asyncio
import re
from typing import Any, Dict, List, Optional
from datasets import load_dataset

# Curated dataset catalog from spec
CURATED_DATASETS = {
    "prompt_injection": [
        {"id": "deepset/prompt-injections", "name": "Deepset Prompt Injections",
         "size": 662, "description": "Binary classification, 'ignore previous' style"},
        {"id": "neuralchemy/Prompt-injection-dataset", "name": "Neuralchemy PI Dataset",
         "size": 2100, "description": "29 attack categories including 2025 techniques"},
        {"id": "xTRam1/safe-guard-prompt-injection", "name": "SafeGuard PI",
         "size": 10000, "description": "GLAN-inspired synthetic dataset"},
        {"id": "Mindgard/evaded-prompt-injection-and-jailbreak-samples", "name": "Mindgard Evaded",
         "size": 500, "description": "Character injection & adversarial evasion"},
        {"id": "microsoft/llmail-inject-challenge", "name": "MS LLMail Challenge",
         "size": 200, "description": "Real attacks from closed challenge"},
    ],
    "jailbreaking": [
        {"id": "JailbreakBench/JBB-Behaviors", "name": "JailbreakBench",
         "size": 100, "description": "Standardized benchmark, 10 misuse categories"},
        {"id": "allenai/wildjailbreak", "name": "WildJailbreak",
         "size": 262000, "description": "Massive synthetic adversarial pairs"},
        {"id": "TrustAIRLab/in-the-wild-jailbreak-prompts", "name": "In-the-Wild Jailbreaks",
         "size": 15000, "description": "Real prompts from Reddit/Discord"},
        {"id": "rubend18/ChatGPT-Jailbreak-Prompts", "name": "ChatGPT Jailbreaks",
         "size": 80, "description": "Classic DAN, Omega templates"},
    ],
    "toxicity": [
        {"id": "allenai/real-toxicity-prompts", "name": "Real Toxicity Prompts",
         "size": 100000, "description": "Web snippets with Perspective scores"},
        {"id": "LibrAI/do-not-answer", "name": "Do Not Answer",
         "size": 939, "description": "Prompts models should refuse"},
        {"id": "codesagar/malicious-llm-prompts", "name": "Malicious LLM Prompts",
         "size": 5000, "description": "Mixed malicious prompts"},
    ],
    "indirect_attack": [
        {"id": "MAlmasabi/Indirect-Prompt-Injection-BIPIA-GPT", "name": "BIPIA-GPT",
         "size": 70000, "description": "Indirect injection via data"},
        {"id": "dmilush/shieldlm-prompt-injection", "name": "ShieldLM",
         "size": 54162, "description": "Direct + indirect + in-the-wild"},
    ],
}


def get_datasets_by_category() -> Dict[str, List[Dict[str, Any]]]:
    """Return all curated datasets organized by category."""
    return CURATED_DATASETS


def parse_hf_url(url: str) -> Optional[str]:
    """Extract dataset ID from HuggingFace URL."""
    pattern = r"huggingface\.co/datasets/([^/]+/[^/\s]+)"
    match = re.search(pattern, url)
    return match.group(1) if match else None


async def validate_dataset(dataset_id: str, hf_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Validate a HuggingFace dataset exists and return metadata.

    Returns dict with keys: valid, name, size, columns, error
    """
    try:
        # Use asyncio.to_thread to avoid blocking the event loop
        ds = await asyncio.to_thread(
            load_dataset, dataset_id, split="train[:1]", token=hf_token
        )

        # Get full dataset info
        full_ds = await asyncio.to_thread(
            load_dataset, dataset_id, split="train", token=hf_token
        )

        return {
            "valid": True,
            "name": dataset_id.split("/")[-1],
            "size": len(full_ds),
            "columns": list(ds.column_names),
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
        }


def _load_and_process_dataset(
    dataset_id: str,
    sample_size: int,
    shuffle: bool,
    hf_token: Optional[str],
) -> List[Dict[str, Any]]:
    """Sync helper to load dataset (runs in thread pool)."""
    ds = load_dataset(dataset_id, split="train", token=hf_token)

    if shuffle:
        ds = ds.shuffle(seed=42)

    # Cap at sample_size (max 10000)
    sample_size = min(sample_size, 10000, len(ds))
    ds = ds.select(range(sample_size))

    # Find the text column (common names: prompt, text, input, query)
    text_col = None
    for col in ["prompt", "text", "input", "query", "instruction"]:
        if col in ds.column_names:
            text_col = col
            break

    if not text_col:
        text_col = ds.column_names[0]  # Fallback to first column

    # Find category column if exists
    category_col = None
    for col in ["category", "type", "label", "attack_type"]:
        if col in ds.column_names:
            category_col = col
            break

    prompts = []
    for row in ds:
        prompt_data = {"text": str(row[text_col])}
        if category_col and row.get(category_col):
            prompt_data["category"] = str(row[category_col])
        prompts.append(prompt_data)

    return prompts


async def load_prompts_from_dataset(
    dataset_id: str,
    sample_size: int = 100,
    shuffle: bool = True,
    hf_token: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Load prompts from a HuggingFace dataset.

    Returns list of dicts with keys: text, category (if available)
    Uses asyncio.to_thread to avoid blocking the event loop.
    """
    return await asyncio.to_thread(
        _load_and_process_dataset, dataset_id, sample_size, shuffle, hf_token
    )
