export function registerSubscriptions(eventBus, service, sharedState) {
  eventBus.on('auth:loggedIn', async () => {
    const result = await service.getStatus();
    if (result.success) {
      sharedState.getState().setLicensed(result.data.valid);
      sharedState.getState().setLicenseInfo(result.data);
    }
  });
}