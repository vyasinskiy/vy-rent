import { Controller, Get } from '@nestjs/common';
import { AccountsService } from './accounts/accounts.service';
import { AccrualsService } from './accruals/accruals.service';
import { AppartmentsService } from './appartments/appartments.service';
import { InvoiceService } from './invoices/invoices.service';

@Controller()
export class AppController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly appartmentsService: AppartmentsService,
    private readonly accountsService: AccountsService,
    private readonly accrualsService: AccrualsService,
  ) {}

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

  @Get('/test')
  async test(): Promise<any> {
    const accounts = await this.accountsService.getAllAccounts();
    for await (const account of accounts) {
      await this.accrualsService.updateAccrualsForAccount(account._id);
    }
    // const appartmentsList = await this.appartmentsService.getAppartmentsList();
    // for (const appartment of appartmentsList) {
    //   const accounts = await this.accountsService.getAccountsForAppartment(
    //     appartment._id,
    //   );

    //   for await (const account of accounts) {
    //     await this.accrualsService.updateAccrualsForAccount(account._id);
    //     const accountAccruals =
    //       await this.accrualsService.getAccrualsForAccount(account._id);
    //     for await (const accrual of accountAccruals) {
    //       const isInvoiceDownloaded =
    //         await this.invoiceService.checkIsInvoiceDownloaded(
    //           appartment._id,
    //           accrual.accountId,
    //           accrual.periodId,
    //         );

    //       if (!isInvoiceDownloaded && accrual.invoiceExists) {
    //         const invoice = await this.invoiceService.fetchInvoiceForPeriod(
    //           accrual.accountId,
    //           accrual.periodId,
    //         );

    //         const invoicePath = await this.invoiceService.constructInvoicePath(
    //           appartment._id,
    //           accrual.periodId,
    //           accrual.accountId,
    //         );
    //         await this.invoiceService.saveInvoice(invoice, invoicePath);
    //       }
    //     }
    //   }
    // }
    // return await this.invoiceService.updateInvoicesForPeriod(303569, 202207);
    // return await this.appartmentsService.updateAppartmentsList();
  }
}
