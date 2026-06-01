import { Request, Response } from 'express';
import { Container } from 'diod';
import { statfs } from '../../services/operations/statfs.service';

export async function statfsController(req: Request, res: Response, container: Container) {
  const result = await statfs({ container });

  if (result.error) {
    res.json({ errno: result.error.code });
    return;
  }

  res.json({ errno: 0, ...result.data });
}
