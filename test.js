const axios = require('axios')
const tunnel = require('tunnel')

async function start() {
  const res = await axios.get('http://api.tianqiip.com/getip?secret=vpn2vn9y5q67w430&num=1&yys=%E7%94%B5%E4%BF%A1&type=json&port=1&time=3')

  const agent = tunnel.httpsOverHttp({
    proxy: {
      host: res.data.data[0].ip,
      port: res.data.data[0].port,
    },
  })

  axios({
    httpAgent: agent,
    httpsAgent: agent,
    proxy: false,
    url: 'https://myip.ipip.net/',
    method: 'get',
  }).then((res) => {
    console.log(res.data)
    console.log(agent)
  }).catch((err) => {
    console.log(err.response)
  })
}

start()
