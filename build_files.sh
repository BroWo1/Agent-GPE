#!/bin/bash

# Use Vercel's Python environment
export PATH=/vercel/.python/bin:$PATH

# Debug - print Python and pip locations
which python3
which pip3

# Install dependencies and run Django commands
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput --no-input
python3 manage.py migrate --noinput