# Battleship Game

This is a Battleship browser game built with Angular and PHP/MySQL.

## Prerequisites

- Node.js & npm
- PHP
- MySQL Database

## Setup Instructions

1. **Database Setup**
   - Ensure your MySQL server is running.
   - Edit `backend/db.php` if your MySQL credentials differ from `root` with no password.
   - Run the setup script to create the database and tables:
     ```bash
     php backend/setup.php
     ```

2. **Backend Server**
   - Start the PHP development server from the project root:
     ```bash
     php -S localhost:8000
     ```

3. **Frontend Application**
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies (if not already installed):
     ```bash
     npm install
     ```
   - Start the Angular development server:
     ```bash
     npm start
     ```
   - Open your browser at `http://localhost:4200`.

## Game Features

- **Mobile Ready**: Responsive design that works on mobile devices.
- **PvP Mode**: Online multiplayer via local network or internet (if hosted).
- **Nice Ships**: Visual indicators for ships and hits.
- **Dynamic Gameplay**: Real-time(ish) updates via polling.

## Technical Details

- **Frontend**: Angular 19+ (Standalone Components)
- **Backend**: PHP 8+
- **Database**: MySQL

Enjoy the game!
