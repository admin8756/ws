import { Server } from 'ws'

let wss = null
// 创建一个 WebSocket 服务器，监听指定的端口
// 判断12591端口是否处于打开状态
if (wss) {
  wss.close()
} else {
  // wss = new Server({ port: 12591 })
}

let WebS = null

// 收到消息回调
const receiveMessage = (message) => {
  WebS.send(`你刚刚说：${message}`)
}

// 链接成功回调
const linkSuccessful = (ws) => {
  WebS = ws
  ws.on('message', receiveMessage)
  ws.send('ws链接成功')
  // 开始定时器
  // setInterval(() => {
  //   ws.send('定时器发送消息')
  // }, 1000)
}
// 监听连接
// wss.on('connection', linkSuccessful)

