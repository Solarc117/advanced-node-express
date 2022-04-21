// @ts-nocheck
function log() {
  console.log(...arguments)
}

$(document).ready(() => {
  /* Global io*/
  const socket = io()
  socket.on('user count', data => log(data))

  // Form submittion with new message in field with id 'm'
  $('form').submit(() => {
    const messageToSend = $('#m').val()
    $('#m').val('')
    return false // prevent form submit from refreshing page
  })
})
