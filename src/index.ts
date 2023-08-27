#!/usr/bin/env node
import { io } from 'socket.io-client'
import { SocketIoConsole } from './console'
import { createSocketIoCommand } from './command'
import type { ProgramOptions } from './types'
import { eventToLine, lineToEvent } from './utils'

createSocketIoCommand()
  .action(function (url: string, programOptions: ProgramOptions) {
    const { keep, json, ...reset } = programOptions
    const options = {
      ...json,
      ...reset,
    }
    const socketIoConsole = new SocketIoConsole()
    const socket = io(url, options)
    socket.on('connect', () => {
      if (!keep) {
        socketIoConsole.print({
          type: SocketIoConsole.MessageType.Success,
          content: [`Connecte success,options: ${JSON.stringify(options)}`],
        })
        return process.exit(0)
      }
      socketIoConsole.print({
        type: SocketIoConsole.MessageType.Success,
        content: [
          `Connected with options(${JSON.stringify(
            options
          )}), press CTRL+C to quit`,
        ],
      })
      socketIoConsole.prompt()
    })
    socket.on('connect_error', (error) => {
      socketIoConsole.print({
        type: SocketIoConsole.MessageType.Error,
        content: [error],
      })
      process.exit(-1)
    })
    socket.on('disconnect', (reason) => {
      socketIoConsole.print({
        type: SocketIoConsole.MessageType.Success,
        content: [reason],
      })
      process.exit(0)
    })
    socket.onAny((e: string, ...args) => {
      socketIoConsole.print({
        type: SocketIoConsole.MessageType.Info,
        content: [eventToLine(e, args)],
      })
    })
    socketIoConsole.on('close', () => {
      socket.connected && socket.disconnect()
      process.exit(0)
    })
    socketIoConsole.on('line', (content) => {
      const res = lineToEvent(content)
      if (!res) return
      socket.connected && socket.emit(res.eventName, ...res.messageList)
      socketIoConsole.prompt()
    })
  })
  .parse()
