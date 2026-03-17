"""
SMSv Python SDK.

Standard API (X-API-Key) and Partner API (X-Partner-Key) clients.
"""

__version__ = "0.2.0"
__author__ = "SMSv Team"

from .client import SMSvClient
from .partner import SMSvPartnerClient
from .exceptions import SMSvError, AuthenticationError, RateLimitError, ValidationError

__all__ = [
    "SMSvClient",
    "SMSvPartnerClient",
    "SMSvError",
    "AuthenticationError",
    "RateLimitError",
    "ValidationError",
]
