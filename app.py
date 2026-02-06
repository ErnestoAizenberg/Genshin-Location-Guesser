import random
import logging
from collections import defaultdict
from typing import Dict, List, Union, Final, Any, Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.exception_handlers import request_validation_exception_handler

from pydantic import BaseModel

list_of_tasks: Final[List[Dict[str, Any]]] = [
    {
        "id": 1,
        "targetImageUrl": "/static/images/fontain_task_1.png",
        "correctLocation": [500, 500],
        "region": "fontaine",
    },
    {
        "id": 2,
        "targetImageUrl": "/static/images/task_fontaine_2.jpg",
        "correctLocation": [323, 457],
        "region": "fontaine",
    },
    {
        "id": 3,
        "targetImageUrl": "/static/images/task_fontaine_3.jpg",
        "correctLocation": [13, 100],
        "region": "fontaine",
    },
    {
        "id": 4,
        "targetImageUrl": "/static/images/task_fontaine_4.jpg",
        "correctLocation": [600, 550],
        "region": "fontaine",
    },
    {
        "id": 5,
        "targetImageUrl": "/static/images/task_fontaine_5.jpg",
        "correctLocation": [110, 500],
        "region": "fontaine",
    },
    {
        "id": 6,
        "targetImageUrl": "/static/images/task_fontaine_6.jpg",
        "correctLocation": [810, 213],
        "region": "mondstadt",
    },
]


class Task(BaseModel):
    id: Union[str, int]
    targetImageUrl: str


class SubmittedTask(BaseModel):
    taskId: Union[str, int]
    guessCoords: List[Union[int, float]]
    time: Union[int, float]


def create_app(app_config: Optional[Dict[str, Any]] = None, logger: Optional[logging.Logger] = None) -> FastAPI:
    if not logger:
        logger = logging.getLogger(__name__)
        logger.setLevel("DEBUG")

    app: FastAPI = FastAPI()
    app.state.config = app_config
    app.mount("/static", StaticFiles(directory="static"), name="static")
    templates: Jinja2Templates = Jinja2Templates(directory="templates")

    region_lookup: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for d in list_of_tasks:
        region_lookup[d.get("region")].append(d)

    @app.exception_handler(Exception)
    async def error_logger(request: Request, exc: Exception) -> Any:
        logger.error(f"{exc.errors()}")
        return await request_validation_exception_handler(request, exc)

    @app.get("/", response_class=HTMLResponse)
    def read_root(request: Request) -> HTMLResponse:
        return templates.TemplateResponse("index2.html", {"request": request})

    @app.get("/get_task", response_model=Task)
    def get_task(region: str) -> Task:

        dicts_to_select_in: List[Dict[str, Any]]
        if region:
            dicts_to_select_in = region_lookup[region]
        else:
            random_region: Optional[str] = (
                random.choice(list(region_lookup.keys())) if region_lookup else None
            )
            dicts_to_select_in = region_lookup[random_region] if random_region else []

        task_dict: Optional[Dict[str, Any]] = (
            random.choice(dicts_to_select_in) if dicts_to_select_in else None
        )
        if task_dict:
            task_to_send: Task = Task(
                id=str(task_dict.get("id")),
                targetImageUrl=task_dict.get("targetImageUrl", ""),
            )
            return task_to_send
        logger.error(f"No data found for region {region}")
        raise HTTPException(
            status_code=404, detail=f"No data found for region {region}"
        )

    @app.post("/submit_result")
    def submit_result(submitted_task: SubmittedTask) -> Dict[str, List[int]]:

        task_id: Union[str, int] = submitted_task.taskId
        guess_coords: List[Union[int, float]] = submitted_task.guessCoords
        time_spent: Union[int, float] = submitted_task.time

        task_dict: Optional[Dict[str, Any]] = next((t for t in list_of_tasks if t["id"] == int(task_id)), None)

        if task_dict:
            correct_loc: List[int] = task_dict.get("correctLocation", [])
            logger.info(f"correctLocation: {correct_loc}")
            return {"correctLocation": correct_loc}
        else:
            logger.error(f"No data found with provided identifier ({task_id})")

            raise HTTPException(
                status_code=404,
                detail=f"No data found with provided identifier ({task_id})",
            )

    return app
