import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccrualDocument = Accrual & Document;

@Schema({ id: true })
export class Accrual {
  @Prop()
  accountId: number;

  @Prop()
  appartmentId: number;

  @Prop()
  periodName: string;

  @Prop()
  periodId: number;

  @Prop()
  inBalance: number;

  @Prop()
  sum: number;

  @Prop()
  fine: number;

  @Prop()
  toPay: number;

  @Prop()
  payed: number;

  @Prop()
  invoiceExists: boolean;
}

export const AccrualSchema = SchemaFactory.createForClass(Accrual);
