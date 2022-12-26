import { IQuery } from '../server'
import request from '../shared/request'
import { getUniqueId } from '../shared/utils/index'

interface ReqQuery {
  courseName: string
  semesterCode: string
  page?: string
  size?: string
}

const baseUrl = 'http://jxglstu.hfut.edu.cn'

export default async function(query: IQuery<ReqQuery>) {
  const { courseName, semesterCode, page, size } = query.req.query
  const { success, uniqueId } = await getUniqueId(query)
  if (!success) {
    return {
      code: 403,
      msg: 'on cookie or expired',
      data: {},
    }
  }
  const { body } = await request(`${baseUrl}/eams5-student/for-std/lesson-search/semester/${semesterCode}/search/${uniqueId}`, {
    params: {
      courseNameZhLike: courseName,
      queryPage__: `${page || 1},${size || 20}`,
      _: Date.now(),
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
