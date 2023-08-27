import { createSocketIoCommand } from '@/command'
import { Command } from 'commander'
import { resolve } from 'path'
import * as fs from 'fs'

jest.mock('fs')

describe('command', () => {
  let command: Command
  const addProgramOption = (name) =>
    name.length > 1
      ? process.argv.push(`--${name}`)
      : process.argv.push(`-${name}`)

  const addProgramOptionValue = (value) => process.argv.push(value)

  const resetProgramOption = (argv?: string[]) =>
    (process.argv = argv ? argv : ['node', 'index.js', 'ws://127.0.0.1'])

  beforeAll(() => {
    //@ts-ignore
    jest.spyOn(process, 'exit').mockImplementation(() => {})
  })

  beforeEach(() => {
    resetProgramOption()
    command = createSocketIoCommand()
  })

  it('default value', () => {
    command.parse()
    expect(command.opts()).toMatchObject({
      keep: true,
      upgrade: true,
      timestampRequests: true,
    })
  })

  it('arrary value', () => {
    const options = {
      protocols: ['ws', 'wss', 'http', 'https'],
      transports: ['websocket', 'polling'],
    }
    Object.entries(options).forEach(([name, value]) => {
      addProgramOption(name)
      value.forEach((item) => addProgramOptionValue(item))
    })
    command.parse()
    expect(command.opts()).toMatchObject(options)
  })

  it('query value', () => {
    addProgramOption('query')
    addProgramOptionValue('name=zs&age=20')
    command.parse()
    expect(command.opts()).toMatchObject({
      query: {
        name: 'zs',
        age: '20',
      },
    })
  })

  it('correct file path', () => {
    const files = Array(10)
      .fill(1)
      .map((v, i) => {
        const types = ['key', 'cert', 'ca']
        const type = types[i] ? types[i] : 'ca'
        const file = Object.create(null) as {
          type: string
          content: string
          path: string
        }
        ;(file.type = type), (file.content = `${type}${i}`)
        file.path = `./test${i}.${type}`
        return file
      })
    const options = {}
    files.forEach(({ type, content, path }) => {
      if (options[type]) {
        addProgramOptionValue(path)
        //单个文件转成文件数组
        if (!Array.isArray(options[type]))
          options[type] = [options[type], content]
        else options[type].push(content)
      } else {
        options[type] = content
        addProgramOption(type)
        addProgramOptionValue(path)
      }
    })
    // @ts-ignore
    fs.readFileSync.mockImplementation((path: string) => {
      const cwd = process.cwd()
      const readPath = resolve(cwd, path)
      const filesMap = files.reduce((acc, item) => {
        const { path, content } = item
        const absolutePath = resolve(cwd, path)
        acc[absolutePath] = content
        return acc
      }, {})
      if (filesMap[readPath]) return filesMap[readPath]
      throw new Error(`no such file or directory, open '${readPath}'`)
    })
    command.parse()
    expect(command.opts()).toMatchObject(options)

    //不存的文件应该报错
    resetProgramOption()
    addProgramOption('key')
    addProgramOptionValue(Math.random().toString(16).substring(2))

    expect(() => command.parse()).toThrowError()
  })

  it('Incorrect file path', () => {
    const options = {
      key: './test/test.ca',
      ca: ['./test/test.ca', './test/test.ca'],
      cert: './test/test.ca',
    }
    Object.entries(options).forEach(([name, value]) => {
      addProgramOption(name)
      if (Array.isArray(value))
        value.forEach((item) => addProgramOptionValue(item))
      else addProgramOptionValue(value)
    })

    expect(() => command.parse()).toThrowError()
  })

  it('JSON value', () => {
    const options = { transports: ['websocket'], forceBase64: false }
    const json = JSON.stringify(options)
    addProgramOption('json')
    addProgramOptionValue(json)
    command.parse()
    expect(command.opts()).toMatchObject({
      json: options,
    })
  })

  it('Invalid JSON value', () => {
    const options = { transports: ['websocket'], forceBase64: false }
    const json = JSON.stringify(options)
    addProgramOption('json')
    addProgramOptionValue(json + 'a')
    expect(() => command.parse()).toThrowErrorMatchingSnapshot()
  })

  it('correct auth', () => {
    const auth = {
      username: 'password',
      token: '123456',
      ':token': ':gajdxvgrwi=?}:<',
    }
    addProgramOption('auth')
    Object.entries(auth).forEach(([k, v]) => {
      addProgramOptionValue(`${k}:${v}`)
    })
    command.parse()
    expect(command.opts()).toMatchObject({
      auth,
    })
  })

  it('Invalid auth', () => {
    const invalidValue = ['a', 'aa', 'a:', ':a', '::']
    for (const v of invalidValue) {
      resetProgramOption()
      addProgramOption('auth')
      addProgramOptionValue(v)
      expect(() => command.parse()).toThrowErrorMatchingSnapshot()
    }
  })
})
