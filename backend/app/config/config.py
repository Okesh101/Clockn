# app/config/config.py

import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'fallback-secret-key')

    # SQLALCHEMY
    SQLALCHEMY_TRACK_MODIFICATIONS = os.getenv(
        'SQLALCHEMY_TRACK_MODIFICATIONS', 'False') == 'True'

    # Grab the DB URL from the environment (Render default or fallback)
    # Render natively populates "DATABASE_URL"
    database_url = os.getenv('DATABASE_URL') or os.getenv(
        'SQLALCHEMY_DATABASE_URI')

    # Crucial Fix: Convert 'postgres://' to 'postgresql://' for production compatibility
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = database_url

    # SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-super-secret-key')  # JWT needs a secret key
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(
        os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 900)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(
        os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))


class DevelopmentConfig(Config):
    """Development configurations."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configurations."""
    DEBUG = False

