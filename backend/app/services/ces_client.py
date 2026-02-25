"""Google CES (Customer Engagement Suite) API client."""

import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings


class CESClient:
    """Client for interacting with Google CES v1beta APIs."""

    def __init__(self):
        self.base_url = settings.CES_API_BASE_URL
        self.project_id = settings.GCP_PROJECT_ID
        self.location = settings.GCP_LOCATION
        self._client = httpx.AsyncClient(
            headers={"Content-Type": "application/json"},
            timeout=60.0,
        )

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers. In production, use service account."""
        # For now, we'll use API key or OAuth token
        if settings.CES_SERVICE_ACCOUNT_KEY:
            return {"Authorization": f"Bearer {settings.CES_SERVICE_ACCOUNT_KEY}"}
        return {}

    async def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Make authenticated request to CES API."""
        url = f"{self.base_url}/{path}"
        headers = self._get_auth_headers()
        response = await self._client.request(method, url, headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()

    # Apps
    async def list_apps(self) -> Dict[str, Any]:
        """List all apps in the project."""
        return await self._request(
            "GET", f"projects/{self.project_id}/locations/{self.location}/apps"
        )

    async def get_app(self, app_id: str) -> Dict[str, Any]:
        """Get a specific app."""
        return await self._request(
            "GET", f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}"
        )

    # Agents
    async def list_agents(self, app_id: str) -> Dict[str, Any]:
        """List all agents in an app."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/agents",
        )

    async def get_agent(self, app_id: str, agent_id: str) -> Dict[str, Any]:
        """Get a specific agent."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/agents/{agent_id}",
        )

    # Tools
    async def list_tools(self, app_id: str) -> Dict[str, Any]:
        """List all tools in an app."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/tools",
        )

    # Evaluations
    async def create_evaluation(
        self, app_id: str, evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new evaluation (golden or scenario)."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluations",
            json=evaluation,
        )

    async def list_evaluations(
        self, app_id: str, page_size: int = 100
    ) -> Dict[str, Any]:
        """List evaluations for an app."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluations",
            params={"pageSize": page_size},
        )

    async def get_evaluation(self, app_id: str, evaluation_id: str) -> Dict[str, Any]:
        """Get a specific evaluation."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluations/{evaluation_id}",
        )

    async def delete_evaluation(
        self, app_id: str, evaluation_id: str
    ) -> Dict[str, Any]:
        """Delete an evaluation."""
        return await self._request(
            "DELETE",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluations/{evaluation_id}",
        )

    # Evaluation Datasets
    async def create_evaluation_dataset(
        self, app_id: str, dataset: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an evaluation dataset."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluationDatasets",
            json=dataset,
        )

    async def list_evaluation_datasets(self, app_id: str) -> Dict[str, Any]:
        """List evaluation datasets."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluationDatasets",
        )

    async def add_evaluations_to_dataset(
        self, app_id: str, dataset_id: str, evaluation_ids: List[str]
    ) -> Dict[str, Any]:
        """Add evaluations to a dataset."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluationDatasets/{dataset_id}:addEvaluations",
            json={"evaluationIds": evaluation_ids},
        )

    # Run Evaluation
    async def run_evaluation(
        self, app_id: str, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run evaluation(s) against an app."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}:runEvaluation",
            json=config,
        )

    async def get_operation(self, operation_id: str) -> Dict[str, Any]:
        """Get operation status."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/operations/{operation_id}",
        )

    # Evaluation Runs
    async def list_evaluation_runs(self, app_id: str) -> Dict[str, Any]:
        """List evaluation runs."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluationRuns",
        )

    async def get_evaluation_run(self, app_id: str, run_id: str) -> Dict[str, Any]:
        """Get a specific evaluation run."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluationRuns/{run_id}",
        )

    async def get_evaluation_run_results(
        self, app_id: str, run_id: str, page_size: int = 100
    ) -> Dict[str, Any]:
        """Get results for an evaluation run."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/evaluationRuns/{run_id}/results",
            params={"pageSize": page_size},
        )

    # Sessions (Live Testing)
    async def run_session(
        self, app_id: str, session_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run a session for live testing."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/sessions:runSession",
            json=session_config,
        )

    async def detect_intent(
        self, app_id: str, session_id: str, query: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detect intent in a session."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/sessions/{session_id}:detectIntent",
            json=query,
        )

    # Scheduled Evaluation Runs
    async def create_scheduled_run(
        self, app_id: str, schedule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a scheduled evaluation run."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/scheduledEvaluationRuns",
            json=schedule,
        )

    async def list_scheduled_runs(self, app_id: str) -> Dict[str, Any]:
        """List scheduled evaluation runs."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/scheduledEvaluationRuns",
        )

    # Versions
    async def list_versions(self, app_id: str) -> Dict[str, Any]:
        """List app versions."""
        return await self._request(
            "GET",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}/versions",
        )

    # Import/Export
    async def import_evaluations(
        self, app_id: str, import_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Import evaluations from GCS or CSV."""
        return await self._request(
            "POST",
            f"projects/{self.project_id}/locations/{self.location}/apps/{app_id}:importEvaluations",
            json=import_config,
        )

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()


# Singleton instance
_ces_client: Optional[CESClient] = None


def get_ces_client() -> CESClient:
    """Get or create CES client singleton."""
    global _ces_client
    if _ces_client is None:
        _ces_client = CESClient()
    return _ces_client
