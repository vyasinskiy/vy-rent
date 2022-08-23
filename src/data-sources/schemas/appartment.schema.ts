import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, BaseSchema } from './base.schema';

export type AppartmentDocument = Appartment & BaseDocument;

@Schema()
export class Appartment extends BaseSchema {
  @Prop()
  address: string;

  @Prop()
  description: string;

  @Prop()
  debt: number;
}

export const AppartmentSchema = SchemaFactory.createForClass(Appartment);
