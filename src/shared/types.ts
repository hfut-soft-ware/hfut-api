import { ParamsDictionary, Request, Response } from 'express-serve-static-core'
import { ParsedQs } from 'qs'

export type ModulesResponse = Response<any, Record<string, any>, number>
export type ModulesRequest = Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
