import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

declare const module: any;

// const client = new MongoClient(uri);

async function bootstrap() {
  // await client.connect();
  // console.log('Connected successfully to server');
  // const db = client.db('kv-online-db');
  // const collection = db.collection('kv');
  const app = await NestFactory.create(AppModule);
  await app.listen(5000);
  console.log(`Application is running on: ${await app.getUrl()}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
