# Project Setup

## Prerequisites

- Python 3 installed.
- A terminal opened in the project’s root folder (`assignment3`).

## 1. Create a Virtual Environment

```powershell
py -3 -m venv .venv
```

## 2. Install Dependencies

Install the packages listed in `requirements.txt`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## 3. Start the Local HTTPS Server

Run Flask with a temporary self-signed certificate:

```powershell
.\.venv\Scripts\python.exe -m flask --app server run --cert=adhoc
```

> This HTTPS option requires the `cryptography` package. Your browser will display a certificate warning because the certificate is self-signed.

If your browser does not accept self-signed certificate then:

```powershell
.\.venv\Scripts\python.exe -m flask --app server run
```

> This run the server as HTTP which does not encrypt data during transmission. But since the website runs locally nothing is being transported accross the internet.

Open [https://127.0.0.1:5000](https://127.0.0.1:5000) in your browser.

Keep the terminal open while using the application. Press **Ctrl+C** to stop the server.

## Extra Information:

If you wish to reset the database (`user_data.json`) then run `database_helpers.py`
