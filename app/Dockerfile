FROM public.ecr.aws/docker/library/python:3.12-slim AS base
WORKDIR /app

# Non-root user
RUN groupadd -r app && useradd -r -g app app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

USER app
EXPOSE 8000

# Health check (also defined in task definition)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz').read()" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]