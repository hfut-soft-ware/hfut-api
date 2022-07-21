import * as cheerio from 'cheerio'
import { IQuery } from '../../server'
import request from '../../shared/request'

interface BookItem {
  bookIndex: string
  barcodeNumber: string
  pubYear: string
  collectionPlace: string
  bookState: string
}

const url = 'https://webvpn.hfut.edu.cn/http-8080/77726476706e69737468656265737421a2a611d2736526022a5ac7f9/opac/ajax_item.php'

function parseBookState(html: string) {
  const data: BookItem[] = []
  const $ = cheerio.load(html)
  const trList = $('.whitetext')
  if (!trList.length) {
    return {
      success: false,
      data,
    }
  }
  trList.each((_, el) => {
    const textArr = $(el).text().split('\n')
    data.push({
      bookIndex: textArr[1].trim(),
      barcodeNumber: textArr[2].trim(),
      pubYear: textArr[3].trim(),
      collectionPlace: textArr[4].trim(),
      bookState: textArr[5].trim(),
    })
  })
  return {
    success: true,
    data,
  }
}

export default async function(query: IQuery) {
  const marc_no = query.req.query.marc_no
  if (!marc_no) {
    return {
      code: 400,
      msg: '缺少参数',
    }
  }
  const res = await request(url, {
    params: {
      'vpn-12-o1-210.45.242.5:8080': '',
      marc_no,
    },
  }, query)
  const { success, data } = parseBookState(res.body)
  if (success) {
    return {
      code: 200,
      msg: '获取藏书信息成功',
      data,
    }
  } else {
    return {
      code: 400,
      msg: '参数错误或未查询到信息',
    }
  }
}
