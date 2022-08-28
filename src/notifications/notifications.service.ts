import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  cache: Record<string, object[]>;

  constructor() {
    this.cache = {};
  }

  addNotification(event, data) {
    this.cache[event].push(data);
  }

  async notify() {
    const url = 'someTelegramUrl';
    for await (const event of Object.keys(this.cache)) {
      await axios.post(url, { data: this.cache[event] });
    }
    this.clearCache();
  }

  clearCache() {
    this.cache = {};
  }
}
