import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/get-last-month-invoices')
  async getLastMonthInvoices() {
    await this.appService.updateInvoices();
  }

  @Get('/update-invoices')
  async updateInvoices() {
    await this.appService.updateInvoices();
  }
}

// данные по каждому аккаунту (по месяцам) должны сохраняться в БД
// запрос по аккаунтам должен производиться каждый день
// если получены данные по новому месяцу - сохранять их в БД и триггерить событие

// при запросе инвойсов за конкретный месяц должны возвращаться данные из БД

// при триггере события "новые данные за месяц" производится проверка неоплаченной задолженности за прошлый месяц (продумать)
// если имеется задолженность - уведомление

// в бота надо отправлять файл + описание

// добавить уведомление о приеме показаний, уведомление о передаче показаний

// в дальнейшем добавить админку с регистрацией новых арендаторов, генерацией договоров, расторжением договоров
