import { IQuery } from '../server'
import request from '../shared/request'

type queryType = string | undefined

const url = 'https://webvpn.hfut.edu.cn/http-8080/77726476706e69737468656265737421a2a611d2736526022a5ac7f9/opac/ajax_search_adv.php?vpn-12-o1-210.45.242.5%3A8080='

export default async function(query: IQuery) {
  const keyword = query.req.query.keyword as queryType
  const size = query.req.query.size as queryType
  const count = query.req.query.count as queryType
  const data = {
    searchWords: [
      {
        fieldList: [
          {
            fieldCode: '',
            fieldValue: keyword || '',
          },
        ],
      },
    ],
    filters: [],
    limiter: [],
    sortField: 'relevance',
    sortType: 'desc',
    pageSize: size ? +size : 20,
    pageCount: count ? +count : 1,
    locale: 'zh_CN',
    first: true,
  }
  const res = await request(url, {
    data,
    method: 'POST',
  }, query)
  return {
    code: 200,
    msg: '获取图书检索信息成功',
    data: res.body.content,
  }
}
