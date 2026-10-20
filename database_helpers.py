from pwdlib import PasswordHash
import json

def hash_password(password):
    # Configure the hasher using recommendation
    password_hasher = PasswordHash.recommended()

    # Generate salt and hash
    stored_hash = password_hasher.hash(password)

    return stored_hash


def verify_password(input_password, stored_hash):
    # Configure the hasher using recommendation
    password_hasher = PasswordHash.recommended()

    return password_hasher.verify(input_password, stored_hash)


def write_to_file(next_user_id, user_id, email, username, password):
    user_data = {
        "user_id": user_id,
        "email": email,
        "username": username,
        "password": password
    }

    try:
        with open("user_data.json", "r") as file:
            loaded_data = json.load(file)
            
    except FileNotFoundError:
        loaded_data = {
            "next_user_id": next_user_id,
            "users": []
        }

    # Append the new user data to the list of users
    loaded_data["users"].append(user_data)
    loaded_data["next_user_id"] = next_user_id

    # Write the updated data back to the file
    with open("user_data.json", "w") as file:
        json.dump(loaded_data, file, indent=4)


def read_from_file():
    with open("user_data.json", "r") as file:
        loaded_data = json.load(file)
        # print(loaded_data)

        return loaded_data


def check_existing_user(username, email):
    user_data = read_from_file()

    # Check if the username or email already exists in the user data
    for user in user_data["users"]:
        if user["username"] == username:
            return "An account with that username already exists.", 409
        
        if user["email"] == email:
            return "An account with that email already exists.", 409
            # print(f"Username '{username}' already exists.")

    return False


def reset_user_data():
    # Reset the user data file to an empty state
    empty_data = {
        "next_user_id": 1,
        "users": []
    }

    with open("user_data.json", "w") as file:
        json.dump(empty_data, file, indent=4)

if __name__ == "__main__":
    reset_user_data()