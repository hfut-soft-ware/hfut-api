import axios, { AxiosError } from 'axios'
const start = Date.now()
axios.get('http://localhost:8082/card/todayFlowWater', {
  // params: {
  //   // isCardCookie: 'false',
  //   startDate: '20220915',
  //   endDate: '20221015',
  //   pageNum: 1,
  // },
  headers: {
    cookie: 'JSESSIONID=64AE4231043F06A7547F78BA614E6A44',
  },
}).then(({ data }) => {
  const end = Date.now()
  console.log(end - start)
  console.log(data.data.list)
}).catch((error: AxiosError) => {
  const end = Date.now()
  console.log(end - start)
  console.log(error.message)
})
