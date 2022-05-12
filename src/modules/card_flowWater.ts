import request from '../shared/request'
import { IQuery } from '../server'

export default async function(query: IQuery) {
  return request('https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accounttodatTrjnObject.action', {
    method: 'POST',
    data: {
      account: 165719,
      inputObject: 'all',
      submit: ' ȷ %B6%A8 ',
    },
  }, query.cookie)
}
