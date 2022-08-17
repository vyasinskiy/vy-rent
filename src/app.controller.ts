import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';
import { writeFile } from 'fs/promises';
import { getCurrentPeriod } from './assets/helpers';

@Controller()
export class AppController {
  constructor(private readonly apiService: ApiService) {}

  // данные по каждому аккаунту (по месяцам) должны сохраняться в БД
  // запрос по аккаунтам должен производиться каждый день
  // если получены данные по новому месяцу - сохранять их в БД и триггерить событие

  // при запросе инвойсов за конкретный месяц должны возвращаться данные из БД

  // при триггере события "новые данные за месяц" производится проверка неоплаченной задолженности за прошлый месяц (продумать)
  // если имеется задолженность - уведомление

  // в бота надо отправлять файл + описание

  // добавить уведомление о приеме показаний, уведомление о передаче показаний

  // в дальнейшем добавить админку с регистрацией новых арендаторов, генерацией договоров, расторжением договоров

  @Get('/current-month-invoices')
  async getCurrentMonthInvoices(): Promise<any> {
    const appartmentList = await this.apiService.getAppartmentList();

    const accountsRequests = appartmentList.map((appartment) =>
      this.apiService.getAppartmentAccounts(appartment.id),
    );
    const accounts = (await Promise.all(accountsRequests)).flat();

    for await (const account of accounts) {
      try {
        const currentPeriod = Number(getCurrentPeriod());
        const { accountId, period, data } = await this.apiService.getInvoice(
          account.id,
          currentPeriod,
        );
        await writeFile(`${accountId}-${period}.pdf`, data);
      } catch {
        debugger;
      }
    }
  }
}
