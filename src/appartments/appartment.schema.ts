import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppartmentDocument = Appartment & Document;

@Schema({ id: true })
export class Appartment {
  @Prop()
  _id: number;

  @Prop()
  address: string;

  @Prop()
  description: string;

  @Prop()
  accounts: number[];

  @Prop()
  debt: number;
}

export const AppartmentSchema = SchemaFactory.createForClass(Appartment);
