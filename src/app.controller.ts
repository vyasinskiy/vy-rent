import { Controller, Get } from '@nestjs/common';
import { getCurrentPeriodCode } from './assets/helpers';
import { DataSourceService } from './data-sources/data-source.service';

@Controller()
export class AppController {
  constructor(private readonly dataSourceService: DataSourceService) {}

  // данные по каждому аккаунту (по месяцам) должны сохраняться в БД
  // запрос по аккаунтам должен производиться каждый день
  // если получены данные по новому месяцу - сохранять их в БД и триггерить событие

  // при запросе инвойсов за конкретный месяц должны возвращаться данные из БД

  // при триггере события "новые данные за месяц" производится проверка неоплаченной задолженности за прошлый месяц (продумать)
  // если имеется задолженность - уведомление

  // в бота надо отправлять файл + описание

  // добавить уведомление о приеме показаний, уведомление о передаче показаний

  // в дальнейшем добавить админку с регистрацией новых арендаторов, генерацией договоров, расторжением договоров

  // @Get('/current-month-invoices')
  // async getCurrentMonthInvoices(): Promise<any> {
  //   return await this.dataSourceService.getInvoicesForMonth(
  //     getCurrentPeriodCode(),
  //   );
  // }

  @Get('/update-all')
  async check(): Promise<any> {
    return await this.dataSourceService.updateAll();
  }
}
