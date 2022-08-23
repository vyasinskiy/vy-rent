import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, BaseSchema } from '../schemas/base.schema';

export type AccountDocument = Account & BaseDocument;

@Schema()
export class Account extends BaseSchema {
  @Prop()
  appartmentId: number;

  @Prop()
  organizationName: string;

  @Prop()
  organizationId: string;

  @Prop()
  address: string;

  @Prop()
  number: string;

  @Prop()
  debt: string;

  @Prop()
  type: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
