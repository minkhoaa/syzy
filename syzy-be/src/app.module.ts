import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { EmailModule } from './modules/email/email.module';
import { DatabaseModule } from './database/database.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { AuthModule } from './modules/auth/auth.module';
import { MeModule } from './modules/me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    HealthModule,
    EmailModule,
    WaitlistModule,
    AuthModule,
    MeModule,
  ],
})
export class AppModule {}
