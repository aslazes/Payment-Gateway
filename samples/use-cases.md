# Use cases (MVP)

Документ описывает пользовательские сценарии (use cases) для интеграции интернет-магазина (Merchant System) с Payment Gateway MVP.

**REST API (контракт):**
- `POST /payments` — создать платеж
- `GET /payments/{paymentId}` — получить текущий статус платежа
- `GET /payments` — получить список платежей (фильтры: `orderId`, `customerId`)
- `POST /payments/{paymentId}/refunds` — запросить возврат (полный или частичный)

**Статусы (MVP):**
- `Payment.status`: `PENDING` -> `SUCCEEDED` или `FAILED`
- `Refund.status`: `REQUESTED` -> `REFUNDED` или `FAILED`

**События (Kafka, для асинхронного трекинга):**
- topic `payments.lifecycle`: `payment_created`, `payment_succeeded`, `payment_failed`
- topic `payments.refunds`: `refund_requested`, `refund_completed`

---

## 1. Успешная оплата

**Акторы:** Покупатель, Merchant System, Payment Gateway, внешний провайдер (Acquirer).

**Предусловия:**
- В Merchant System создан заказ с `orderId`.
- Merchant System получил `cardToken` (детали токенизации и/или 3DS-редиректа находятся вне MVP-контракта).

**Основной поток:**
1. Merchant System вызывает `POST /payments` и передает `orderId`, `amount`, `currency`, `cardToken`.
2. Payment Gateway создает платеж и отвечает `201` объектом `Payment` со статусом `PENDING`.
3. Если в ответе есть `redirectUrl`, Merchant System (или фронт магазина) перенаправляет покупателя на страницу банка/провайдера и дожидается завершения проверки.
4. После подтверждения провайдером Payment Gateway переводит платеж в `SUCCEEDED`.
5. Merchant System узнает итоговый статус одним из способов:
   - polling: периодически вызывает `GET /payments/{paymentId}` до `status=SUCCEEDED`;
   - events: подписывается на `payments.lifecycle` и получает `payment_succeeded`.

**Результат:** заказ считается оплаченным; у Merchant System есть `paymentId` для последующих операций (например, возвратов).

**Альтернативы:**
- Повторная попытка создать платеж для того же `orderId` может быть отклонена ошибкой `DUPLICATE_ORDER` (MVP-код ошибки).

---

## 2. Неуспешная оплата

**Акторы:** Покупатель, Merchant System, Payment Gateway, Acquirer.

**Вариант A: ошибка при создании платежа**
1. Merchant System вызывает `POST /payments`.
2. Payment Gateway валидирует запрос/бизнес-правила и отвечает `400` с `ErrorResponse`.

**Типичные коды ошибок (MVP):**
- `INVALID_CARD`, `EXPIRED_CARD`
- `INSUFFICIENT_FUNDS`
- `CARD_DECLINED`
- `DUPLICATE_ORDER`

**Результат:** платеж не создан, заказ остается неоплаченным.

**Вариант B: платеж создан, но позже отклонен провайдером**
1. Merchant System вызывает `POST /payments` и получает `201` + `Payment` со статусом `PENDING`.
2. После попытки списания Payment Gateway переводит платеж в `FAILED`.
3. Merchant System узнает итоговый статус:
   - polling: `GET /payments/{paymentId}` возвращает `status=FAILED`;
   - events: в `payments.lifecycle` приходит `payment_failed` (в payload обычно есть причина отказа, например `failureCode`).

**Результат:** заказ остается неоплаченным, Merchant System может предложить повторить оплату другим способом/картой.

---

## 3. Запрос возврата

**Акторы:** Merchant System, Payment Gateway, Acquirer.

**Предусловия:**
- Исходный платеж существует и находится в состоянии `SUCCEEDED`.

**Основной поток:**
1. Merchant System вызывает `POST /payments/{paymentId}/refunds` и передает сумму возврата `amount`.
2. Payment Gateway регистрирует возврат и отвечает `201` объектом `Refund` со статусом `REQUESTED`.
3. Возврат обрабатывается асинхронно у провайдера.
4. Merchant System отслеживает завершение одним из способов:
   - events: `payments.refunds` (`refund_requested`, затем `refund_completed` со `status=REFUNDED`);
   - (опционально в будущем) через отдельный API для статуса возврата, если он появится в контракте.

**Результат:** средства возвращены полностью или частично (в зависимости от `amount`).

**Альтернативы/ошибки:**
- `400 REFUND_NOT_ALLOWED` — возврат невозможен для данного платежа (например, платеж неуспешный, истек срок, уже полностью возвращен).
- `400 INVALID_AMOUNT` — сумма некорректна (например, больше суммы платежа, меньше/равна нулю).

---

## 4. Получение списка платежей

**Акторы:** Merchant System, Payment Gateway.

**Цель:** получить историю платежей для заказа/клиента (витрина, админка, поддержка, сверки).

**Основной поток:**
1. Merchant System вызывает `GET /payments` с фильтрами:
   - `orderId` — чтобы получить все платежи по конкретному заказу;
   - `customerId` — чтобы получить платежи конкретного покупателя (если такая интеграция используется).
2. Payment Gateway отвечает `200` массивом объектов `Payment`.
3. Для уточнения по конкретному платежу Merchant System может дополнительно вызвать `GET /payments/{paymentId}`.

**Результат:** Merchant System отображает/использует текущие статусы (`PENDING`/`SUCCEEDED`/`FAILED`) и атрибуты платежей.

