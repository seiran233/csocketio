import { Command, InvalidOptionArgumentError } from 'commander'
//@ts-ignore
import { version } from '../package.json'
import { parseAuth, parseCa, parseFile, parseJSON, parseQuery, parseTime } from './utils'

const desc = (field: string) => `${field} of socke.io-client options`

const createParser = <T, U>(parse: (val: T, pre?: U) => U) => {
  return (...args: Parameters<typeof parse>) => {
    try {
      return parse(...args)
    } catch (error: any) {
     throw new InvalidOptionArgumentError(error.message)
    }
  }
}

export function createSocketIoCommand(): Command {
  return new Command()
    .version(version)
    .usage('csocketio <url> [options]')
    .argument('<url>', 'socket.io server url')
    .option(
      '-t, --timeout <timeout>',
      `${desc('timeout')}`,
      createParser(parseTime)
    )
    .option('--transports <transports...>', `${desc('transports')}`)
    .option('--path <path>', `${desc('path')}`)
    .option('--query <query>', `${desc('query')}`, createParser(parseQuery))
    .option('--cert <cert>', `${desc('cert')}`, createParser(parseFile))
    .option('--key <key>', `${desc('key')}`, createParser(parseFile))
    .option('--ca <ca...>', `${desc('ca')}`, createParser(parseCa))
    .option('--ciphers <ciphers>', `${desc('ciphers')}`)
    .option('--protocols <protocols...>', `${desc('protocols')}`)
    .option('--timestampParam <timestampParam>', `${desc('timestampParam')}`)
    .option('--rememberUpgrade', `${desc('rememberUpgrade')}`)
    .option('--auth <auth...>', `${desc('auth')}`, createParser(parseAuth))
    .option('--forceBase64', `${desc('forceBase64')}`)
    .option('--no-upgrade', `${desc('upgrade')}`)
    .option('--no-timestampRequests', `${desc('timestampRequests')}`)
    .option('-n, --no-keep', 'will not keep connection')
    .option(
      '-o, --json <json>',
      'A JSON containing other socket.io-client options',
      createParser(parseJSON)
    )
}
