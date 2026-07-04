export function registerSubscriptions(eventBus, service) {
  eventBus.on('invoice:created', (data) => {
    service.eventBus.emit('payment:allocated', { invoiceId: data.invoice.id, amount: 0, paymentId: null });
  });
}