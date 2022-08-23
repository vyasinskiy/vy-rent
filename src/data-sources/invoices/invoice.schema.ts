import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, BaseSchema } from '../schemas/base.schema';

export type InvoiceDocument = Invoice & BaseDocument;

@Schema()
export class Invoice extends BaseSchema {
  @Prop()
  appartmentId: number;

  @Prop()
  accountId: number;

  @Prop()
  periodCode: number;

  @Prop()
  src: string;
}

export const InvoicesSchema = SchemaFactory.createForClass(Invoice);
