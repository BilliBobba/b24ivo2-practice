from flask import Flask, jsonify, request
import redis
import os
import time
import socket
import logging
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Подключение к Redis
redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
try:
    r = redis.from_url(redis_url, decode_responses=True)
    logger.info(f"Connected to Redis at {redis_url}")
except Exception as e:
    logger.error(f"Could not connect to Redis: {e}")
    r = None

# Prometheus метрики
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency', ['method', 'endpoint'])

# Middleware для метрик
@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    if hasattr(request, 'start_time'):
        latency = time.time() - request.start_time
        REQUEST_LATENCY.labels(method=request.method, endpoint=request.endpoint or 'unknown').observe(latency)
        REQUEST_COUNT.labels(method=request.method, endpoint=request.endpoint or 'unknown', status=response.status_code).inc()
    return response

@app.route('/')
def index():
    """Главная страница с информацией о контейнере"""
    container_id = socket.gethostname()
    is_canary = os.getenv('CANARY', 'false') == 'true'
    
    # Увеличиваем счетчик визитов в Redis
    visit_count = 0
    if r:
        try:
            visit_count = r.incr('visit_count')
            logger.info(f"Visit count: {visit_count} from container {container_id}")
        except Exception as e:
            logger.error(f"Redis error: {e}")
    
    return jsonify({
        'message': 'DevOps Practice - Load Testing Demo',
        'container_id': container_id,
        'canary': is_canary,
        'visit_count': visit_count,
        'timestamp': time.time()
    })

@app.route('/health')
def health():
    """Health check эндпоинт"""
    redis_status = 'unknown'
    if r:
        try:
            r.ping()
            redis_status = 'healthy'
        except Exception:
            redis_status = 'unhealthy'
    
    return jsonify({
        'status': 'ok',
        'redis': redis_status,
        'container_id': socket.gethostname()
    }), 200

@app.route('/metrics')
def metrics():
    """Prometheus метрики"""
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.route('/error')
def error():
    """Эндпоинт для генерации тестовой ошибки (Задание 3)"""
    container_id = socket.gethostname()
    error_message = f"ERROR: Test error endpoint called from container {container_id}"
    logger.error(error_message)
    return jsonify({
        'error': 'Test error generated',
        'container_id': container_id,
        'message': 'Check Loki logs for this error'
    }), 500

@app.route('/slow')
def slow():
    """Медленный эндпоинт для тестирования"""
    time.sleep(0.5)
    return jsonify({'message': 'Slow response', 'delay': 0.5})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)