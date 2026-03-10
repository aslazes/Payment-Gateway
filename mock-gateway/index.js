const axios = require('axios');
const { Kafka } = require('kafkajs');

const PRISM_BASE_URL = process.env.PRISM_BASE_URL || 'http://prism:4010';
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:9092';
const PAYMENTS_TOPIC = process.env.PAYMENTS_TOPIC || 'payments.lifecycle';
const REFUNDS_TOPIC = process.env.REFUNDS_TOPIC || 'payments.refunds';

async function createKafkaProducer() {
  const kafka = new Kafka({
    clientId: 'mock-gateway',
    brokers: [KAFKA_BROKER],
  });

  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

function buildEvent(eventType, payload) {
  return {
    eventType,
    eventId: `${eventType}_${Date.now()}`,
    occurredAt: new Date().toISOString(),
    payload,
  };
}

async function sendDemoFlow(producer) {
  console.log('[mock-gateway] Starting demo flow against Prism...');

  try {
    // 1. Создаём платёж через Prism mock
    const paymentRequest = {
      orderId: 'ORD-100500',
      amount: 149.9,
      currency: 'EUR',
      cardToken: 'tok_demo_123',
    };

    const createResp = await axios.post(
      `${PRISM_BASE_URL}/payments`,
      paymentRequest,
      { timeout: 5000 }
    );

    const payment = createResp.data || {};
    const paymentId = payment.paymentId || 'pay_demo_1';

    console.log('[mock-gateway] Payment created via Prism:', paymentId);

    // Публикуем payment_created
    const paymentCreated = buildEvent('payment_created', {
      paymentId,
      orderId: payment.orderId || paymentRequest.orderId,
      amount: payment.amount || paymentRequest.amount,
      currency: payment.currency || paymentRequest.currency,
      status: payment.status || 'PENDING',
      redirectUrl: payment.redirectUrl || null,
    });

    await producer.send({
      topic: PAYMENTS_TOPIC,
      messages: [{ key: paymentId, value: JSON.stringify(paymentCreated) }],
    });

    console.log('[mock-gateway] Sent event payment_created');

    // Имитация успешного завершения платежа
    const paymentSucceeded = buildEvent('payment_succeeded', {
      paymentId,
      orderId: payment.orderId || paymentRequest.orderId,
      amount: payment.amount || paymentRequest.amount,
      currency: payment.currency || paymentRequest.currency,
      status: 'SUCCEEDED',
      providerTransactionId: 'acq_txn_demo_1',
      completedAt: new Date().toISOString(),
    });

    await producer.send({
      topic: PAYMENTS_TOPIC,
      messages: [{ key: paymentId, value: JSON.stringify(paymentSucceeded) }],
    });

    console.log('[mock-gateway] Sent event payment_succeeded');

    // 2. Создаём возврат (refund) против того же платежа
    const refundRequest = { amount: 49.9 };

    await axios.post(
      `${PRISM_BASE_URL}/payments/${encodeURIComponent(paymentId)}/refunds`,
      refundRequest,
      { timeout: 5000 }
    ).catch((err) => {
      // Prism может быть настроен как pure-mock и не проверять paymentId;
      // для демо нам не критично, просто логируем.
      console.warn('[mock-gateway] Refund call to Prism failed (ignored in demo):', err.message);
    });

    const refundId = `ref_demo_1`;

    const refundRequested = buildEvent('refund_requested', {
      refundId,
      paymentId,
      orderId: payment.orderId || paymentRequest.orderId,
      amount: refundRequest.amount,
      currency: payment.currency || paymentRequest.currency,
      status: 'REQUESTED',
    });

    await producer.send({
      topic: REFUNDS_TOPIC,
      messages: [{ key: refundId, value: JSON.stringify(refundRequested) }],
    });

    console.log('[mock-gateway] Sent event refund_requested');

    const refundCompleted = buildEvent('refund_completed', {
      refundId,
      paymentId,
      orderId: payment.orderId || paymentRequest.orderId,
      amount: refundRequest.amount,
      currency: payment.currency || paymentRequest.currency,
      status: 'REFUNDED',
      providerRefundId: 'acq_ref_demo_1',
      completedAt: new Date().toISOString(),
    });

    await producer.send({
      topic: REFUNDS_TOPIC,
      messages: [{ key: refundId, value: JSON.stringify(refundCompleted) }],
    });

    console.log('[mock-gateway] Sent event refund_completed');
  } catch (err) {
    console.error('[mock-gateway] Demo flow failed:', err.message);
  }
}

async function main() {
  console.log('[mock-gateway] Starting with config:', {
    PRISM_BASE_URL,
    KAFKA_BROKER,
    PAYMENTS_TOPIC,
    REFUNDS_TOPIC,
  });

  const producer = await createKafkaProducer();

  await sendDemoFlow(producer);

  console.log('[mock-gateway] Demo flow done, keeping process alive for inspection');

  // Не выходим сразу, чтобы контейнер не завершался мгновенно
  // и можно было посмотреть логи, состояние Kafka и т.п.
  // Простейший "keep-alive" таймер.
  setInterval(() => {
    console.log('[mock-gateway] Still running...');
  }, 60000);
}

main().catch((err) => {
  console.error('[mock-gateway] Fatal error:', err);
  process.exit(1);
});

