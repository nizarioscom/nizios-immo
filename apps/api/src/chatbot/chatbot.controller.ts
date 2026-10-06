import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { clientIp } from '../common/rate-limit';
import { ChatbotService } from './chatbot.service';

class StartChatDto {
  @IsString()
  @MaxLength(200)
  host!: string;
}

class MessageChatDto {
  @IsString()
  sessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  value?: string;
}

class NudgeChatDto {
  @IsString()
  sessionId!: string;
}

@Controller('public/chat')
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post('start')
  @HttpCode(201)
  start(@Body() body: StartChatDto, @Req() req: Request, @Headers('x-forwarded-for') forwarded?: string) {
    return this.chatbot.start(body.host, clientIp({ 'x-forwarded-for': forwarded }, req.ip));
  }

  @Post('message')
  @HttpCode(200)
  message(@Body() body: MessageChatDto, @Req() req: Request, @Headers('x-forwarded-for') forwarded?: string) {
    return this.chatbot.message(body.sessionId, { text: body.text, value: body.value }, clientIp({ 'x-forwarded-for': forwarded }, req.ip));
  }

  @Post('nudge')
  @HttpCode(200)
  nudge(@Body() body: NudgeChatDto) {
    return this.chatbot.nudge(body.sessionId);
  }
}
