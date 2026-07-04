export function registerSubscriptions(eventBus, service) {
  eventBus.on('grn:created', (data) => {
    service.eventBus.emit('purchase:created', { purchase: { grnId: data.grn.id, vendorId: data.grn.vendorId } });
  });
}