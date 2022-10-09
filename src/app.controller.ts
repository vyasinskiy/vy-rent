import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { AppService } from './app.service';

// данные по каждому аккаунту (по месяцам) должны сохраняться в БД
// запрос по аккаунтам должен производиться каждый день
// если получены данные по новому месяцу - сохранять их в БД и триггерить событие

// при запросе инвойсов за конкретный месяц должны возвращаться данные из БД

// при триггере события "новые данные за месяц" производится проверка неоплаченной задолженности за прошлый месяц (продумать)
// если имеется задолженность - уведомление

// в бота надо отправлять файл + описание

// добавить уведомление о приеме показаний, уведомление о передаче показаний

// в дальнейшем добавить админку с регистрацией новых арендаторов, генерацией договоров, расторжением договоров

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/update/:entity')
  async updateEntity(@Param('entity') entity: string) {
    await this.appService.updateEntity(entity);
  }

  @Get('/update-invoices/:periodId')
  async updateInvoices(@Param('periodId') periodId?: string) {
    await this.appService.updateInvoices(+periodId);
  }
}
