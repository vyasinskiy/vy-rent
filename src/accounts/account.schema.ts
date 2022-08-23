import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AccountDocument = Account & Document;

@Schema({ id: true })
export class Account {
  @Prop()
  _id: number;

  @Prop()
  appartmentId: number;

  @Prop()
  organizationName: string;

  @Prop()
  organizationId: string;

  @Prop()
  address: string;

  @Prop()
  debt: string;

  @Prop()
  type: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
