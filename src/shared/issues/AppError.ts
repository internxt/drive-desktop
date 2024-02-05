const AppErrors = ['UNKNOWN_DEVICE_NAME'] as const;

export type AppError = (typeof AppErrors)[number];
