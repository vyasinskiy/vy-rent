import { Injectable, Logger } from '@nestjs/common';
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

export interface AccrualData {
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
  private readonly logger = new Logger(ApiService.name);

  constructor(private readonly authService: AuthService) {}

  public async getAppartmenstList() {
    const URL = `${baseProviderURL}/personal/apartment`;
    const data = await this.doRequest<Appartment>(URL);

    return data;
  }

  public async getAppartmentAccounts(appartmentId) {
    const URL = `${baseProviderURL}/personal/Account/ListByApartment?apartmentId=${appartmentId}`;
    const data = await this.doRequest<AppartmentAccount>(URL);
    return { appartmentId, accounts: data };
  }

  public async getAccountAccruals(accountId) {
    const URL = `${baseProviderURL}/personal/Accruals/List?accountId=${accountId}`;
    const data = await this.doRequest<AccrualData>(URL);
    return data;
  }

  public async getInvoice(accountId: number, period: number) {
    const URL = `${baseProviderURL}/personal/Accruals/GetInvoice/${accountId}?period=${period}`;
    const data = await this.doRequest<any>(URL, {
      responseType: 'stream',
    });

    return {
      accountId,
      period,
      data: data,
    };
  }

  // TODO: any => axios options type
  private async doRequest<T>(url, options?: Record<string, any>) {
    const cookie = await this.authService.getCookie();

    if (!cookie) {
      this.logger.error('Unable to make request: no cookies');
      return;
    }

    try {
      const response = await axios.get<T[]>(url, {
        headers: {
          cookie,
        },
        timeout: 5000,
        ...options,
      });

      if (response.statusText === 'OK') {
        return response.data;
      }
    } catch (error) {
      this.logger.error(`Error while fetching URL: ${url}: ${error}`);
    }
  }
}
