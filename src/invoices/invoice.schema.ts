import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ id: true })
export class Invoice {
  @Prop()
  _id: number;

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
