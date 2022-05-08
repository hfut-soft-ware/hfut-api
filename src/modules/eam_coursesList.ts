import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'

export default async function(query: IQuery) {
  const locationUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/course-table'

  let studentId = ''

  try {
    await request(locationUrl, {}, query.cookie)
  } catch (err) {
    studentId = (err as AxiosError).response!.headers.location.replace('/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/course-table/info/', '')
  }

  const courseUrl = `https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/course-table/get-data?vpn-12-o1-jxglstu.hfut.edu.cn&bizTypeId=23&semesterId=174&dataId=${studentId}`
  const courseIdsRes = await request(courseUrl, {}, query.cookie)
  const ids = courseIdsRes.body.lessonIds

  const getCredits = (id: string) => {
    let res = { credits: 0, examMode: '' }
    Object.keys(courseIdsRes.body.lessons).forEach((key) => {
      const lesson = courseIdsRes.body.lessons[key]
      if (lesson.id === id) {
        res.credits = lesson.course.credits

        res.examMode = lesson.examMode.nameZh
      }
    })

    return res
  }

  const allCoursesListUrl = 'https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/ws/schedule-table/datum?vpn-12-o1-jxglstu.hfut.edu.cn'
  const res = await request(allCoursesListUrl, {
    method: 'post',
    data: { lessonIds: ids, studentId, weekIndex: '' },
  }, query.cookie)

  const getLessonRoom = (id: string) => {
    let room = ''
    res.body.result.scheduleList.forEach((lesson: any) => {
      if (lesson.lessonId === id) {
        room = lesson.room.nameZh
      }
    })

    return room
  }

  const lessonList = res.body.result.lessonList.map((item: any) => ({
    id: item.id,
    code: item.code,
    adminClasses: item.name,
    name: item.coureName,
    type: item.courseTypeName,
    teachers: item.teacherAssignmentList.map((item: any) => item.name),
    studentCount: item.stdCount,
    room: getLessonRoom(item.id),
    ...getCredits(item.id),
  }))

  const lessons = Array.from({ length: 20 }, () => Array.from({ length: 7 }, () => []))

  res.body.result.scheduleList.forEach((item: any) => {
    const idx = item.weekIndex as number
    (lessons[idx - 1][item.weekday - 1] as any[]).push({
      startTime: item.startTime,
      endTime: item.endTime,
      id: item.lessonId,
    })
  })
  return {
    code: 200,
    msg: '获取课表成功',
    data: {
      lessonList,
      lessons,
    },
  }
}
