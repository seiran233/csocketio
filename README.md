# csocketio

一个简单的socket.io 命令行客户端，用来检测 socket.io 连接。

## 使用方法

### 安装

```sh
npm install -g csocketio
```

### 参数及选项

```sh
$ csocketio --help
Usage: index csocketio <url> [options]

Arguments:
  url                                socket.io server url

Options:
  -V, --version                      output the version number
  -t, --timeout <timeout>            timeout of socke.io-client options
  --transports <transports...>       transports of socke.io-client options
  --path <path>                      path of socke.io-client options
  --query <query>                    query of socke.io-client options
  --cert <cert>                      cert of socke.io-client options
  --key <key>                        key of socke.io-client options
  --ca <ca...>                       ca of socke.io-client options
  --ciphers <ciphers>                ciphers of socke.io-client options
  --protocols <protocols...>         protocols of socke.io-client options
  --timestampParam <timestampParam>  timestampParam of socke.io-client options
  --rememberUpgrade                  rememberUpgrade of socke.io-client options
  --auth <auth...>                   auth of socke.io-client options
  --forceBase64                      forceBase64 of socke.io-client options
  --no-upgrade                       upgrade of socke.io-client options
  --no-timestampRequests             timestampRequests of socke.io-client options
  -n, --no-keep                      will not keep connection
  -o, --json <json>                  A JSON containing other socket.io-client options
  -h, --help                         display help for command
```

### 发送事件

发送事件的方式是控制台输入：事件名称:消息。
如果消息是一个json，则会被解析，如果解析的结果是一个数组，那么数组的每一项会作为一个参数传递。


```sh
$ csocketio ws://127.0.0.1:3000
Connected with options({"upgrade":true,"timestampRequests":true}), press CTRL+C to quit
> eventName:hello
> eventName:["hello", "socket.io"]
> eventName:'{"message":"hello"}'
> eventName:[["hello", "socket.io"]]
```

例如以上控制台输入，客户端将这样发送事件：

```javascript
io.emit(eventName, 'hello')
io.emit(eventName, 'hello', 'socket.io')
io.emit(eventName, { hello: 'socket.io' })
io.emit(eventName, ['hello', 'socket.io'])
```
