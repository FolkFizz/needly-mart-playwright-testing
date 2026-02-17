import { APIRequestContext } from '@playwright/test';
import { ROUTE } from '@config/routes';

export class HealthApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async liveness() {
    return this.request.get(ROUTE.health, {
      headers: { Accept: 'application/json' }
    });
  }

  async readinessDb() {
    return this.request.get(ROUTE.healthDb, {
      headers: { Accept: 'application/json' }
    });
  }
}
