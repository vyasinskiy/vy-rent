import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { baseProviderURL } from './assets/constants';
import { AuthService } from './auth.service';

interface Appartment {
  id: number;
  address: string;
  description: null;
  debt: number;
  hasConfirmedAccounts: boolean;
  hasDiscount: boolean;
  discountMessage: null;
}

interface AppartmentAccount {
  id: number;
  isApproved: boolean;
  organizationName: string;
  organizationId: string;
  logo: null;
  address: string;
  number: string;
  type: string;
  canSplit: boolean;
  debt: number;
  blocked: boolean;
  blockUntil: Date;
}

interface AccountData {
  accountId: number;
  periodName: string;
  periodId: number;
  inBalance: number;
  sum: number;
  fine: number;
  toPay: number;
  payed: number;
  invoiceExists: boolean;
  button: object;
}

@Injectable()
export class DataProviderService {
  constructor(private readonly authService: AuthService) {}
  async getAppartmentList() {
    try {
      const { data } = await axios.get<Appartment[]>(
        `${baseProviderURL}/personal/apartment`,
        {
          headers: {
            cookie: await this.authService.getCookie(),
          },
        },
      );

      debugger;
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  async getAppartmentAccounts(id) {
    try {
      const { data } = await axios.get<AppartmentAccount[]>(
        `${baseProviderURL}/personal/Account/ListByApartment?apartmentId=${id}`,
        {
          headers: {
            cookie: await this.authService.getCookie(),
          },
        },
      );

      debugger;
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  async getAccountData(id) {
    try {
      const { data } = await axios.get<AccountData[]>(
        `${baseProviderURL}/personal/Accruals/List?accountId=${id}`,
        {
          headers: {
            cookie: await this.authService.getCookie(),
          },
        },
      );

      debugger;
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  async getInvoice(accountId: number, period: number) {
    try {
      const { data } = await axios.get<AccountData[]>(
        `${baseProviderURL}/personal/Accruals/GetInvoice/${accountId}?period=${period}`,
        {
          headers: {
            cookie: await this.authService.getCookie(),
          },
        },
      );

      debugger;
      return data;
    } catch (error) {
      console.error(error);
    }
  }
}
