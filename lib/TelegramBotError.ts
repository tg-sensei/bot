export const TelegramBotErrorCode = {
  EditSameContent: 'EditSameContent',
  EmptyButtonText: 'EmptyButtonText',
  LongCallbackData: 'LongCallbackData',
  MissingCallbackData: 'MissingCallbackData',
  LongNotificationText: 'LongNotificationText',
  UnsupportedContent: 'UnsupportedContent',
} as const;

export type TelegramBotErrorCode = (typeof TelegramBotErrorCode)[keyof typeof TelegramBotErrorCode];

export type TelegramBotErrorOptions = ErrorOptions & {
  message?: string;
};

// TODO: add error context (i.e. query for UnsupportedCallbackData etc)
export class TelegramBotError extends Error {
  readonly code: TelegramBotErrorCode;

  constructor(code: TelegramBotErrorCode, options?: TelegramBotErrorOptions) {
    super(options?.message ?? code, options);

    this.code = code;
  }
}
