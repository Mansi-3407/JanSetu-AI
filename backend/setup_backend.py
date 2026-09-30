import os

directories = [
    "app",
    "app/models",
    "app/schemas",
    "app/routers",
    "app/services",
    "app/ai",
    "app/scoring",
    "app/clustering",
    "app/utils",
    "seeds",
]

for d in directories:
    os.makedirs(d, exist_ok=True)
    init_file = os.path.join(d, "__init__.py")
    with open(init_file, "w") as f:
        pass

files = {
    "app/main.py": "",
    "app/config.py": "",
    "app/database.py": "",
    "alembic.ini": "",
}

for path, content in files.items():
    if not os.path.exists(path):
        with open(path, "w") as f:
            f.write(content)
