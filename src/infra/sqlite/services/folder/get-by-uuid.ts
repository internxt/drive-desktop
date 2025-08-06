import { folderRepository } from '../drive-folder';
import { logger } from '@/apps/shared/logger/logger';
import { SingleItemError } from '../common/single-item-error';
import { parseData } from './parse-data';

type Props = {
  uuid: string;
};

export async function getByUuid({ uuid }: Props) {
  try {
    const data = await folderRepository.findOne({ where: { uuid } });

    if (data) return { data: parseData({ data }) };

    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by uuid',
      uuid,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
