import type { ManagerOptions, SocketOptions } from 'socket.io-client'

export interface ProgramOptions {
  timeout: number;
  transports: string[];
  path: string;
  cert: string;
  key: string;
  ca: string[];
  ciphers: string;
  protocols: string[];
  timestampParam: string;
  upgrade: boolean;
  rememberUpgrade: boolean;
  forceBase64: boolean;
  timestampRequests: boolean;
  keep: boolean;
  auth: string[];
  json: {[key: string]: any};
}

export interface SocketIoOptions extends  Partial<ManagerOptions & SocketOptions> {}
