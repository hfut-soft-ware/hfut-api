import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  const url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421a1a013d2746126022a50c7fec8/accountcardUser.action'

  return request(url, {}, query.cookie)
}
