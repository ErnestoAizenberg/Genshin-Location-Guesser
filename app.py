import random

from flask import Flask, render_template, jsonify, request


def create_app(app_config=None):
    app = Flask(__name__)
    if app_config:
        app.from_object(app_config)

    @app.route("/home")
    @app.route("/")
    def index():
        return render_template("index.html")

    tasks = [
        {"id": 1, "targetImageUrl": "/static/images/fontain_task_1.png", "correctLocation": [500, 500]},
        {"id": 2, "targetImageUrl": "/static/images/task_fontaine_2.jpg", "correctLocation": [323, 457]},
        {"id": 3, "targetImageUrl": "/static/images/task_fontaine_3.jpg", "correctLocation": [13, 100]},
        {"id": 4, "targetImageUrl": "/static/images/task_fontaine_4.jpg", "correctLocation": [600, 550]},
        {"id": 5, "targetImageUrl": "/static/images/task_fontaine_5.jpg", "correctLocation": [110, 500]},
        {"id": 6, "targetImageUrl": "/static/images/task_fontaine_6.jpg", "correctLocation": [810, 213]}
    ]

    @app.route("/get_task")
    def get_task():
        task = random.choice(tasks)
        task_to_send = {"id": task.get("id"), "targetImageUrl": task.get("targetImageUrl")}
        return jsonify(task_to_send)

    @app.route("/submit_result", methods=["POST"])
    def submit_result():
        data = request.get_json()
        task_id = data.get("taskId")
        guess_coords = data.get("guessCoords")
        time_spent = data.get("time")
        task = next((t for t in tasks if t["id"] == task_id), None)
        if task:
            correct_loc = task.get("correctLocation")
            return jsonify({"correctLocation": correct_loc})
        else:
            return jsonify({"error", "Not found"}), 404


    return app
