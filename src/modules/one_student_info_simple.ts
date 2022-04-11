import { IQuery } from '../server'
import request from '../shared/request'

export default function(query: IQuery) {
  const token = query.req.headers.authorization
  if (!token) {
    return {
      code: 401,
      msg: 'Unauthorized',
    }
  }
  const url = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/center/user/selectUserSimplifyInfoForHall?vpn-12-o2-one.hfut.edu.cn'

  return request(url, {
    headers: {
      authorization: token,
    },
    maxRedirects: 5,
  }, query.cookie)
}
