$(document).one('trigger::vue_init', function () {
    console.log('trigger::vue_init')

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
        var app = new Vue({
            el: '#c-app',
            data: {
                user: null,
                isUserLoading: false,
                theCustomer: null,
                theCustomerId: null,
                isTheCustomerLoading: false,
                theCustomerPhoneNumber: '20163673',
                theCustomerPhoneNumberHasError: false,
                logs: [],
                isLogLoading: false,
                loggingOptions: [],
                resultOptions: [],
                selectedCat: null,
                selectedReason: null,
                selectedResult: null,
                selectedMessage: '',
                isSubmittingNewLog: false,
                relatedLog: null,
                isNewLogFormActive: false
            },
            computed: {
                filteredCategories() {
                    const cats = []
                    this.loggingOptions.forEach(item => {
                        const idx = cats.findIndex(cat => cat === item.CAT)
                        if (idx < 0) {
                            cats.push(item.CAT)
                        }
                    })
                    return cats.sort()
                },
                filteredReasons() {
                    if (!this.selectedCat) {
                        return []
                    }
                    const filteredOptions = this.loggingOptions.filter(option => option.CAT === this.selectedCat)
                    return filteredOptions.map(option => option.REASON).sort()
                },
                filteredResults() {
                    if (!this.selectedCat || !this.selectedReason) {
                        return []
                    }
                    const filteredOptions = this.loggingOptions.filter(option => option.CAT === this.selectedCat && option.REASON === this.selectedReason)
                    const itemObj = filteredOptions[0]
                    const results = this.resultOptions[0]
                    const filteredResults = []
                    for (const key in results) {
                        if (itemObj[key] === 'true') {
                            const val = results[key]
                            filteredResults.push(val)
                        }
                    }
                    return filteredResults.sort()
                },
                logsDecoded() {
                    function createAShortVersionOfTheText(txt) {
                        let shortText = txt;
                        const shortTextLength = 150
                        if (txt.length > shortTextLength) {
                            shortText = txt.substring(0, shortTextLength) + "...";
                        }
                        return shortText
                    }
                    function turnStringToArr(REF_IDS) {
                        let refIdsArray = [];

                        if (REF_IDS) {
                            refIdsArray = REF_IDS.split(';');
                        }
                        return refIdsArray
                    }
                    return this.logs.map((log) => ({
                        ...log,
                        v_MsgShort: createAShortVersionOfTheText(decodeURI(log.MSG)),
                        v_RefIds: turnStringToArr(log.REF_IDS),
                        MSG: decodeURI(log.MSG)
                    }))
                },
                logsSorted() {
                    return this.logsDecoded.sort((a, b) => {
                        const dateA = this.formatDate(a.CREATED_TIME)
                        const dateB = this.formatDate(b.CREATED_TIME)
                        return dateB - dateA;
                    })
                },
                logsMap() {
                    return this.logsSorted.reduce((map, log) => {
                        map[log.ID] = log;
                        return map;
                    }, {});
                },
                chainedLogIds() {
                    const logs = []
                    // logs = [[12645926, 12642987], 12613728], [12642299], [12645901, 12645900]]
                    function findIndexOfValue(value, arrayOfArrays) {
                        for (let i = 0; i < arrayOfArrays.length; i++) {
                            const innerArray = arrayOfArrays[i];
                            if (innerArray.includes(value)) {
                                return i;
                            }
                        }
                        return -1;
                    }
                    this.logsSorted.forEach(log => {
                        const idsArr = [(log.ID).toString()].concat(log.v_RefIds)
                        if (logs.length === 0) {
                            logs.push(idsArr)
                        } else {
                            let chainIdx = -1
                            idsArr.forEach(id => {
                                if (findIndexOfValue(id, logs) > -1) {
                                    chainIdx = findIndexOfValue(id, logs)
                                }
                            })
                            if (chainIdx < 0) {
                                logs.push(idsArr)
                            } else {
                                idsArr.forEach(id => {
                                    const idx = logs[chainIdx].indexOf(id)
                                    if (idx < 0) {
                                        logs[chainIdx].push(id)
                                    }
                                })
                            }
                        }
                    })
                    return logs
                },
                chainedLogs() {
                    return this.chainedLogIds.map(chainArr => chainArr.map(id => this.logsMap[id]))
                }
            },
            methods: {
                formatDate(str) {
                    if (!str) {
                        return new Date()
                    }
                    const [date, time] = str.split(' ');
                    const [day, month, year] = date.split('-');
                    const [hours, minutes] = time.split(':');
                    const formattedDate = new Date(`${month}/${day}/${year} ${hours}:${minutes}`);
                    return formattedDate;
                },
                onSelectedCatChange() {
                    this.openNewLogForm()
                    this.selectedReason = null
                },
                setRelatedCase(log) {
                    this.relatedLog = log.ID
                    this.isNewLogFormActive = true
                },
                openNewLogForm() {
                    this.isNewLogFormActive = true
                },
                closeNewLogForm() {
                    this.isNewLogFormActive = false
                    this.resetNewLogForm()
                },
                submitNewLog() {
                    let newLog = [{
                        CUSTOMER_ID: this.theCustomerId,
                        REF_IDS: this.relatedLog,
                        CAT: this.selectedCat,
                        REASON: this.selectedReason,
                        RESULT: this.selectedResult,
                        MSG: encodeURI(this.selectedMessage)
                    }]
                    $('.input_set_log_data > input').val(JSON.stringify(newLog))
                    this.isSubmittingNewLog = true
                    this.observeChanges('.output_log_created', (success) => {
                        console.log({ success })
                        if (success && success.length > 0) {
                            let log = success[0]
                            this.$set(log, 'v_isReadMore', false);
                            this.logs.push(log)
                        }
                        this.closeNewLogForm()
                    })
                    $('.set_log_data > a').click()
                },
                resetNewLogForm() {
                    this.selectedCat = null
                    this.selectedReason = null
                    this.selectedResult = null
                    this.selectedMessage = ''
                    this.isSubmittingNewLog = false
                    this.relatedLog = null
                },
                readCustomer() {
                    if (this.theCustomerPhoneNumber.length !== 8) {
                        this.theCustomerPhoneNumberHasError = true
                        this.$refs.customer_number_input.focus()
                        return
                    }
                    this.isTheCustomerLoading = true
                    $('.input_customer_id > input').val(this.theCustomerPhoneNumber)
                    // Read customer name etc.
                    this.observeChanges('.output_customer_data', (success) => {
                        this.theCustomer = success[0]
                        this.isTheCustomerLoading = false
                        this.$set(this.theCustomer, 'vPhone', this.theCustomerPhoneNumber)
                        this.theCustomerId = this.theCustomerPhoneNumber
                        this.theCustomerPhoneNumber = ''
                    });
                    $('.get_customer_data > a').click();

                    // Read customer log
                    this.observeChanges('.output_log_data', (success) => {
                        this.logs = success
                        this.logs.forEach(log => {
                            this.$set(log, 'v_isReadMore', false);
                        })
                    });
                    $('.get_log_data > a').click();

                    // Read customer new logging options
                    this.observeChanges('.output_log_options_data', (success) => {
                        this.loggingOptions = success && success['list'] ? success['list'] : []
                        this.resultOptions = success && success['result_options'] ? success['result_options'] : []
                    });
                    $('.get_log_options_data > a').click()
                },
                readUser() {
                    this.isUserLoading = true
                    this.observeChanges('.output_login_data', (success) => {
                        this.user = success[0]
                        this.isUserLoading = false
                        this.$nextTick(_ => {
                            this.$refs.customer_number_input.focus()
                        })
                    });
                    $('.get_login_data > a').click();
                },
                observeChanges(selector, callback) {
                    const el = $(selector + '> div')
                    if (!el || el.length === 0) {
                        console.warn(`No element found with selector ${selector > div}`);
                        return;
                    }
                    el.html('')
                    let cInterval = setInterval(_ => {
                        const str = el.html()
                        if (str.length > 3) {
                            console.log('observe', { selector, str })
                            clearInterval(cInterval)
                            callback(JSON.parse(decodeURI(str)));
                        } else {
                            console.log('ANSER::EMPTY')
                        }
                    }, 1500)
                },
                setReadMoreForItem(activity) {
                    const idx = this.logs.findIndex(item => item.ID === activity.ID)
                    this.logs[idx].v_isReadMore = !this.logs[idx].v_isReadMore
                }
            },
            mounted() {
                this.readUser()
                // this.readCustomer()
                // Virtual scroller
                Vue.component('vue-virtual-scroller', window["vue-virtual-scroller"].DynamicScroller);
                Vue.component('DynamicScrollerItem', window["vue-virtual-scroller"].DynamicScrollerItem);
            },
            updated() {
                console.log('updating dom')
                $('.c-logs__chain.c-logs-chain--chained').each(function () {
                    var parent = $(this);
                    var lastChild = parent.find('.c-logs__log:last-child');
                    var lastChildHeight = lastChild.outerHeight(true);
                    console.log(lastChild, lastChildHeight)
                    var parentHeight = (parent.height() - lastChildHeight + 17.5);
                    parent.find('.c-logs-chain--chained__line').height(parentHeight);
                });
            }
        })
    })
})

// import VUE
$(document).one("TRIGGER_SLOW_LOAD", function () {
    $.getScript(
        "https://cdn.jsdelivr.net/npm/vue@2"
        //"https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"
        , function (data, textStatus, jqxhr) {
            $(document).trigger('trigger::vue_init');
        })
})
function addVueVirtualScrollerFromCDN() {
    // Create a <link> element for the CSS file
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/vue-virtual-scroller/dist/vue-virtual-scroller.css'
    document.head.appendChild(link)

    // Create a <script> element for the Vue Multiselect script
    $.getScript("https://cdn.jsdelivr.net/npm/vue-virtual-scroller@1.1.2/dist/vue-virtual-scroller.umd.min.js", function (e, t, s) {
        $(document).trigger("trigger::vue__virtual_scroller_loaded")
    })
}

setTimeout(_ => {
    $(document).trigger("TRIGGER_SLOW_LOAD")
    console.log('trigger::TRIGGER_SLOW_LOAD')
    $('.c-init-loader').removeClass('c-init-loader--show')
    hideBlockUI()
}, 0)

function hideBlockUI() {
    if (!$.blockUI) {
        return
    }
    $.blockUI.defaults = {
        message: '',
        fadeIn: 0,
        fadeOut: 0,
        timeout: 0,
        showOverlay: false,
        centerY: false,
        css: {
            width: '1px',
            top: '0',
            left: '',
            right: '0',
            border: 'none',
            padding: '0',
            opacity: .0,
            color: '#fff'
        }
    }
}