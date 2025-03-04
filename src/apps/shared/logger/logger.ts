import { SeverityNumber } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { inspect } from 'node:util';
import { getUser } from '../../main/auth/service';
import ElectronLog from 'electron-log';

const logExporter = new OTLPLogExporter({
  url: 'http://localhost:4318/v1/logs',
  headers: {},
  concurrencyLimit: 1,
});

const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

const otelLogger = loggerProvider.getLogger('default', '1.0.0');

type TRawBody = {
  msg: string;
  exc?: Error;
  attributes?: {
    tag?: 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE';
    userId?: string;
    endpoint?: keyof paths;
  };
  [key: string]: unknown;
};

class Logger {
  private prepareBody(rawBody: TRawBody) {
    const user = getUser();

    rawBody.attributes = {
      userId: user?.uuid,
      ...rawBody.attributes,
    };

    const { attributes, ...rest } = rawBody;

    const body = inspect(rest, { colors: true, depth: Infinity, breakLength: Infinity });

    return { attributes, body };
  }

  debug(rawBody: TRawBody) {
    const { body } = this.prepareBody(rawBody);
    ElectronLog.debug(body);
  }

  info(rawBody: TRawBody) {
    const { attributes, body } = this.prepareBody(rawBody);
    otelLogger.emit({ severityNumber: SeverityNumber.INFO, body, attributes });
    ElectronLog.info(body);
  }

  warn(rawBody: TRawBody) {
    const { attributes, body } = this.prepareBody(rawBody);
    otelLogger.emit({ severityNumber: SeverityNumber.WARN, body, attributes });
    ElectronLog.warn(body);
  }

  error(rawBody: TRawBody) {
    const { attributes, body } = this.prepareBody(rawBody);
    otelLogger.emit({ severityNumber: SeverityNumber.ERROR, body, attributes });
    ElectronLog.error(body);
  }

  fatal(rawBody: TRawBody) {
    const { attributes, body } = this.prepareBody(rawBody);
    otelLogger.emit({ severityNumber: SeverityNumber.FATAL, body, attributes });
    ElectronLog.error(body);
  }
}

export const logger = new Logger();
