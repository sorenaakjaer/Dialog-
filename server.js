$('.E_GET_CUSTOMER_GET > a').on('click', function () {
    console.log('clicked')
    setCustomer()
})


function setCustomer() {
    console.log('server::setCustomer')
    setTimeout(_ => {
        $('.E_GET_CUSTOMER_ANSWER > div').html(`
      [{"onid": "1631183",
      "category": "Announcement",
      "headline": "Tester H",
      "type": "Andet",
      "active_date": "08-07-2021 00:00",
      "expire_date": "",
      "message": "Tester HH",
      "message_short": "Tester HH...",
      "active_date": "08-07-2021 00:00",
      "expire_date": "",
      "from_company": "IO Dev Company",
      "created_by": "io.dev",
      "last_updated_date": "08-07-2021 21:25",
      "click": "Yes",
      "show_unread_icon": "Yes",
      "show_edit_btns": "Yes"}]`
        )
    }, 500)
}