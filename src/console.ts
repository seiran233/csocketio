import EventEmitter from 'events'
import { createInterface, Interface } from 'readline'
import { isatty } from 'tty'
import { timeFormat } from './utils'

export class SocketIoConsole extends EventEmitter {
  readlineInterface: Interface
  stdout: NodeJS.Process['stdout']
  stderr: NodeJS.Process['stderr']
  isOpen: boolean
  constructor() {
    super()
    this.stdout = process.stdout
    this.stderr = process.stderr
    this.readlineInterface = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    this.isOpen = true
    this.readlineInterface.on('line', (content: string) => {
      this.emit('line', content)
    })
    this.readlineInterface.on('close', () => {
      this.isOpen = false
      this.emit('close')
    })
  }

  prompt() {
    this.readlineInterface.prompt(true)
  }

  #ansi = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    bulue: '\x1b[34m',
    reset: '\x1b[0m',
  }
  colour(text: string, type: SocketIoConsole.MessageType) {
    if (!isatty(1)) return text
    const colors = {
      [SocketIoConsole.MessageType.Info]: text,
      [SocketIoConsole.MessageType.Success]: `${this.#ansi.green}${text}${
        this.#ansi.reset
      }`,
      [SocketIoConsole.MessageType.Error]: `${this.#ansi.red}${text}${
        this.#ansi.reset
      }`,
    }
    return colors[type]
  }

  print(output: SocketIoConsole.Output) {
    if (!this.isOpen) return
    const time = timeFormat()
    const { type, content } = output
    if (type === SocketIoConsole.MessageType.Success) {
      this.stdout.write(`\r${this.colour(content.join(' '), type)}\n`)
    } else if (type === SocketIoConsole.MessageType.Error) {
      const [error] = content
      let text = `${error.type}: ${error.message}`
      if (error.description) text += `\n  description: ${error.description}`
      this.stderr.write(`\r${this.colour(text, type)}\n`)
    } else if (type === SocketIoConsole.MessageType.Info) {
      const text = `< ${time} ${content.join(' ')}`
      this.stdout.write(`\r${this.colour(text, type)}\n`)
      this.prompt()
    }
  }
}
export namespace SocketIoConsole {
  export enum MessageType {
    Info = 0,
    Success,
    Error,
  }
  export interface Output {
    type: SocketIoConsole.MessageType
    content: any[]
  }
}
