import { AxiosError } from 'axios'
import cheerio from 'cheerio'
import request from '../shared/request'
import { IQuery } from '../server'

const base_url = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479'

const url = `${base_url}/eams5-student/for-std/student-info`

export default async function(query: IQuery) {
  const parseStudentInfo = (body: string) => {
    const $ = cheerio.load(body)

    const studentId = $('#base-info ul.list-group li:nth-child(3) span:nth-child(2)').text().trim()
    const usernameZh = $('#base-info ul.list-group li:nth-child(4) span:nth-child(2)').text().trim()
    const usernameEn = $('#base-info ul.list-group li:nth-child(5) span:nth-child(2)').text().trim()
    const sex = $('#base-info ul.list-group li:nth-child(6) span:nth-child(2)').text().trim()

    const info = $('#base-info .info-page dl')
      .children('dd')
      .map((index, el) => {
        return cheerio.load(el).text()
      })

    const graduateDate = () => {
      const node = $('#graduate-info dl')
      const keys = node.children('dt').map((index, el) => {
        return cheerio.load(el).text()
      }).toArray()

      const values = node.children('dd') // 存在匹配不到，位置不是固定的
        .map((index, el) => {
          return cheerio.load(el).text()
        }).toArray()

      // 预计毕业日期 位置可能不是固定的
      const result = values.filter((values, index) => {
        return keys[index].includes('预计毕业日期')
      })

      return result.length ? result[0] : '2000-00-00'
    }

    return {
      studentId,
      usernameEn,
      usernameZh,
      sex,
      cultivateType: info[0],
      department: info[1],
      grade: info[2],
      level: info[3],
      studentType: info[4],
      major: info[6],
      class: info[8],
      campus: info[9],
      status: info[10],
      length: info[18],
      enrollmentDate: info[19],
      graduateDate: graduateDate(),
    }
  }

  let code = ''
  try {
    await request(url, {}, query.cookie)
  } catch (err) {
    const uri = (err as AxiosError).response!.headers.location.split('/')
    code = uri[uri.length - 1]
  }

  const url1 = `${base_url}/eams5-student/for-std/student-info/info/${code}`
  const res = await request(url1, {}, query.cookie)
  const info = parseStudentInfo(res.body as string)
  return {
    code: 200,
    msg: '获取学生信息成功',
    data: {
      studentCode: code,
      ...info,
    },
  }
}
