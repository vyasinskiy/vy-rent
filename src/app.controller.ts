import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async test(@Body() body) {
    console.log(body);
  }

  @Get('/get-last-month-invoices')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/pdf')
  async getLastMonthInvoices() {
    const invoices = await this.appService.getLastMonthInvoices();
    // this.appService.bot.sendMediaGroup(invoices)
  }

  @Get('/update-invoices/:periodId')
  async updateInvoices(@Param('periodId') periodId?: string) {
    await this.appService.updateInvoices(+periodId);
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
