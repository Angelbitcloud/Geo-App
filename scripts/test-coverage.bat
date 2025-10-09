@echo off
REM Script to run tests with coverage in Docker

echo Running tests with coverage in Docker...
docker-compose --profile test run --rm web-test npm run test:coverage
