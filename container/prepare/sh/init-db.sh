#!/bin/bash
set -e

psql -h localhost -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p 5432 -a -q -f /docker-entrypoint-initdb.d/schema.sql