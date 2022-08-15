import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}

  async login(): Promise<any> {
    const data = {
      login: '89002638502',
      password: 'Setpass2021kv',
    };
    const response = await this.httpService
      .post(
        'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/web/account/login',
        JSON.stringify(data),
        {
          headers: {
            'content-type': 'application/json',
          },
        },
      )
      .pipe(map((resp) => res.data));
    const res = await response.pipe();
    console.log(res);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // debugger;
    // return response;
  }
}
