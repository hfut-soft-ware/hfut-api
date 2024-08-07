import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'
import { parsePreStudentPage } from '../shared/utils/parsePreStudentPage'

export default async function(query: IQuery) {
  const locationUrl = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/course-table'

  let studentId = ''
  try {
    const page = await request(locationUrl, {}, query)
    studentId = parsePreStudentPage(page.body as string)
  } catch (err) {
    if (!(err as AxiosError).response?.headers) {
      console.log(err)
    }
    studentId = (err as AxiosError).response!.headers.location.split('/')[5]
  }
  /**
   *
   * 关于bizTypeId合肥校区是2, 宣城校区是23
   *
   */

  const idsParams = {
    bizTypeId: query.req.query.bizTypeId || 2,
    // 每个学期记得更换一次，下次找个方法自动解决
    semesterId: query.req.query.semesterId || 254,
    dataId: studentId,
  }

  let courseUrl = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/course-table/get-data'
  let courseIdsRes = await request(courseUrl, {
    params: idsParams,
  }, query)
  if (courseIdsRes.body?.lessonIds?.length === 0) {
    idsParams.bizTypeId = 23
    courseIdsRes = await request(courseUrl, {
      params: idsParams,
    }, query)
  }
  const ids = courseIdsRes.body.lessonIds

  const getCredits = (id: string) => {
    let res = { credits: 0, examMode: '' }
    Object.keys(courseIdsRes.body.lessons).forEach((key) => {
      const lesson = courseIdsRes.body.lessons[key]

      if (lesson.id === id) {
        res.credits = lesson.course.credits

        try {
          res.examMode = lesson.examMode.nameZh
        } catch (error) {
          console.log(`[AUTO] lesson.examMode.nameZh === null ${error}`)
        } finally {
          res.examMode = '其它'
        }
      }
    })

    return res
  }

  const getSchedule = (data: any[]) =>
    Array(...new Set(data.map((item: any) => ({
      startTime: item.startTime,
      endTime: item.endTime,
      id: item.lessonId,
      room: item.room?.nameZh,
      weekday: item.weekday,
      weekIndex: item.weekIndex,
    }))))

  const allCoursesListUrl = 'http://jxglstu.hfut.edu.cn/eams5-student/ws/schedule-table/datum '

  let res = {} as any

  let lessonList = {} as any

  try {
    res = await request(allCoursesListUrl, {
      method: 'post',
      data: { lessonIds: ids, studentId, weekIndex: '' },
    }, query)

    lessonList = res.body.result.lessonList.map((item: any) => {
      return {
        id: item.id,
        code: item.code,
        adminClasses: item.name,
        name: item.courseName.trim().replace(' ', ''),
        type: item.courseTypeName,
        teachers: item.teacherAssignmentList.map((item: any) => item.name),
        studentCount: item.stdCount,
        weeks: `${item.suggestScheduleWeekInfo ? `${item.suggestScheduleWeekInfo}周` : ''}`,
        ...getCredits(item.id),
        schedule: getSchedule(res.body.result.scheduleList.filter((list: any) => list.lessonId === item.id)),
      }
    })
  } catch {

  }

  return {
    code: 200,
    msg: '获取课表成功',
    data: lessonList,
  }
}
