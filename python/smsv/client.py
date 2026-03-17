"""
SMSv Python SDK Client

Standard API client using X-API-Key authentication.
Base URL: https://smsv.tech/api
"""

import requests
from typing import Optional, Dict, Any, List
from .exceptions import SMSvError, AuthenticationError, RateLimitError, ValidationError


class MessagesAPI:
    """Messaging endpoints (/v1/text, /v1/image, /v1/document, etc.)"""

    def __init__(self, client: "SMSvClient"):
        self._client = client

    def send_text(self, to: str, message: str, sender_id: Optional[str] = None) -> Dict[str, Any]:
        """Send a text message via POST /v1/text"""
        payload: Dict[str, Any] = {"to": to, "message": message}
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/text", payload)

    def send_image(
        self,
        to: str,
        image_url: str,
        caption: Optional[str] = None,
        sender_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send an image via POST /v1/image"""
        payload: Dict[str, Any] = {"to": to, "imageUrl": image_url}
        if caption:
            payload["caption"] = caption
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/image", payload)

    def send_document(
        self,
        to: str,
        document_url: str,
        filename: str,
        caption: Optional[str] = None,
        sender_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a document via POST /v1/document"""
        payload: Dict[str, Any] = {"to": to, "documentUrl": document_url, "filename": filename}
        if caption:
            payload["caption"] = caption
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/document", payload)

    def send_audio(
        self, to: str, audio_url: str, sender_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send audio via POST /v1/audio"""
        payload: Dict[str, Any] = {"to": to, "audioUrl": audio_url}
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/audio", payload)

    def send_video(
        self,
        to: str,
        video_url: str,
        caption: Optional[str] = None,
        sender_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a video via POST /v1/video"""
        payload: Dict[str, Any] = {"to": to, "videoUrl": video_url}
        if caption:
            payload["caption"] = caption
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/video", payload)

    def send_location(
        self,
        to: str,
        latitude: float,
        longitude: float,
        name: Optional[str] = None,
        sender_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a location via POST /v1/location"""
        payload: Dict[str, Any] = {"to": to, "latitude": latitude, "longitude": longitude}
        if name:
            payload["name"] = name
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/location", payload)

    def send_template(
        self,
        to: str,
        template_slug: str,
        variables: Optional[Dict[str, str]] = None,
        language: str = "fr",
        sender_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a template message via POST /v1/template"""
        payload: Dict[str, Any] = {
            "to": to,
            "templateSlug": template_slug,
            "language": language,
        }
        if variables:
            payload["variables"] = variables
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/template", payload)

    def send(self, to: str, type: str, sender_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Generic send via POST /v1/send"""
        payload: Dict[str, Any] = {"to": to, "type": type, **kwargs}
        if sender_id:
            payload["senderId"] = sender_id
        return self._client._request("POST", "/v1/send", payload)


class ContactsAPI:
    """Contacts endpoints (/v1/contacts)"""

    def __init__(self, client: "SMSvClient"):
        self._client = client

    def list(self, page: int = 1, limit: int = 50, search: Optional[str] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        return self._client._request("GET", "/v1/contacts", params=params)

    def get(self, contact_id: str) -> Dict[str, Any]:
        return self._client._request("GET", f"/v1/contacts/{contact_id}")

    def create(
        self,
        phone: str,
        name: Optional[str] = None,
        email: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"phone": phone}
        if name:
            payload["name"] = name
        if email:
            payload["email"] = email
        if tags:
            payload["tags"] = tags
        return self._client._request("POST", "/v1/contacts", payload)

    def update(self, contact_id: str, **kwargs) -> Dict[str, Any]:
        return self._client._request("PUT", f"/v1/contacts/{contact_id}", kwargs)

    def delete(self, contact_id: str) -> Dict[str, Any]:
        return self._client._request("DELETE", f"/v1/contacts/{contact_id}")

    def import_contacts(self, contacts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Import contacts in bulk via POST /v1/contacts/import"""
        return self._client._request("POST", "/v1/contacts/import", {"contacts": contacts})


class CampaignsAPI:
    """Campaigns endpoints (/v1/campaigns)"""

    def __init__(self, client: "SMSvClient"):
        self._client = client

    def list(self, page: int = 1, limit: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "limit": limit}
        if status:
            params["status"] = status
        return self._client._request("GET", "/v1/campaigns", params=params)

    def get(self, campaign_id: str) -> Dict[str, Any]:
        return self._client._request("GET", f"/v1/campaigns/{campaign_id}")

    def create(
        self,
        name: str,
        message_content: Optional[str] = None,
        template_id: Optional[str] = None,
        segment_tags: Optional[List[str]] = None,
        scheduled_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"name": name}
        if message_content:
            payload["messageContent"] = message_content
        if template_id:
            payload["templateId"] = template_id
        if segment_tags:
            payload["segmentTags"] = segment_tags
        if scheduled_at:
            payload["scheduledAt"] = scheduled_at
        return self._client._request("POST", "/v1/campaigns", payload)

    def send(self, campaign_id: str) -> Dict[str, Any]:
        return self._client._request("POST", f"/v1/campaigns/{campaign_id}/send")

    def pause(self, campaign_id: str) -> Dict[str, Any]:
        return self._client._request("POST", f"/v1/campaigns/{campaign_id}/pause")

    def resume(self, campaign_id: str) -> Dict[str, Any]:
        return self._client._request("POST", f"/v1/campaigns/{campaign_id}/resume")

    def stats(self, campaign_id: str) -> Dict[str, Any]:
        return self._client._request("GET", f"/v1/campaigns/{campaign_id}/stats")


class TemplatesAPI:
    """Templates endpoints (/api/templates)"""

    def __init__(self, client: "SMSvClient"):
        self._client = client

    def list(self) -> List[Dict[str, Any]]:
        return self._client._request("GET", "/templates")

    def get(self, slug: str) -> Dict[str, Any]:
        return self._client._request("GET", f"/templates/{slug}")

    def create(self, name: str, slug: str, content: str, variables: Optional[List[str]] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"name": name, "slug": slug, "content": content}
        if variables:
            payload["variables"] = variables
        return self._client._request("POST", "/templates", payload)

    def send(self, to: str, template_slug: str, variables: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send a template message via POST /api/messages/template"""
        payload: Dict[str, Any] = {"to": to, "templateSlug": template_slug}
        if variables:
            payload["variables"] = variables
        return self._client._request("POST", "/messages/template", payload)


class BatchAPI:
    """Batch send endpoints (/v1/batch)"""

    def __init__(self, client: "SMSvClient"):
        self._client = client

    def send(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Send up to 1000 messages in one call"""
        return self._client._request("POST", "/v1/batch", {"messages": messages})

    def status(self, batch_id: str) -> Dict[str, Any]:
        return self._client._request("GET", f"/v1/batch/{batch_id}")


class SMSvClient:
    """
    SMSv Standard API Client.

    Uses X-API-Key authentication against https://smsv.tech/api.

    Args:
        api_key: Your app API key (sp_live_xxx or sk_xxx)
        base_url: API base URL (default: https://smsv.tech/api)
        timeout: Request timeout in seconds (default: 30)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://smsv.tech/api",
        timeout: int = 30,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        self.messages = MessagesAPI(self)
        self.contacts = ContactsAPI(self)
        self.campaigns = CampaignsAPI(self)
        self.templates = TemplatesAPI(self)
        self.batch = BatchAPI(self)

    def me(self) -> Dict[str, Any]:
        """Get app info and limits via GET /v1/me"""
        return self._request("GET", "/v1/me")

    def senders(self) -> List[Dict[str, Any]]:
        """List senders via GET /v1/senders"""
        return self._request("GET", "/v1/senders")

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        url = f"{self.base_url}{endpoint}"
        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
        }

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=self.timeout,
            )

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After", "60")
                raise RateLimitError(f"Rate limited. Retry after {retry_after}s")

            if response.status_code == 401:
                raise AuthenticationError("Invalid API key")

            if response.status_code == 400:
                error_data = response.json()
                raise ValidationError(error_data.get("message", "Validation error"))

            if not response.ok:
                error_data = response.json() if response.text else {}
                raise SMSvError(
                    error_data.get("message", f"API error: {response.status_code}"),
                    status_code=response.status_code,
                )

            body = response.json()
            if isinstance(body, dict) and "data" in body:
                return body["data"]
            return body

        except requests.exceptions.RequestException as e:
            raise SMSvError(f"Request failed: {str(e)}")
