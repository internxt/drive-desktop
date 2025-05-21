import yargs from 'yargs';
import z from 'zod';

import { drive, logger } from './drive';

const argv = yargs
  .command('file', 'El path del archivo para obtener el estado', {
    path: {
      description: 'el path del archivo',
      alias: 'f',
      type: 'string',
    },
  })
  .help()
  .alias('help', 'h').argv;

const { data } = z.object({ file: z.string() }).safeParse(argv);

if (data) {
  const path = data.file;
  const state = drive.getPlaceholderState({
    path,
  });
  logger.debug({ msg: 'state', state });
} else {
  logger.error({ msg: 'Please specify a file with --file <path>' });
}
