# Vintage Shop - Android Application

Кроссплатформенное приложение для винтажного магазина, мигрированное с Telegram Mini App на Android с использованием Capacitor.

## 🚀 Стек технологий

### Frontend (Mobile App)
- **React 19** + **TypeScript 5.8**
- **Vite 7** - быстрая сборка
- **Tailwind CSS 4** - современный дизайн в стиле Telegram
- **Capacitor 7** - нативные возможности Android
- **React Router** - навигация
- **JWT** - авторизация с email/password

### Backend
- **Node.js 18+** + **Express 4**
- **TypeScript 5**
- **Prisma 5** - ORM для PostgreSQL
- **JWT** (jsonwebtoken + bcryptjs)

## 📱 Команды для разработки

```bash
cd mobile-app

# Разработка
npm run dev              # Dev сервер

# Сборка для Android
npm run build            # Production сборка
npx cap sync android     # Синхронизация
npx cap open android     # Открыть в Android Studio
```

## 🔐 Авторизация

- **Access Token**: 15 минут
- **Refresh Token**: 30 дней
- Хранение: Capacitor Preferences

Эндпоинты: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`

## 🚀 Запуск на сервере

См. подробную инструкцию в [SERVER_SETUP.md](./SERVER_SETUP.md)

```bash
# На сервере 185.177.216.22
cd /var/www/my-vintage-shop
git pull origin main
cd backend
npm install
npx prisma migrate dev --name add_jwt_auth
npm run build
pm2 restart backend
```

## ✨ Особенности

- ✅ Дизайн в стиле Telegram
- ✅ Автоматический вход после регистрации
- ✅ Обратная совместимость со старыми Telegram пользователями
- ✅ JWT авторизация
- ✅ Защищенные роуты
- ✅ Админ панель

## 📄 Структура

```
mobile-app/
├── android/         # Android проект (Capacitor)
├── src/
│   ├── api/        # API клиент
│   ├── pages/      # Login, Register, Home, Admin
│   └── contexts/   # AuthContext, CartContext
```

## 🤖 Разработка

Создано с помощью [Claude Code](https://claude.com/claude-code)
