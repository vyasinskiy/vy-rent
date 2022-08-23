import { Prop, Schema } from '@nestjs/mongoose';

export type BaseDocument = BaseSchema & Document;

@Schema({ id: true })
export class BaseSchema {
  @Prop()
  _id: number;
}
