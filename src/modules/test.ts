import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  return request('http://localhost:8000/auth/test', {}, query)
}
