# Vermillion - Full-Stack Task Management Application

A modern, full-stack web application built with Python Flask backend, React frontend, and PostgreSQL database.

## Features

- **User Management**: Create and manage user accounts
- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **RESTful API**: Clean, well-structured backend API
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Docker Support**: Easy development and deployment with Docker

## Tech Stack

### Backend
- **Python 3.11+**
- **Flask** - Web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database
- **Flask-Migrate** - Database migrations
- **Marshmallow** - Serialization/deserialization

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose (optional)
- PostgreSQL (if not using Docker)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vermillion
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # The .env file is already configured with your hosted database
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: Hosted PostgreSQL (Aiven)

## Manual Setup

### Backend Setup

1. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## Database Setup

### Using Hosted Database (Recommended)
The application is configured to use your hosted PostgreSQL database on Aiven. The connection string is already set up in the configuration files.

### Manual PostgreSQL Setup
1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run the application - tables will be created automatically

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/<id>` - Get a specific user

### Tasks
- `GET /api/tasks` - Get all tasks (optionally filtered by user_id)
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/<id>` - Update a task
- `DELETE /api/tasks/<id>` - Delete a task

### Health Check
- `GET /api/health` - Application health status

## Project Structure

```
vermillion/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── requirements.txt      # Python dependencies
├── Dockerfile           # Backend Docker configuration
├── docker-compose.yml   # Multi-service Docker setup
├── env.example          # Environment variables template
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.js       # Main App component
│   │   └── index.js     # Entry point
│   ├── package.json     # Node.js dependencies
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── Dockerfile       # Frontend Docker configuration
└── README.md            # This file
```

## Development

### Backend Development
- The Flask app runs in debug mode by default
- Database changes are automatically detected
- API endpoints are documented in the code

### Frontend Development
- React development server with hot reload
- Tailwind CSS for styling
- Responsive design for mobile and desktop

## Deployment

### Production Considerations
1. Set `FLASK_ENV=production` in environment variables
2. Use a production WSGI server (e.g., Gunicorn)
3. Set up proper database credentials
4. Configure CORS for production domains
5. Set up environment-specific configurations

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `FLASK_ENV`: Environment (development/production)
- `SECRET_KEY`: Flask secret key for sessions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on the repository.
