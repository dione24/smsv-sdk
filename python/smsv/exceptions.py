"""
SMSv SDK Exceptions
"""


class SMSvError(Exception):
    """Base exception for SMSv SDK"""
    
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(SMSvError):
    """Raised when authentication fails"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class RateLimitError(SMSvError):
    """Raised when rate limit is exceeded"""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429)


class ValidationError(SMSvError):
    """Raised when request validation fails"""
    
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=400)


class NotFoundError(SMSvError):
    """Raised when resource is not found"""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)
