import random
from collections import defaultdict

from flask import Flask, jsonify, render_template, request

list_of_tasks = [
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


def create_app(app_config=None):
    app = Flask(__name__)
    if app_config:
        app.config.from_object(app_config)  # Fixed: should be app.config.from_object

    region_lookup = defaultdict(list)
    for d in list_of_tasks:
        region_lookup[d.get("region")].append(d)

    @app.route("/dashboard")
    @app.route("/home")
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/get_task")
    def get_task():
        data = request.args
        region = data.get("region")

        if region:
            dicts_to_select_in = region_lookup[region]
        else:
            random_region = random.choice(list(region_lookup.keys())) if region_lookup else None
            dicts_to_select_in = region_lookup[random_region] if random_region else []

        task = random.choice(dicts_to_select_in) if dicts_to_select_in else None
        if task:
            task_to_send = {
                "id": task.get("id"),
                "targetImageUrl": task.get("targetImageUrl"),
            }
        else:
            task_to_send = {}

        return jsonify(task_to_send)

    @app.route("/submit_result", methods=["POST"])
    def submit_result():
        data = request.get_json()
        task_id = data.get("taskId")
        guess_coords = data.get("guessCoords")
        time_spent = data.get("time")
        task = next((t for t in list_of_tasks if t["id"] == task_id), None)
        if task:
            correct_loc = task.get("correctLocation")
            return jsonify({"correctLocation": correct_loc})
        else:
            return jsonify({"error": "Not found"}), 404

    return app
