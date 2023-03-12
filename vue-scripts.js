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

    addVueVirtualScrollerFromCDN()
    $(document).one("trigger::vue__virtual_scroller_loaded", function () {
        setTimeout(_ => {
            console.log(window.VueVirtualScroller)
        }, 2000)
        var app = new Vue({
            el: '#c-app',
            data: {
                user: null,
                isUserLoading: false,
                theCustomer: null,
                isTheCustomerLoading: false,
                theCustomerPhoneNumber: '20163673',
                theCustomerPhoneNumberHasError: false,
                logs: [],
                isLogLoading: false
            },
            computed: {
                logsSorted() {
                    const itemsWithRefs = this.logs.filter(item => item.REF_IDS);
                    const itemsWithoutRefs = this.logs.filter(item => !item.REF_IDS);

                    // Sort itemsWithRefs based on the newest CREATED_TIME in the reference chain
                    itemsWithRefs.sort((a, b) => {
                        // Find the newest item in the reference chain for each item
                        const aRefs = this.findReferenceChain(a);
                        const bRefs = this.findReferenceChain(b);
                        const aNewest = aRefs.reduce((newest, ref) => {
                            const refItem = this.logs.find(item => item.ID === ref);
                            if (new Date(refItem.CREATED_TIME) > new Date(newest.CREATED_TIME)) {
                                return refItem;
                            } else {
                                return newest;
                            }
                        }, a);
                        const bNewest = bRefs.reduce((newest, ref) => {
                            const refItem = this.logs.find(item => item.ID === ref);
                            if (new Date(refItem.CREATED_TIME) > new Date(newest.CREATED_TIME)) {
                                return refItem;
                            } else {
                                return newest;
                            }
                        }, b);

                        // Sort the items based on the newest CREATED_TIME in the reference chain
                        return new Date(aNewest.CREATED_TIME);
                    });

                    itemsWithoutRefs.sort((a, b) => {
                        return new Date(b.CREATED_TIME) - new Date(a.CREATED_TIME);
                    });

                    // Merge the two sorted arrays into one sorted array
                    const sortedItems = [];
                    let i = 0;
                    let j = 0;

                    while (i < itemsWithRefs.length && j < itemsWithoutRefs.length) {
                        if (new Date(itemsWithRefs[i].CREATED_TIME) < new Date(itemsWithoutRefs[j].CREATED_TIME)) {
                            sortedItems.push(itemsWithRefs[i]);
                            i++;
                        } else {
                            sortedItems.push(itemsWithoutRefs[j]);
                            j++;
                        }
                    }

                    // Add any remaining items to the end of the sorted array
                    if (i < itemsWithRefs.length) {
                        sortedItems.push(...itemsWithRefs.slice(i));
                    }

                    if (j < itemsWithoutRefs.length) {
                        sortedItems.push(...itemsWithoutRefs.slice(j));
                    }

                    return sortedItems;
                }
            },
            methods: {
                findReferenceChain(item) {
                    const chain = [item.ID];
                    let refIds = item.REF_IDS.split(';').map(id => parseInt(id));
                    while (refIds.length > 0) {
                        const refItem = this.logs.find(item => item.ID === refIds[0]);
                        chain.push(refItem.ID);
                        refIds = refItem.REF_IDS ? refItem.REF_IDS.split(';').map(id => parseInt(id)) : [];
                    }
                    return chain;
                },
                readCustomer() {
                    if (this.theCustomerPhoneNumber.length !== 8) {
                        this.theCustomerPhoneNumberHasError = true
                        this.$refs.customer_number_input.focus()
                        return
                    }
                    this.isTheCustomerLoading = true
                    $('.input_customer_id > input').val(this.theCustomerPhoneNumber)
                    // User data
                    this.observeChanges('.output_customer_data', (success) => {
                        this.theCustomer = success[0]
                        this.isTheCustomerLoading = false
                        this.$set(this.theCustomer, 'vPhone', this.theCustomerPhoneNumber)
                        this.theCustomerPhoneNumber = ''
                    });
                    $('.get_customer_data > a').click();
                    // User log
                    this.observeChanges('.output_log_data', (success) => {
                        this.logs = success
                    });
                    $('.get_log_data > a').click();
                },
                readUser() {
                    this.isUserLoading = true
                    this.observeChanges('.output_login_data', (success) => {
                        this.user = success[0]
                        this.isUserLoading = false
                    });
                    $('.get_login_data > a').click();
                },
                observeChanges(selector, callback) {
                    const el = $(selector + '> div')
                    if (!el) {
                        console.warn(`No element found with selector ${selector > div}`);
                        return;
                    }
                    el.html('')
                    let cInterval = setInterval(_ => {
                        const str = el.html()
                        if (str.length > 3) {
                            clearInterval(cInterval)
                            callback(JSON.parse(decodeURI(str)));
                        } else {
                            console.log('ANSER::EMPTY')
                        }
                    }, 1500)
                }
            },
            mounted() {
                this.readUser()
                // this.readCustomer()
                // Virtual scroller
                console.log(window["vue-virtual-scroller"])
                Vue.component('vue-virtual-scroller', window["vue-virtual-scroller"].DynamicScroller);
                Vue.component('DynamicScrollerItem', window["vue-virtual-scroller"].DynamicScrollerItem);
            }
        })
    })
})

// import VUE
$.getScript(
    "https://cdn.jsdelivr.net/npm/vue@2"
    //"https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"
    , function (data, textStatus, jqxhr) {
        //console.log('VUW imported')
        $(document).trigger('trigger::vue_loaded');
    })

function addVueVirtualScrollerFromCDN() {
    // Create a <link> element for the CSS file
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/vue-virtual-scroller/dist/vue-virtual-scroller.css'
    document.head.appendChild(link)

    // Create a <script> element for the Vue Multiselect script
    $.getScript("https://cdn.jsdelivr.net/npm/vue-virtual-scroller@1.1.2/dist/vue-virtual-scroller.umd.min.js", function (e, t, s) {
        console.log('succes', e, t, s)
        $(document).trigger("trigger::vue__virtual_scroller_loaded")
    })
}