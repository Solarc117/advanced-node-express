// @ts-nocheck
$(document).ready(function () {
  /* Global io*/
  const socket = io()

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    const messageToSend = $('#m').val()
    $('#m').val('')
    return false // prevent form submit from refreshing page
  })
})
