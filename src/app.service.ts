import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AppService {
  private cookie: string | null;

  constructor(private configService: ConfigService) {
    this.cookie = null;
  }

  async getSomeData() {
    const cookie = await this.getCookie();
    // TODO: do some request
    return cookie;
  }

  async getCookie() {
    if (!this.cookie) {
      this.cookie = await this.requestCookie();
    }

    return this.cookie;
  }

  // TODO: add typing
  async requestCookie(): Promise<any> {
    const { userName, token } = await this.requestToken();
    try {
      const response = await axios.post(
        'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/web/Account/Authorize',
        JSON.stringify({ userName, token }),
        {
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      // TODO: get response set-cookie header
    } catch (error) {
      console.error(error);
    }
  }

  async requestToken() {
    const login = this.configService.get<string>('LOGIN');
    const password = this.configService.get<string>('PASSWORD');

    try {
      const { data } = await axios.post(
        'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/web/account/login',
        JSON.stringify({ login, password }),
        {
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      return data;
    } catch (error) {
      console.error(error);
    }
  }
}
