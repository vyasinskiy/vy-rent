import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { baseProviderURL } from '../assets/constants';
import { AuthService } from '../auth/auth.service';

interface Appartment {
  id: number;
  address: string;
  description: null;
  debt: number;
  hasConfirmedAccounts: boolean;
  hasDiscount: boolean;
  discountMessage: null;
}

export interface AppartmentAccount {
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
export class ApiService {
  constructor(private readonly authService: AuthService) {}

  async getAppartmentList() {
    const URL = `${baseProviderURL}/personal/apartment`;
    const { data } = await this.doRequest<Appartment>(URL);

    return data;
  }

  async getAppartmentAccounts(appartmentId) {
    const URL = `${baseProviderURL}/personal/Account/ListByApartment?apartmentId=${appartmentId}`;
    const { data } = await this.doRequest<AppartmentAccount>(URL);
    return { appartmentId, accounts: data };
  }

  async getAccountAccruals(accountId) {
    const URL = `${baseProviderURL}/personal/Accruals/List?accountId=${accountId}`;
    const { data } = await this.doRequest<AccountData>(URL);
    return data;
  }

  async getInvoice(accountId: number, period: number) {
    const URL = `${baseProviderURL}/personal/Accruals/GetInvoice/${accountId}?period=${period}`;
    const { data } = await this.doRequest<any>(URL, {
      responseType: 'stream',
    });

    return {
      accountId,
      period,
      data: data,
    };
  }

  // TODO: any => axions options type
  async doRequest<T>(url, options?: Record<string, any>) {
    const cookie = await this.authService.getCookie();

    try {
      const response = await axios.get<T[]>(url, {
        headers: {
          cookie,
        },
        ...options,
      });

      return response;
    } catch (error) {
      console.error(`Error while fetching URL: ${url}: ${error}`);
    }
  }
}
