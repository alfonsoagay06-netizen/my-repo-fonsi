import time
from fastapi import FastAPI, APIRouter, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# 1. Initialize FastAPI
app = FastAPI(title="Bhutan Voice-First AI Gateway")

# InMemory storage to track request timestamps per client IP
CLIENT_REQUEST_LOGS = {}

# 2. Configure Secure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Rate Limiter Middleware (Fulfilling the final acceptance criteria)
@app.middleware("http")
async def rate_limiter_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Fetch request history for this IP and clear records older than 60 seconds
    request_times = CLIENT_REQUEST_LOGS.get(client_ip, [])
    request_times = [t for t in request_times if current_time - t < 60]
    
    # Example threshold: Maximum of 100 requests per minute
    if len(request_times) >= 100:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": "Rate limit exceeded", "message": "Too many requests. Please try again later."}
        )
    
    # Record the current request timestamp
    request_times.append(current_time)
    CLIENT_REQUEST_LOGS[client_ip] = request_times
    
    response = await call_next(request)
    return response

# 3. Handle Invalid Parameters with Custom JSON Error Payloads
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Invalid API query parameters", "details": exc.errors()},
    )

# Create a Versioned Router (Semantic Versioning)
v1_router = APIRouter(prefix="/api/v1")

# 4. Service Health Verification Endpoint
@v1_router.get("/health", tags=["Diagnostics"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Voice-First AI Gateway",
        "version": "1.0.0"
    }

# Placeholder for Main Router Blueprint (where voice/text routing will go)
@v1_router.post("/query", tags=["Routing"])
async def route_voice_query(payload: dict):
    return {"message": "Gateway received query successfully"}

# Include the versioned router into the main app
app.include_router(v1_router)