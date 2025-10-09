@echo off
REM Script to run tests in Docker

echo Running tests in Docker...
docker-compose --profile test run --rm web-test npm test
