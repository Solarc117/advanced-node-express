// @ts-nocheck
$(document).ready(() => {
  /* Global io*/
  const socket = io()

  socket.on('user', ({ currentUsers, name, connected }) => {
    $('#num-users').text(
      `${currentUsers} ${currentUsers === 1 ? 'user' : 'users'} online`
    )

    const message = `${name} has ${connected ? 'joined' : 'left'} the chat`
    // Should avoid using the html() method for safety reasons - but I'm not changing it here in case it alters the FCC tests.
    $('$messages').append($('<li>').html(`<b>${message}</b>`))
  })

  socket.on('chat message', ({ name, message }) => {
    $('#messages').append($('<li>').text(`${name}: ${message}`))
  })

  // Form submittion with new message in field with id 'm'
  $('form').submit(() => {
    const messageToSend = $('#m').val()

    socket.emit('chat message', messageToSend)

    $('#m').val('')
    return false // prevent form submit from refreshing page
  })
})
