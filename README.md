## Social Network website
## Project Task
### Http methods знаходяться в файлі samples.http

### 1. Створення додатку:
* Cерверний додаток на базі NestJS.
* PostgreSQL як основна база даних.
* Налаштований Swagger для документування API.
### 2. Сутності:
* Створена таблицю users для зберігання основної інформації про користувачів.
* Створена таблицю posts для зберігання інформації про пости користувачів.
### 3. CRUD операції:
* Для users:
    * POST /user для створення користувача з хешованим паролем (bcrypt).
* Для posts:
    * POST /posts для створення нового посту для авторизованого користувача.
    * GET /posts/
    * для отримання всіх постів користувача з кешуванням в Redis.
### 4. JWT авторизація:
* Реалізувано JWT авторизацію з токеном, який має термін дії.
* Токен приходить на запит get-token, з логіном і паролем юзера.
### 5. Кешування через Redis:
* Реалізувано кешування результатів GET-запитів до /posts/
* через Redis.
### 6. Валідація та помилки:
* Реалізувано 401 Unauthorized для запитів без валідного токена.
* Реалізувано 403 Forbidden при відсутності необхідних параметрів.
### 7. Docker та Docker Compose:
* Налаштуваний Docker для контейнеризації додатку.
* Налаштуваний Docker Compose для одночасного запуску серверу, PostgreSQL та Redis.
### 8. Тестування:
* Написані юніт-тести для CRUD операцій, авторизації та кешування.
* Додано інтеграційні тести для перевірки роботи додатку.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests
## Unit and e2e tests for Post Controller and Post Service

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```
