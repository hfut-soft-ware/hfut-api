import { AxiosResponse } from 'axios'
import { Request, Response } from 'express'
// import { ParamsDictionary, Request, Response } from 'express-serve-static-core'
// import { ParsedQs } from 'qs'

// export type ModulesResponse = Response<any, Record<string, any>, number>
// export type ModulesRequest = Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>

export interface IAnswer {
  body?: AxiosResponse['data']

  cookie?: string[]

  status?: number

  config?: AxiosResponse['config']

  headers: AxiosResponse['headers']
}

export interface IQuery<T = any> {
  req: Request<any, any, any, T>
  res: Response
  cookie: string
}

export interface ServerFunctionRes {
  code: number
  msg: string
  cookie?: string
  data?: any
  status?: number
  body?: any
}

export type ServerFunction<T = any> = (query: IQuery<T>) => Promise<ServerFunctionRes>
