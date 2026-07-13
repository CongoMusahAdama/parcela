import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SystemSessionState,
  SystemSessionStateSchema,
} from './schemas/system-session-state.schema';
import { SessionRevocationService } from './services/session-revocation.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemSessionState.name, schema: SystemSessionStateSchema },
    ]),
  ],
  providers: [SessionRevocationService],
  exports: [SessionRevocationService],
})
export class SessionRevocationModule {}
