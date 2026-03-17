"""
SMSv Partner API Client (Cloud Mode)

Allows third-party applications to integrate WhatsApp messaging
for their users without requiring them to create a separate SMSv account.

Auth: X-Partner-Key: pk_cloud_xxx
Base: https://smsv.tech/api/v1/partner/cloud
"""

import hashlib
import hmac
import requests
from typing import Optional, Dict, Any, List
from .exceptions import SMSvError, AuthenticationError, RateLimitError, ValidationError


class SMSvPartnerClient:
    """
    SMSv Partner Cloud API Client.

    Args:
        partner_key: Your partner API key (pk_cloud_xxx)
        base_url: API base URL (default: https://smsv.tech/api)
        timeout: Request timeout in seconds (default: 30)

    Example::

        from smsv import SMSvPartnerClient

        client = SMSvPartnerClient(partner_key="pk_cloud_xxxxx")

        # Create sender for your user
        sender = client.create_sender("client-123", "Boutique Awa")

        # Get QR code
        qr = client.get_qr_code("client-123")

        # Send message when connected
        client.send_message("client-123", "+22370000000", "Bonjour !")
    """

    def __init__(
        self,
        partner_key: str,
        base_url: str = "https://smsv.tech/api",
        timeout: int = 30,
    ):
        if not partner_key:
            raise ValueError("Partner API key is required")
        if not partner_key.startswith("pk_cloud_"):
            raise ValueError("Cloud client requires a pk_cloud_xxx key")

        self.partner_key = partner_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @property
    def _cloud_base(self) -> str:
        return f"{self.base_url}/v1/partner/cloud"

    # =========================================================================
    # Sender Management
    # =========================================================================

    def list_senders(self, owner_external_org_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all senders. Optionally filter by ownerExternalOrgId."""
        params = {}
        if owner_external_org_id:
            params["ownerExternalOrgId"] = owner_external_org_id
        return self._request("GET", "/senders", params=params)

    def create_sender(self, external_org_id: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Create a WhatsApp sender for an organization."""
        payload: Dict[str, Any] = {"externalOrgId": external_org_id}
        if display_name:
            payload["displayName"] = display_name
        return self._request("POST", "/senders", payload)

    def get_sender(self, external_org_id: str) -> Dict[str, Any]:
        """Get sender details by external organization ID."""
        return self._request("GET", f"/senders/{external_org_id}")

    def get_qr_code(self, external_org_id: str) -> Dict[str, Any]:
        """Get QR code for WhatsApp connection. Poll until status is 'connected'."""
        return self._request("GET", f"/senders/{external_org_id}/qr")

    def get_status(self, external_org_id: str) -> Dict[str, Any]:
        """Get current connection status."""
        return self._request("GET", f"/senders/{external_org_id}/status")

    def reconnect_sender(self, external_org_id: str) -> Dict[str, Any]:
        """Force reconnection of a disconnected sender."""
        return self._request("POST", f"/senders/{external_org_id}/reconnect")

    def delete_sender(self, external_org_id: str) -> Dict[str, Any]:
        """Delete a sender and disconnect WhatsApp."""
        return self._request("DELETE", f"/senders/{external_org_id}")

    # =========================================================================
    # Messaging
    # =========================================================================

    def send_message(self, org_id: str, to: str, text: str) -> Dict[str, Any]:
        """Send a text message."""
        return self._request("POST", "/messages/send", {
            "externalOrgId": org_id,
            "to": to,
            "text": text,
        })

    def send_document(
        self,
        org_id: str,
        to: str,
        document_url: str,
        filename: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a document (PDF, Excel, etc.)."""
        payload: Dict[str, Any] = {
            "externalOrgId": org_id,
            "to": to,
            "documentUrl": document_url,
            "filename": filename,
        }
        if caption:
            payload["caption"] = caption
        return self._request("POST", "/messages/send-document", payload)

    def send_image(
        self,
        org_id: str,
        to: str,
        image_url: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send an image."""
        payload: Dict[str, Any] = {
            "externalOrgId": org_id,
            "to": to,
            "imageUrl": image_url,
        }
        if caption:
            payload["caption"] = caption
        return self._request("POST", "/messages/send-image", payload)

    # =========================================================================
    # Webhook Utilities
    # =========================================================================

    @staticmethod
    def verify_webhook(payload: str, signature: str, secret: str) -> bool:
        """
        Verify webhook signature (HMAC SHA-256).

        Args:
            payload: Raw request body as string
            signature: Value of X-Webhook-Signature header
            secret: Your webhook secret (whsec_xxx)

        Returns:
            True if signature is valid
        """
        expected = "sha256=" + hmac.new(
            secret.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected)

    # =========================================================================
    # Internal
    # =========================================================================

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        url = f"{self._cloud_base}{path}"
        headers = {
            "X-Partner-Key": self.partner_key,
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
                raise AuthenticationError("Invalid partner key")

            if response.status_code == 400:
                error_data = response.json()
                raise ValidationError(error_data.get("message", "Validation error"))

            if not response.ok:
                error_data = response.json() if response.text else {}
                raise SMSvError(
                    error_data.get("message", f"API error: {response.status_code}"),
                    status_code=response.status_code,
                )

            return response.json()

        except requests.exceptions.RequestException as e:
            raise SMSvError(f"Request failed: {str(e)}")
