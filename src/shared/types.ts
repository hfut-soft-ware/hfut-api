import { ParamsDictionary, Request, Response } from 'express-serve-static-core'
import { AxiosResponse } from 'axios'
import { ParsedQs } from 'qs'

export type ModulesResponse = Response<any, Record<string, any>, number>
export type ModulesRequest = Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>

export interface IAnswer {
  body?: AxiosResponse['data']

  cookie?: string[]

  status?: number

  config?: AxiosResponse['config']

  headers: AxiosResponse['headers']
}
