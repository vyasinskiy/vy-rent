import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { baseProviderURL } from '../assets/constants';

interface TokenData {
  userName: string;
  token: string;
}

@Injectable()
export class AuthService {
  private cookie: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(private configService: ConfigService) {}

  public async getCookie(forceUpdate?) {
    if (!this.cookie || forceUpdate) {
      const cookie = await this.requestCookie();
      if (!cookie) {
        this.logger.error('Error while getting cookies');
        return;
      }

      this.cookie = cookie;
    }

    return this.cookie;
  }

  private async requestCookie() {
    const data = await this.requestToken();

    if (!data) {
      this.logger.error('Error while getting token');
      return;
    }

    const { userName, token } = data;

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

      if (!cookies) {
        this.logger.error('Error while getting cookies');
        return;
      }

      return cookies[0];
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async requestToken() {
    const login = this.configService.get<string>('LOGIN');
    const password = this.configService.get<string>('PASSWORD');

    if (!login || !password) {
      this.logger.error(
        'Error while requesting token: LOGIN or PASSWORD keys is not specified',
      );
    }

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
      this.logger.error(error);
    }
  }
}
