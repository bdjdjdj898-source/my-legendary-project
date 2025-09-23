# 🚀 Развертывание на VPS

## Быстрое развертывание с Cloud-Init

### 1. Создание сервера

**Рекомендуемая ОС:** Ubuntu 22.04 LTS

**Минимальные требования:**
- RAM: 1GB (рекомендуется 2GB)
- CPU: 1 ядро
- Диск: 20GB SSD
- Сеть: IPv4 + IPv6

### 2. Настройка Cloud-Init

При создании сервера используйте файл `cloud-init.yml` из корня проекта.

**Что нужно изменить в cloud-init.yml:**

1. **SSH ключ** (строка 21):
   ```yaml
   - ssh-rsa AAAAB3NzaC1yc2E... # Замените на ваш SSH ключ
   ```

2. **Домен** (строка 56):
   ```yaml
   server_name ваш-домен.com www.ваш-домен.com;
   ```

### 3. После создания сервера

```bash
# Подключение к серверу
ssh deploy@ваш-ip-адрес

# Переход в рабочую папку
cd /var/www/vintage-shop

# Клонирование проекта
git clone https://github.com/ваш-username/my-vintage-shop.git .

# Создание .env файла
nano .env
```

**Содержимое .env:**
```env
DATABASE_URL="file:./database.db"
TELEGRAM_BOT_TOKEN=ваш_реальный_токен_бота
ADMIN_TELEGRAM_IDS=ваш_telegram_id
NODE_ENV=production
PORT=3000
```

### 4. Первый запуск

```bash
# Установка зависимостей
npm install --production

# Сборка проекта
npm run build

# Генерация Prisma клиента
npm run db:generate

# Запуск миграций
npm run db:migrate

# Включение автозапуска
sudo systemctl enable vintage-shop
sudo systemctl start vintage-shop

# Активация Nginx сайта
sudo ln -s /etc/nginx/sites-available/vintage-shop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Настройка SSL (HTTPS)

```bash
# Установка SSL сертификата (замените домен)
sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com
```

### 6. Проверка работы

```bash
# Статус приложения
sudo systemctl status vintage-shop

# Просмотр логов
sudo journalctl -u vintage-shop -f

# Проверка Nginx
sudo systemctl status nginx

# Проверка портов
netstat -tlnp | grep :3000
```

### 7. Настройка Telegram бота

1. В BotFather выполните:
   ```
   /setmenubutton
   # Выберите вашего бота
   # Текст кнопки: "🛍 Открыть магазин"
   # URL: https://ваш-домен.com
   ```

2. Или настройте команды:
   ```
   /setcommands
   start - Запустить магазин
   shop - Открыть каталог
   help - Помощь
   ```

### 8. Автоматическое обновление

Используйте скрипт `/home/deploy/deploy.sh`:

```bash
# Обновление приложения
./deploy.sh
```

### 9. Мониторинг

```bash
# Системные ресурсы
htop

# Логи приложения в реальном времени
sudo journalctl -u vintage-shop -f

# Статус всех сервисов
sudo systemctl status vintage-shop nginx
```

### 10. Troubleshooting

**Если приложение не запускается:**
```bash
# Проверить логи
sudo journalctl -u vintage-shop --no-pager

# Проверить .env файл
cat .env

# Ручной запуск для отладки
cd /var/www/vintage-shop
npm start
```

**Если Nginx не работает:**
```bash
# Проверить конфигурацию
sudo nginx -t

# Проверить логи
sudo tail -f /var/log/nginx/error.log
```

**Если база данных не работает:**
```bash
# Проверить файл базы данных
ls -la database.db

# Пересоздать базу данных
npm run db:reset
```

## 📝 Полезные команды

### Управление сервисом
```bash
sudo systemctl start vintage-shop    # Запуск
sudo systemctl stop vintage-shop     # Остановка
sudo systemctl restart vintage-shop  # Перезапуск
sudo systemctl status vintage-shop   # Статус
```

### Управление Nginx
```bash
sudo systemctl reload nginx     # Перезагрузка конфигурации
sudo systemctl restart nginx   # Перезапуск
sudo nginx -t                 # Проверка конфигурации
```

### Backup базы данных
```bash
# Создание бэкапа
cp database.db database.db.backup

# Восстановление из бэкапа
cp database.db.backup database.db
sudo systemctl restart vintage-shop
```

## 🔐 Безопасность

Cloud-init автоматически настраивает:
- ✅ Файрвол (UFW) с нужными портами
- ✅ Автоматические обновления безопасности
- ✅ SSL сертификаты Let's Encrypt
- ✅ Пользователь deploy с ограниченными правами

## 📊 Мониторинг

Настроено автоматически:
- ✅ Systemd сервис с автоперезапуском
- ✅ Логирование через journald
- ✅ Health check эндпоинт `/health`
- ✅ Nginx reverse proxy с настройками производительности