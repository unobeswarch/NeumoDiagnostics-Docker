# Notification Backend

A simple notification backend service with SMTP support built with FastAPI.

## Features

- FastAPI-based REST API
- Configuration management with environment variables
- Health check endpoint
- Auto-generated OpenAPI documentation
- SMTP configuration support (for future notification implementation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/unobeswarch/notification-be.git
cd notification-be
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Application

### Using Python directly:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Or using the main module:
```bash
python app/main.py
```

### With auto-reload for development:
```bash
python -m uvicorn app.main:app --reload
```

## API Endpoints

- `GET /` - Root endpoint with welcome message
- `GET /health` - Health check endpoint
- `GET /config` - Get current configuration (non-sensitive data)
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Configuration

The application can be configured using environment variables or a `.env` file:

- `APP_NAME` - Application name (default: "Notification Backend")
- `APP_VERSION` - Application version (default: "0.1.0")
- `DEBUG` - Enable debug mode (default: False)
- `HOST` - Server host (default: "0.0.0.0")
- `PORT` - Server port (default: 8000)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_USE_TLS` - Use TLS for SMTP (default: True)

## Project Structure

```
notification-be/
├── app/
│   ├── __init__.py      # Package initialization
│   ├── config.py        # Configuration management
│   └── main.py          # FastAPI application
├── .env.example         # Example environment variables
├── .gitignore           # Git ignore file
├── requirements.txt     # Python dependencies
└── README.md            # This file
```

## Development

1. Install dependencies in a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the application with auto-reload:
```bash
python -m uvicorn app.main:app --reload
```

3. Access the interactive API documentation at http://prediagnostic-be:8000/docs

## License

MIT
