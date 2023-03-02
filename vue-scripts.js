$(document).one('trigger::vue_loaded', function () {
    console.log('vue::loaded')

    // Register a global custom directive called `v-focus`
    Vue.directive('click-outside', {
        bind: function (el, binding, vnode) {
            el.clickOutsideEvent = function (event) {
                // here I check that click was outside the el and his children
                if (!(el == event.target || el.contains(event.target))) {
                    // and if it did, call method provided in attribute value
                    vnode.context[binding.expression](event);
                }
            };
            document.body.addEventListener('click', el.clickOutsideEvent)
        },
        unbind: function (el) {
            document.body.removeEventListener('click', el.clickOutsideEvent)
        },
    });

    var app = new Vue({
        el: '#c-app',
        data: {
            user: 'Henrik',
            theCustomer: null
        },
        methods: {
            readCustomer(customerId) {
                this.theCustomer = null
                $('.E_GET_CUSTOMER_INPUT > input').val(customerId)
                $('.E_GET_CUSTOMER_GET > a').click();
                this.observeChanges('.E_GET_CUSTOMER_ANSWER');
            },
            observeChanges(cls) {
                const el = $(cls + '> div')
                el.html('')
                let cInterval = setInterval(_ => {
                    const str = el.html()
                    if (str.length > 3) {
                        clearInterval(cInterval)
                        console.log('SERVER::ANSWER!', JSON.parse(str))
                        this.theCustomer = JSON.parse(str)
                    } else {
                        console.log('ANSER::EMPTY')
                    }
                }, 1500)
            }
        },
        mounted() {
            this.readCustomer(12)
        }
    })
})