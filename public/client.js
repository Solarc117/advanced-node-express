// @ts-nocheck
$(document).ready(() => {
  /* Global io*/
  const socket = io()
  socket.on('user', ({ currentUsers, name, connected }) => {
    $('#num-users').text(
      `${currentUsers} user${currentUsers === 1 ? '' : 's'} online`
    )

    const msg = `${name} has ${connected ? 'joined' : 'left'} the chat`
    $('$messages').append($('<li>').html(`<b>${msg}</b>`))
  })

  // Form submittion with new message in field with id 'm'
  $('form').submit(() => {
    const messageToSend = $('#m').val()
    $('#m').val('')
    return false // prevent form submit from refreshing page
  })
})
