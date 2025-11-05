# Multi-stage build для оптимизации размера образа
FROM python:3.11-slim AS base

# Установка зависимостей
FROM base AS deps
WORKDIR /app

# Копируем requirements.txt
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Production образ
FROM base AS runner
WORKDIR /app

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser

# Копируем зависимости и приложение
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin
COPY --chown=appuser:appuser app.py ./

USER appuser

EXPOSE 5000

ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health').read()" || exit 1

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
