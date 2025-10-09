@echo off
REM Script to run tests in watch mode in Docker

echo Running tests in watch mode in Docker...
docker-compose --profile test run --rm web-test npm run test:watch
