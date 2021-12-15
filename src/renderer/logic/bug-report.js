import log from 'electron-log'
import { createReadStream } from 'fs'
import fs from 'fs/promises'

export async function reportBug(errorDetails, userComment, includeLogs) {
  const logs = includeLogs ? await readLog() : undefined

  const reportBody = {
    ...errorDetails,
    userComment,
    logs
  }

  await fetch(process.env.BUG_REPORTING_URL, {
    method: 'POST',
    body: JSON.stringify(reportBody)
  })
}

export function readLog() {
  return new Promise(async (resolve, reject) => {
    const logPath = log.transports.file.getFile().path

    const MAX_SIZE = 1024 * 30

    const { size } = await fs.lstat(logPath)

    const start = size > MAX_SIZE ? size - MAX_SIZE : 0

    const stream = createReadStream(logPath, { start })

    const rawFile = []

    stream.on('data', buf => rawFile.push(buf))
    stream.on('close', () => {
      resolve(Buffer.concat(rawFile).toString('utf-8'))
    })
    stream.on('error', reject)
  })
}
