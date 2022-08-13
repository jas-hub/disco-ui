
function disable(e) {
  e.preventDefault()
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function respToObj(resp) {
  let respObj = {}
  for (const field of resp) {
    respObj = {
      ...respObj,
      [field.name]: parseInt(field.value) || field.value
    }
  }
  return respObj
}
let fbInterval = null
function feedback(msg, level=0) {

  const levels = {
    1: 'info',
    2: 'warn',
    3: 'alert'
  }

  const feedbackEl = $('#feedback')
  // appear
  feedbackEl.addClass(`${levels[level]} msg-box`)
  // if we have a msg and it's not a clearing msg
  if (msg && msg !== 'clear') {
    feedbackEl.text(msg)
    return
  }

  if (msg === 'clear') {
    feedbackEl.removeAttr('class')
    feedbackEl.text('')
    clearInterval(fbInterval)
    return
  }
  let numDots = 0
  let dotArray = []
  if (fbInterval) {
    clearInterval(fbInterval)
  }
  fbInterval = setInterval(() => {
    dotArray = []
    if (numDots === 5) {
      numDots = 0
      feedbackEl.text('')

    }
    for (let i=0; i<=numDots; i++) {
      dotArray.push('.')
    }
    feedbackEl.text(dotArray.join(' '))
    numDots++
  }, 100)
}



let timeout = null
function fakeRequest(payload) {
  feedback()
  if (timeout) {
    clearTimeout(timeout)
  }
  timeout = setTimeout(() => {
    console.log('clearing')
    feedback('clear')
  }, 3000)
}

function updateUi(data = {}) {
  for (const inpName in data) {
    const value = data[inpName]
    const input = $(`input[name="${inpName}"]`)
    input.attr('value', value)
    // update buttons
    const bttns = $(input).next().find('button') || []
    bttns.each(function(indx) {
      const bVal = $(this).attr('value')
      const bttnVal = parseInt(bVal) || bVal
      if (bttnVal === value) {
        $(this).addClass('active')
      } else {
        $(this).removeAttr('class')
      }
    })
  }
}

function begin() {
  $('form').on('submit', (e) => {
    disable(e)
    const formData = respToObj($(e.target).serializeArray())
    const payload = {
      topic: e.target.id,
      message: JSON.stringify(formData)
    }
    console.log('Publish on WS')
    feedback()
    websocket.send(payload)
  })

  $('button').on('click', (e) => {
    // no-op if no ws
    if (!websocket.connected) {
      disable(e)
      feedback('Websocket disconnected...')
      setTimeout(() => feedback('clear'), 500)
      return
    }
    const value = e.target.value
    const myInput = $(e.target).parent().parent().find('input:text')
    myInput.attr('value', e.target.value)
    // Handle styling here..
    // make sure siblings are off, and I am on
    // if we have a websocket connection that is..

    $(e.target).siblings().removeClass('active')
    $(e.target).addClass('active')

    console.log(value)
  })
}

/** Globals */
var gateway = `ws://${window.location.hostname || '127.0.0.1'}/ws`;
gateway2 = 'wss://demo.piesocket.com/v3/channel_1?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self'
let websocket = null;

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------

//window.addEventListener('load', onLoad);

function onLoad(event) {
    initWebSocket();
}

// ----------------------------------------------------------------------------
// WebSocket handling
// ----------------------------------------------------------------------------
let webSocketTimeout = null;
let webSocketConnected = false;
let fails = 0, packets = 0

const ws = {
  websocket: null,
  connected: false,
  init: function(url) {
    const websocket = new WebSocket(url)
    websocket.onclose = this.close
    websocket.onerror = this.error
    websocket.onclose = this.close
    websocket.onmessage = this.message
    this.websocket = websocket
    return this
  },
  open: function(e) {
    console.log("-> websocket connected...")
    feedback('Websocket connected!')
    setTimeout(() => { feedback('clear') }, 500)
    fails = 0
    this.connected = true
  },
  close: function(e) {
    console.log('-> websocket closed...')
    initWebSocket()
  },
  message: function(e) {
    const msg = JSON.parse(e.data)
    updateUi(msg)

  },
  send: function(msg) {
    this.websocket.send(msg)
  },
  error: function(e) {
    console.log('-> websocket failed...')
    feedback(`Websocket Failed... trying again`)
    fails++
  }
}

function initWebSocket(e) {
  console.log('Initializing websocket service')
  console.log(`--> Attempt: ${fails}`)
  feedback(`Connecting to websocket, attempt: ${fails+1}`)
  if (webSocketTimeout) {
    clearTimeout(webSocketTimeout)
  }
  if (fails === 0) {
    websocket = ws.init(gateway)
  }
  webSocketTimeout = setTimeout(() => {
    console.log(`-> Connecting to websocket @ ${gateway}`)
    if (fails+1 > 4) {
      console.error(`ERROR: to many attempts to connect, refresh browser to retry`)
      console.log(websocket)
      feedback('Too many attempts..')
      setTimeout(() => {feedback('clear')}, 700)
    } else {
      websocket = ws.init(gateway)
    }
  }, 5000)
}

function test() {
  const payload = {
    speed: 3,
    direction: 'RND',
    movement: 'on'
  }
  setTimeout(() => {
    updateUi(payload)
  }, 1000)
}

$(window).on('load', initWebSocket)
$(document).ready(begin)