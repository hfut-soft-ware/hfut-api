import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  const locationUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/course-table'

  let studentId = ''

  console.log(query.cookie)
  try {
    await request(locationUrl, {}, query.cookie)
  } catch (err) {
    studentId = (err as AxiosError).response!.headers.location.replace('/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/course-table/info/', '')
  }
  console.log(studentId)

  const courseUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/course-table/get-data?vpn-12-o1-jxglstu.hfut.edu.cn&bizTypeId=23&semesterId=174&dataId=${studentId}`
  const courseIdsRes = await request(courseUrl, {}, query.cookie)
  const ids = courseIdsRes.body.lessonIds

  const allCoursesListUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/schedule-table/datum?vpn-12-o1-jxglstu.hfut.edu.cn'
  return request(allCoursesListUrl, {
    method: 'post',
    data: { lessonIds: ids, studentId, weekIndex: '' },
  }, query.cookie)
}
