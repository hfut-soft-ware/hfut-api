import { IQuery } from '../server'
import request from '../shared/request'

const campus = [{
  id: 2,
  code: '01',
  nameZh: '屯溪路校区',
  nameEn: '01',
  mngtDepartmentId: 1,
  remark: null,
  enabled: 1,
},
{
  id: 3,
  code: '02',
  nameZh: '翡翠湖校区',
  nameEn: '02',
  mngtDepartmentId: 1,
  remark: null,
  enabled: 1,
},
{
  id: 6,
  code: '03',
  nameZh: '宣城校区',
  nameEn: '03',
  mngtDepartmentId: 1,
  remark: null,
  enabled: 1,
}]

const url = 'https://webvpn.hfut.edu.cn/https/77726476706e69737468656265737421fff944d22f367d44300d8db9d6562d/api/operation/emptyClass/getEmptyRoom?vpn-12-o2-one.hfut.edu.cn'

const token = 'AT-91257-bwiQ1u98jS-qzR1AElZpnrAMSztNx035'

export default async function(query: IQuery) {
  let res = {}

  res = await request(url, {
    headers: { authorization: `Bearer ${token}` },
    params: {
      campus_code: '03',
      building_code: 'XC001',
      room_type_code: '013',
      seats: 50,
      start_unit: 1,
      end_unit: 10,
      start_date: '2022-06-27',
      end_date: '2022-06-27',
    },
  }, query)

  return res
}
