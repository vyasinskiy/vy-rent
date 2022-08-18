import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MongoClient } from 'mongodb';

declare const module: any;

// Replace <password> with actual password!
const uri =
  'mongodb+srv://Vitaliy:<password>@cluster0.vjfia.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function bootstrap() {
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db('kv-online-db');
  const collection = db.collection('kv');
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
