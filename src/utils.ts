import type { SocketIoOptions } from './types'
import { readFileSync } from 'fs'

export function parseTime(value: string): number {
  const timeout = Number(value)
  if (timeout !== timeout) throw new Error('timeout must be number')
  return timeout
}

export function parseQuery(
  value: string,
  query: SocketIoOptions['query'] = Object.create(null)
) {
  const searchParams = new URLSearchParams(value)
  for (const [key, value] of searchParams) {
    query[key] = value
  }
  return query
}

export function parseAuth(
  value: string,
  auth: { [key: string]: any } = Object.create(null)
) {
  const rule = /^(?<authField>.+?):(?<authValue>.+)$/
  const match = value.match(rule)
  if (!match) throw new Error('auth must be field:value')
  const { authField, authValue } = match.groups!
  auth[authField] = authValue
  return auth
}

export function parseJSON(value: string, json: any = Object.create(null)) {
  if (value.trim()) {
    try {
      const data = JSON.parse(value)
      return {
        ...json,
        ...data,
      }
    } catch {
      throw new Error('options must be json')
    }
  }
}

export function parseFile(value: string) {
  return readFileSync(value).toString()
}

export function parseCa(value: string, ca: string[] = []) {
  const res = readFileSync(value).toString()
  ca.push(res)
  return ca
}

export function toJSON(value: any): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

export function eventToLine(event: string, messageList: any[]) {
  const text = messageList
    .map((message) => toJSON(message))
    .join(' ')
  return `${event}: ${text}`
}

export function lineToEvent(value: string) {
  const reg = /(?<eventName>[^\s]+?):\s*(?<message>.*)/
  const match = value.match(reg)
  if (!match) return null
  const eventName = match.groups!.eventName
  const message = match.groups!.message
  //支持emit的多个参数
  let messageList = []
  try {
    const data = JSON.parse(message)
    if (Array.isArray(data)) messageList = data
    else messageList.push(data)
  } catch {
    if (message) messageList.push(message)
  }
  return {
    eventName,
    messageList,
  }
}

export function timeFormat(date?: Date | number, formatter?: string): string {
  const toDoubleNumber = (num: number) => {
    const v = String(num)
    return num > 9 ? v : '0' + v
  }
  const curr = new Date()
  formatter = formatter ? formatter : 'hh:mm:ss'
  let h = curr.getHours()
  let m = curr.getMinutes()
  let s = curr.getSeconds()
  if (date instanceof Date) {
    h = date.getHours()
    m = date.getMinutes()
    s = date.getSeconds()
  } else if (typeof date === 'number') {
    s = parseInt((parseFloat(String(date)) / 1000).toFixed(0))
    m = parseInt(String(s / 60))
    h = parseInt(String(m / 60))
    const d = parseInt(String(h / 24))
    s = s - m * 60
    m = m - h * 60
    h = h - d * 24
  }
  return formatter
    .replace('hh', toDoubleNumber(h))
    .replace('mm', toDoubleNumber(m))
    .replace('ss', toDoubleNumber(s))
}
