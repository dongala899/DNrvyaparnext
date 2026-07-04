export function registerSubscriptions(eventBus, service) {
  eventBus.on('auth:loggedIn', async () => {
    const result = await service.getList();
    if (result.success) {
      service.store?.setItems(result.data);
    }
  });
}