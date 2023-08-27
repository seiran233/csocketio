import { spawn, execSync } from 'child_process'
import { createInterface } from 'readline'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { toJSON } from '@/utils'

const httpServer = createServer()
const io = new Server(httpServer)

beforeAll(async () => {
  await execSync('tsc', {
    stdio: 'ignore',
  })
  await new Promise((resolve) => {
    httpServer.listen(3000, () => {
      resolve(3000)
    })
  })
})

describe('feature', () => {
  const connectWithOptions = (options: { [key: string]: any }) => {
    const argv = ['./dist/index.js', 'ws://127.0.0.1:3000']
    for (const key in options) {
      const option = key.length > 1 ? `--${key}` : `-${key}`
      const value = options[key]
      argv.push(option)
      if (Array.isArray(value)) value.forEach((item) => argv.push(item))
      if (value) argv.push(value)
    }
    const child = spawn('node', argv)
    const readline = createInterface({
      input: child.stdout,
    })
    const r = [readline, child] as const
    return r
  }
  const matchSuccessMessage = (text: string) => {
    const successRegExp = {
      default: /Connecte success,options: (?<o1>.+)/,
      noKeep: /Connected with options\((.+)\), press CTRL\+C to quit/,
      get root() {
        return new RegExp(`${this.default.source}|${this.noKeep.source}`)
      },
    }
    if (successRegExp.root.test(text)) {
      const { o1, o2 } = text.match(successRegExp.root).groups
      return o1 ?? o2
    }
    return null
  }
  it('connect', (done) => {
    const [readline] = connectWithOptions({
      'no-keep': '',
    })
    readline.on('line', (line) => {
      if (line.trim() !== '') expect(line).toMatch('Connecte success,options:')
    })
    readline.on('close', () => {
      expect.assertions(1)
      done()
    })
  })
  it('connect with json', (done) => {
    const jsonOptions = { transports: ['websocket'] }
    const [readline] = connectWithOptions({
      'no-keep': '',
      json: JSON.stringify(jsonOptions),
    })
    readline.on('line', (line) => {
      if (line.trim()) {
        try {
          const socketIoOptions = matchSuccessMessage(line)
          expect(socketIoOptions).not.toBeNull()
          expect(JSON.parse(socketIoOptions)).toMatchObject({
            ...jsonOptions,
          })
        } catch (error) {
          done(error)
        }
      }
    })
    readline.on('close', () => {
      expect.assertions(2)
      done()
    })
  })
  it('emit and recived', (done) => {
    const [readline, child] = connectWithOptions({ transports: ['websocket'] })
    const sent = {}
    const queue = [
      {
        name: 'text',
        data: 'hello, socket.io',
      },
      {
        name: 'object',
        data: {
          message: 'hello, socket.io',
        },
      },
      {
        name: 'multiple-params',
        data: ['hello', { text: 'hello' }],
      },
      {
        name: 'array-data',
        data: [['hello socket.io']],
      },
    ]
    const emitEvent = () => {
      if (!queue.length) return child.stdin.end()
      const { name, data } = queue.shift()
      sent[name] = data
      if (typeof data === 'string') child.stdin.write(`${name}:${data}\n`)
      else child.stdin.write(`${name}:${JSON.stringify(data)}\n`)
    }
    let outputCount = 0
    readline.on('line', (line) => {
      //第一行output是''
      if (outputCount === 1) {
        try {
          expect(matchSuccessMessage(line)).not.toBeNull()
          emitEvent()
        } catch (error) {
          done(error)
        }
      } else if (outputCount > 1) {
        // skip input
        if (/>\s*/.test(line)) return
        try {
          const reg = /< \d\d:\d\d:\d\d (.+):\s(.+)/
          const match = line.match(reg)
          expect(match).not.toBeNull()
          expect(toJSON(sent[match[1]])).toEqual(match[2])
          emitEvent()
        } catch (error) {
          done(error)
        }
      }
      outputCount++
    })
    readline.on('close', () => {
      expect.assertions(2 + Object.keys(sent).length * 3)
      done()
    })
    io.on('connect', (socket) => {
      socket.onAny((event, ...args) => {
        const data = ['array-data', 'multiple-params'].includes(event)
          ? args
          : args[0]
        try {
          expect(data).toEqual(sent[event])
          socket.emit(event, data)
        } catch (error) {
          done(error)
        }
      })
      socket.on('disconnect', (reason) => {
        try {
          expect(reason).toBe('client namespace disconnect')
        } catch (error) {
          done(error)
        }
      })
    })
  }, 10000)
})

afterAll(() => {
  io.close()
  httpServer.close()
})
