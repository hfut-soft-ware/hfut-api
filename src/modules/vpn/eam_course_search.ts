import { IQuery } from '../../server'
import request from '../../shared/request'
import { CourseSearchReq } from '../eam_course_search'
import { getVpnUniqueId } from '../../shared/utils/index'

const baseUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479'

export default async function(query: IQuery<CourseSearchReq>) {
  const { courseName, semesterCode, page, size } = query.req.query
  const { success, uniqueId } = await getVpnUniqueId(query)
  if (!success) {
    return {
      code: 403,
      msg: 'on cookie or cookie expired',
      data: {},
    }
  }
  const { body } = await request(`${baseUrl}/eams5-student/for-std/lesson-search/semester/${semesterCode}/search/${uniqueId}`, {
    params: {
      'vpn-12-o1-jxglstu.hfut.edu.cn': '',
      'courseNameZhLike': courseName,
      'queryPage__': `${page || 1},${size || 20}`,
      '_': Date.now(),
    },
  }, query)
  return {
    code: 200,
    msg: 'ok',
    data: {
      list: handleCourseSearchData(body.data),
      page: body._page_,
    },
  }
}

function handleCourseSearchData(datas: any[]) {
  return datas.map(item => ({
    courseName: item.courseTextbookStat.nameZh,
    courseCode: item.courseTextbookStat.code,
    courseType: item.courseTextbookStat.courseType.nameZh,
    credits: item.courseTextbookStat.credits,
    className: item.lesson.nameZh,
    classCode: item.lesson.code,
    openDepart: item.courseTextbookStat.defaultOpenDepart.nameZh,
    examMod: item.courseTextbookStat.defaultExamMode.nameZh,
    campus: item.lesson.campus.nameZh,
    teachers: item.lesson.teacherAssignmentList.map((teacher: { person: { nameZh: any } }) => teacher.person.nameZh),
    schedule: item.lesson.scheduleText.dateTimePlacePersonText.textZh ? item.lesson.scheduleText.dateTimePlacePersonText.textZh.split('\n') : [],
  }))
}
