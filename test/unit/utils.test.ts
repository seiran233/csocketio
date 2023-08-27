import {
  eventToLine,
  lineToEvent,
  parseAuth,
  parseCa,
  parseFile,
  parseJSON,
  parseQuery,
  parseTime,
  timeFormat,
  toJSON,
} from '@/utils'
import * as fs from 'fs'
import { SocketIoOptions } from '@/types'

jest.mock('fs')
describe('utils', () => {
  it('parseTime', () => {
    const timeout = 10000
    expect(parseTime(`${timeout}`)).toBe(timeout)
    expect(() => parseTime('1000a')).toThrowErrorMatchingSnapshot()
  })

  it('parseQuery', () => {
    const query = {
      name: 'cl',
      age: '100',
    }
    const queryString = Object.entries(query)
      .map(([k, v]) => {
        return `${k}=${v}`
      })
      .join('&')
    expect(parseQuery(queryString)).toEqual(query)
    expect(parseQuery(queryString, { x: 'x' })).toEqual({
      ...query,
      x: 'x',
    })
  })

  it('parseAuth', () => {
    const auth = {
      username: 'password',
      token: '123456',
      ':token': '::gaj:dxvgrwi=?}:<',
    }
    const res = Object.entries(auth).reduce((acc, [k, v]) => {
      return parseAuth(`${k}:${v}`, acc)
    }, undefined)
    expect(res).toEqual(auth)
    const invalidAuth = ['a', ':', 'aa', 'a:', ':a', '::']

    invalidAuth.forEach((auth) => {
      expect(() => parseAuth(auth)).toThrowErrorMatchingSnapshot()
    })
  })

  it('parseJSON', () => {
    const options: SocketIoOptions = {
      transports: ['websocket', 'polling'],
    }
    expect(parseJSON(JSON.stringify(options))).toEqual(options)

    expect(() => parseJSON('x')).toThrowErrorMatchingSnapshot()
  })

  it('parseFile', () => {
    const file = {
      path: './mock',
      content: 'mock file',
    }
    //@ts-ignore
    fs.readFileSync.mockImplementation((path: string) => {
      if (path === file.path) return file.content
      else throw new Error()
    })
    expect(parseFile(file.path)).toBe(file.content)

    expect(() => parseFile('./mock1')).toThrow()
  })

  it('parseFile', () => {
    const files = Array(10)
      .fill(1)
      .map((v, i) => {
        const file = Object.create(null) as {
          content: string
          path: string
        }
        file.content = `mock file${i}`
        file.path = `./test${i}.ca`
        return file
      })
    //@ts-ignore
    fs.readFileSync.mockImplementation((path: string) => {
      const i = files.findIndex((file) => file.path === path)
      if (i >= 0) return files[i].content
      else throw new Error()
    })
    const ca = files.reduce((acc: string[], file) => {
      return parseCa(file.path, acc)
    }, undefined)
    expect(ca).toEqual(files.map((file) => file.content))
  })

  it('toJSON', () => {
    const string = 'string'
    const array = ['a', '1'] as any[]
    const object = {
      array,
    }
    expect(toJSON(string)).toBe(string)
    expect(toJSON(object)).toBe(JSON.stringify(object))

    array.push(object)
    expect(toJSON(array)).toBe('')
  })

  it('eventToLine', () => {
    const event = 'message'
    const messages = [1, '2', { 3: Uint8Array.from([6]) }, Buffer.from([7])]
    const line = eventToLine(event, messages)
    expect(line).toBe(
      `${event}: 1 2 ${JSON.stringify(messages[2])} ${JSON.stringify(
        messages[3]
      )}`
    )
  })

  it('lineToEvent', () => {
    expect(lineToEvent('message: 123')).toEqual({
      eventName: 'message',
      messageList: [123],
    })
    expect(lineToEvent('message: [1,2,3]')).toEqual({
      eventName: 'message',
      messageList: [1, 2, 3],
    })
    expect(lineToEvent('message: [[1,2,3]]')).toEqual({
      eventName: 'message',
      messageList: [[1, 2, 3]],
    })
    expect(lineToEvent('message: [[1,2')).toEqual({
      eventName: 'message',
      messageList: ['[[1,2'],
    })
  })
  it('timeFormat', () => {
    const todayTimestamp  = new Date().getTime() - new Date().setHours(0,0,0,0)
    expect(timeFormat(todayTimestamp)).toMatch(
      /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
    )
    expect(timeFormat(new Date())).toMatch(
      /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
    )
    expect(timeFormat(todayTimestamp, 'hh时mm分ss秒')).toMatch(/^([01]\d|2[0-3])时[0-5]\d分[0-5]\d秒$/)
    expect(timeFormat(24 * 60 * 60 * 1000)).toMatch('00:00:00')
  })
})
