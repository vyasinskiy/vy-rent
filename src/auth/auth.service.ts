import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { baseProviderURL } from '../assets/constants';

interface TokenData {
  userName: string;
  token: string;
}

@Injectable()
export class AuthService {
  private cookie: string | null;

  constructor(private configService: ConfigService) {
    this.cookie = null;
  }

  async getCookie(forceUpdate?) {
    if (!this.cookie || forceUpdate) {
      this.cookie = await this.requestCookie();
    }

    return this.cookie;
  }

  async requestCookie() {
    const { userName, token } = await this.requestToken();

    try {
      const response = await axios.post(
        `${baseProviderURL}/web/Account/Authorize`,
        JSON.stringify({ userName, token }),
        {
          headers: {
            'content-type': 'application/json',
          },
        },
      );

      const cookies = response.headers['set-cookie'];

      if (cookies.length > 0) {
        console.warn('Received more than 1 cookie from provider');
      }

      return cookies[0];
    } catch (error) {
      console.error(error);
    }
  }

  async requestToken() {
    const login = this.configService.get<string>('LOGIN');
    const password = this.configService.get<string>('PASSWORD');

    try {
      const { data } = await axios.post<TokenData>(
        `${baseProviderURL}/web/account/login`,
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
