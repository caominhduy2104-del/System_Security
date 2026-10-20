from pathlib import Path
import re
from flask import (
    Flask, 
    redirect, 
    request, 
    send_from_directory, 
    url_for
)

from database_helpers import (
    hash_password, 
    verify_password,
    check_existing_user,
    write_to_file,
    read_from_file
)


ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="assets", static_url_path="/assets")

@app.get("/")
def index():
    return redirect(url_for("pages", filename="Login.html"))

@app.post("/register")
def register():
    if not all(request.form.get(field) for field in ("email", "username", "password")):
        return "Email, username, and password are required.", 400

    email = request.form.get("email")
    username = request.form.get("username")
    password = request.form.get("password")
    password_symbols = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?"
    password_rules = (
        len(password) >= 8,
        re.search(r"[a-z]", password) is not None,
        re.search(r"[A-Z]", password) is not None,
        re.search(r"[0-9]", password) is not None,
        any(character in password_symbols for character in password),
    )

    if not all(password_rules):
        return (
            "Password must contain at least 8 characters, a lowercase letter, an uppercase letter, a number, and a symbol.",
            400,
        )

    # Check if the username already exists else write the new user data to the file
    existing_user = check_existing_user(username, email)
    if existing_user:
        message, status_code = existing_user
        return message, status_code

    else:
        password_hash = hash_password(password)
        user_data = read_from_file()
        user_id = user_data["next_user_id"] # Get the next user ID from the loaded data
        next_user_id = user_id + 1 # Increment the next user ID for future registrations
        write_to_file(next_user_id, user_id, email, username, password_hash) # write to database

        
    # Demo only: validate, hash, and save the account here before redirecting.
    return redirect(url_for("pages", filename="Login.html"), code=303)
    

@app.post("/login")
def login():
    if not all(request.form.get(field) for field in ("username", "password")):
        return "Username and password are required.", 400

    input_username = request.form.get("username")
    input_password = request.form.get("password")

    user_data = read_from_file()

    for user in user_data["users"]:
        if user["username"] == input_username:
            if verify_password(input_password, user["password"]):
                
                return redirect(url_for("pages", filename="Home.html"), code=303)

    return "Invalid username or password.", 401

@app.get("/webpages/<path:filename>")
def pages(filename):
    return send_from_directory(ROOT / "webpages", filename)

@app.get("/javaScripts/<path:filename>")
def scripts(filename):
    return send_from_directory(ROOT / "javaScripts", filename)
