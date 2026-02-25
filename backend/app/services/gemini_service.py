"""Google Gemini API client for AI-powered test generation."""

import json
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from google.generativeai import types

from app.core.config import settings


class GeminiService:
    """Service for interacting with Google Gemini API."""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        self.generation_config = {
            "temperature": settings.GEMINI_TEMPERATURE,
            "max_output_tokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
        }

    def _get_model(self):
        """Get configured Gemini model."""
        return genai.GenerativeModel(
            self.model_name,
            generation_config=self.generation_config,
        )

    async def generate_test_case(
        self,
        user_input: str,
        agent_context: Optional[Dict[str, Any]] = None,
        test_type: str = "golden",
        retry_feedback: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a test case (golden or scenario) from natural language input.

        Args:
            user_input: Natural language test requirement
            agent_context: Agent configuration (playbook, tools, etc.)
            test_type: "golden" or "scenario"
            retry_feedback: Feedback from previous retry attempt

        Returns:
            Generated test case JSON matching CES Evaluation schema
        """
        model = self._get_model()

        # Build prompt based on test type
        if test_type == "golden":
            prompt = self._build_golden_prompt(
                user_input, agent_context, retry_feedback
            )
        else:
            prompt = self._build_scenario_prompt(
                user_input, agent_context, retry_feedback
            )

        # Generate with structured output
        response = model.generate_content(prompt)

        # Parse response
        try:
            # Try to extract JSON from response
            text = response.text
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                json_str = text.split("```")[1].split("```")[0]
            else:
                json_str = text

            return json.loads(json_str.strip())
        except (json.JSONDecodeError, IndexError) as e:
            # Return raw text if JSON parsing fails
            return {"raw_response": response.text, "parse_error": str(e)}

    def _build_golden_prompt(
        self,
        user_input: str,
        agent_context: Optional[Dict[str, Any]],
        retry_feedback: Optional[str],
    ) -> str:
        """Build prompt for golden conversation generation."""
        prompt = """You are a QA engineer generating golden evaluation test cases for Google CX Agent Studio.

Generate a GOLDEN evaluation test case in CES v1beta Evaluation JSON format.

Requirements:
- Each turn must have realistic userInput (text, DTMF, audio, or events)
- Include evaluationExpectations for precise assertion matching
- Test known-good conversation flows with expected agent behaviors
- Include edge cases and error handling paths
- Multi-turn context preservation is important

Output format: JSON object matching CES Evaluation schema with 'golden' field containing GoldenTurn objects.

"""

        if agent_context:
            prompt += f"\nAgent Context:\n{json.dumps(agent_context, indent=2)}\n"

        prompt += f"\nUser Test Requirement:\n{user_input}\n"

        if retry_feedback:
            prompt += f"\nPrevious feedback (please address):\n{retry_feedback}\n"

        return prompt

    def _build_scenario_prompt(
        self,
        user_input: str,
        agent_context: Optional[Dict[str, Any]],
        retry_feedback: Optional[str],
    ) -> str:
        """Build prompt for scenario generation."""
        prompt = """You are a test scenario designer for CX Agent Studio evaluation system.

Generate a SCENARIO evaluation in CES v1beta Evaluation JSON format.

Requirements:
- Include 'task' field describing what to test
- Create 3-5 detailed rubrics testing specific quality aspects:
  - accuracy, tone, completeness, error handling
- Set userGoalBehavior: SATISFIED, REJECTED, or IGNORED
- Include userFacts for personalized test personas
- Use variableOverrides for dynamic content
- Set appropriate maxTurns (typically 5-15)

Output format: JSON object matching CES Evaluation schema with 'scenario' field.

"""

        if agent_context:
            prompt += f"\nAgent Context:\n{json.dumps(agent_context, indent=2)}\n"

        prompt += f"\nUser Test Requirement:\n{user_input}\n"

        if retry_feedback:
            prompt += f"\nPrevious feedback (please address):\n{retry_feedback}\n"

        return prompt

    async def analyze_results(
        self, run_results: List[Dict[str, Any]], question: Optional[str] = None
    ) -> str:
        """
        Analyze evaluation run results using Gemini.

        Args:
            run_results: List of evaluation results
            question: Optional specific question about results

        Returns:
            Natural language analysis
        """
        model = self._get_model()

        prompt = f"""You are a QA analyst analyzing CX Agent evaluation results.

Evaluation Results:
{json.dumps(run_results, indent=2)}

"""

        if question:
            prompt += f"\nSpecific question: {question}\n"
        else:
            prompt += """
Provide:
1. Summary of pass/fail rates
2. Key failure patterns
3. Root cause analysis for failures
4. Recommended fixes
"""

        response = model.generate_content(prompt)
        return response.text

    async def classify_test_type(self, user_input: str) -> str:
        """
        Classify whether a test should be golden or scenario.

        Returns:
            "golden" or "scenario"
        """
        model = self._get_model()

        prompt = f"""Classify this test requirement as either "golden" or "scenario".

Golden = deterministic testing with exact expected outputs
Scenario = behavioral testing with flexible scoring

Test requirement: {user_input}

Respond with just "golden" or "scenario" (lowercase)."""

        response = model.generate_content(prompt)
        result = response.text.strip().lower()

        if "golden" in result:
            return "golden"
        return "scenario"

    async def extract_test_requirements(
        self, docx_content: str
    ) -> List[Dict[str, str]]:
        """
        Extract individual test requirements from a Word document.

        Args:
            docx_content: Extracted text from .docx file

        Returns:
            List of test requirement objects with description and type_hint
        """
        model = self._get_model()

        prompt = f"""Extract individual test requirements from this document.

For each test case, provide:
- description: What to test
- type_hint: "golden" or "scenario" (if determinable)

Document content:
{docx_content}

Output as JSON array."""

        response = model.generate_content(prompt)

        try:
            text = response.text
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                json_str = text.split("```")[1].split("```")[0]
            else:
                json_str = text

            return json.loads(json_str.strip())
        except (json.JSONDecodeError, IndexError):
            return [{"description": docx_content[:1000], "type_hint": None}]

    async def suggest_improvements(
        self, test_case: Dict[str, Any], failure_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Suggest improvements for a test case.

        Args:
            test_case: The test case JSON
            failure_info: Optional failure information

        Returns:
            Suggestions for improving the test case
        """
        model = self._get_model()

        prompt = f"""You are a QA expert. Suggest improvements for this CES evaluation test case.

Test Case:
{json.dumps(test_case, indent=2)}

"""

        if failure_info:
            prompt += f"\nFailure Information:\n{json.dumps(failure_info, indent=2)}\n"

        prompt += "\nProvide specific, actionable suggestions for improving test coverage and accuracy."

        response = model.generate_content(prompt)
        return response.text


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service singleton."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
