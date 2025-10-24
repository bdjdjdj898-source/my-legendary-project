# Инструкция по настройке сервера для JWT авторизации

## Текущее состояние
- ✅ Android приложение готово и собирается
- ✅ JWT авторизация реализована на фронтенде
- ✅ Backend роуты созданы в `backend/src/routes/auth.ts`
- ⏳ Backend еще не запущен на сервере с новыми изменениями

## Шаги для запуска на сервере 185.177.216.22

### 1. Подключитесь к серверу
```bash
ssh root@185.177.216.22
```

### 2. Перейдите в директорию проекта
```bash
cd /var/www/my-vintage-shop
# или где находится ваш backend
```

### 3. Обновите код из Git
```bash
git pull origin main
```

### 4. Установите новые зависимости
```bash
cd backend
npm install
```

Новые пакеты:
- `jsonwebtoken` - для создания и проверки JWT токенов
- `bcryptjs` - для хеширования паролей
- `@types/jsonwebtoken` и `@types/bcryptjs` - типы TypeScript

### 5. Обновите .env файл
Добавьте переменную для JWT секретного ключа:

```bash
nano backend/.env
```

Добавьте строку:
```
JWT_SECRET=ваш-очень-длинный-и-сложный-секретный-ключ-минимум-32-символа
```

Сгенерировать безопасный ключ можно так:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Запустите миграцию базы данных
```bash
npx prisma migrate dev --name add_jwt_auth
```

Это создаст:
- Новые поля в таблице User: `email`, `password` (оба nullable для обратной совместимости с Telegram users)
- Новую таблицию `RefreshToken` для хранения refresh токенов

### 7. Пересоберите backend
```bash
npm run build
```

### 8. Перезапустите backend сервис
Если используете PM2:
```bash
pm2 restart backend
# или
pm2 restart all
```

Если используете systemd:
```bash
systemctl restart vintage-shop-backend
```

### 9. Проверьте что сервер работает
```bash
curl http://localhost:3002/api/products
```

Должен вернуть JSON с товарами или пустой массив.

## Проверка JWT авторизации

### Создайте тестового пользователя
```bash
curl -X POST http://185.177.216.22:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User"
  }'
```

Должно вернуть:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "name": "Test User",
      "role": "user",
      "isVerified": false
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### Проверьте логин
```bash
curl -X POST http://185.177.216.22:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

## Обратная совместимость

Старые Telegram пользователи **продолжат работать**! Они:
- Имеют `telegramId` (не null)
- Не имеют `email` и `password` (null)
- Могут войти через Telegram Mini App (если оно еще работает)

Новые пользователи через Android app:
- Имеют `email` и `password` (не null)
- Могут не иметь `telegramId` (null)
- Входят через JWT авторизацию

## Troubleshooting

### Ошибка "Database connection failed"
Проверьте что PostgreSQL запущен:
```bash
systemctl status postgresql
```

### Ошибка "JWT_SECRET not defined"
Убедитесь что добавили `JWT_SECRET` в `backend/.env`

### Приложение показывает "Failed to fetch"
1. Проверьте что backend запущен: `pm2 status`
2. Проверьте логи: `pm2 logs backend`
3. Проверьте доступность: `curl http://185.177.216.22:3002/api/products`

### Prisma migration не работает
Если возникают конфликты, можно сбросить базу (ВНИМАНИЕ: удалит все данные):
```bash
npx prisma migrate reset
```

Или создать миграцию вручную в SQL.

## Следующие шаги

После успешного запуска backend:

1. **Откройте приложение на Android эмуляторе**
2. **Нажмите "Создать аккаунт"**
3. **Заполните форму регистрации**
4. **После регистрации вы автоматически войдете в приложение**
5. **Добавьте товары через админ-панель (нужен пользователь с ролью admin)**

Чтобы сделать пользователя админом:
```bash
# Подключитесь к БД
npx prisma studio
# Или через SQL
psql -U your_db_user -d your_db_name -c "UPDATE \"User\" SET role = 'admin' WHERE email = 'test@example.com';"
```

## Структура файлов

Все JWT файлы уже созданы:

```
backend/
├── src/
│   ├── routes/
│   │   └── auth.ts              # POST /register, /login, /refresh, /logout
│   ├── middleware/
│   │   └── jwtAuth.ts           # JWT проверка для защищенных роутов
│   ├── utils/
│   │   ├── jwt.ts               # generateAccessToken(), verifyToken()
│   │   └── bcrypt.ts            # hashPassword(), comparePassword()
│   └── server.ts                # app.use('/api/auth', authRoutes)
```

Все готово к запуску! 🚀
