import uvicorn
from fastapi import FastAPI

from app import create_app

app: FastAPI = create_app()

if __name__ == "__main__":
    uvicorn.run(app)
