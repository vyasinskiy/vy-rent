import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ApiService } from './api.service';

@Module({
  imports: [AuthModule],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiModule {}
