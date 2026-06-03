from fastapi import FastAPI, APIRouter, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# 1. Initialize FastAPI
app = FastAPI(title="Bhutan Voice-First AI Gateway")

# 2. Configure Secure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# 5. Placeholder for Main Router Blueprint (where voice/text routing will go)
@v1_router.post("/query", tags=["Routing"])
async def route_voice_query(payload: dict):
    # This will later map voice tokens onto target processors
    return {"message": "Gateway received query successfully"}

# Include the versioned router into the main app
app.include_router(v1_router)