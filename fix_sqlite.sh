#!/bin/bash

# Правильный деплой изменений на сервер
set -e

echo "🚀 Деплой изменений на сервер..."
echo "=================================="

# 1. Откатить локальные изменения на сервере
echo "↩️  Откатываем локальные изменения на сервере..."
git checkout -- .

# 2. Скачать последние изменения с GitHub
echo "⬇️  Скачиваем изменения с GitHub..."
git pull origin main

# 3. Остановить контейнеры
echo "⏹️  Останавливаем контейнеры..."
docker-compose down

# 4. Пересобрать контейнеры
echo "🔨 Пересобираем контейнеры (может занять несколько минут)..."
docker-compose build --no-cache

# 5. Запустить контейнеры
echo "▶️  Запускаем контейнеры..."
docker-compose up -d

# 6. Показать статус
echo ""
echo "⏳ Ждем запуска сервисов (10 секунд)..."
sleep 10

echo ""
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "📋 Последние логи backend:"
docker-compose logs backend | tail -20

echo ""
echo "=================================="
echo "✅ Деплой завершен!"
echo ""
echo "🌐 Ваше приложение доступно:"
echo "   Frontend: https://egorloh.duckdns.org"
echo "   Backend API: http://185.177.216.22:3002"
echo ""
echo "📝 Для просмотра логов используйте:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
