# Веб-скраппер MyMeet.AI
Основной readme файл [тут](../readme.md)

## Требования

- Docker
- Docker Compose

## Установка и запуск

1. Клонирование репозитория:
```bash
git clone <repository-url>
cd task_1
```

2. Запустите приложение через Docker Compose:
```bash
docker-compose up --build
```

## Структура проекта

```
├── Dockerfile            # Dockerfile
├── docker-compose.yml    # Docker Compose
├── task_1.ts             # Основной код
├── tsconfig.json         # Конфигурация TS
├── readme.md             # Readme файл для проекта
├── scraped_images/       # Директория для скачанных изображений
└── scraped_texts/        # Директория для извлеченного текста
```

## Результаты работы

После успешного выполнения скрипта:
- Текстовый контент будет сохранен в директории `scraped_texts`
- Изображения будут сохранены в директории `scraped_images`

## Технологии

- TypeScript
- Puppeteer
- Node.js
- Docker
- Docker Compose