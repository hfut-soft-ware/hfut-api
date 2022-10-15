import { IQuery } from '../server'
// import request from '../shared/request'

export default async function(query: IQuery) {
  console.log(query.cookie)
  return {
    code: 200,
    data: query.cookie,
  }
}
