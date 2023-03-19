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
                isNewLogFormActive: false,
                searchQuery: '',
                debounce: null,
                isSearchActive: false,
                isLogFiltersActive: false,
                activeLogFilter: { value: null, title: 'Alle' },
                logFilters: [
                    { value: null, title: 'Alle' },
                    { value: 'Open', title: 'Åbne' },
                    { value: 'Closed', title: 'Lukkede' }
                ],
                isModal: false,
                theActiveLog: null,
                theActiveLogAction: null,
                isLoadingLogAddNote: false,
                isEtrayModal: false
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
                    function turnStringToArr(str) {
                        let arr = [];

                        if (str) {
                            if (!isNaN(str)) {
                                str = (str).toString()
                            }
                            arr = str.split(';');
                        }
                        return arr
                    }
                    return this.logs.map((log) => ({
                        ...log,
                        v_MsgShort: createAShortVersionOfTheText(decodeURI(log.MSG)),
                        v_RefIds: turnStringToArr(log.REF_IDS),
                        v_Actions: turnStringToArr(log.ACTION),
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
                logsFiltered() {
                    let logs = this.logsSorted
                    if (this.activeLogFilter.value) {
                        logs = this.logsSorted.filter(item => item.STATUS === this.activeLogFilter.value)
                    }
                    return logs.filter(item => {
                        return Object.values(item).some(value =>
                            String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
                        );
                    });
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
                    this.logsFiltered.forEach(log => {
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
                    return this.chainedLogIds.map(chainArr => chainArr.map(id => this.logsMap[id]).sort((a, b) => {
                        const dateA = this.formatDate(a.CREATED_TIME)
                        const dateB = this.formatDate(b.CREATED_TIME)
                        return dateB - dateA;
                    })
                    )
                }
            },
            methods: {
                clearSearchQuery() {
                    this.$refs.v_search_query && (this.$refs.v_search_query.value = ""), this.searchQuery = ""
                },
                debounceSearch(e) {
                    this.searchQuery = ''
                    clearTimeout(this.debounce)
                    this.debounce = setTimeout(() => {
                        this.searchQuery = e.target.value
                    }, 600)
                },
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
                setActionOnItem(action, activity) {
                    if (action === 'related') {
                        this.setRelatedCase(activity)
                        return
                    }
                    this.theActiveLog = activity
                    this.theActiveLogAction = action
                    if (action === 'note' || action === 'close' || action === 'reopen') {
                        this.setIsModal()
                        this.$nextTick(_ => {
                            this.$refs.ref_add_message_textarea.focus()
                        })
                        return
                    }
                },
                setIsModal() {
                    this.isModal = true
                },
                closeModal() {
                    this.isModal = false
                    this.theActiveLog = null
                    this.isEtrayModal = false
                },
                saveLogItemAction(newNote) {
                    if (this.theActiveLogAction === 'note' && newNote.length < 1) {
                        setTimeout(_ => {
                            this.$refs.ref_add_message_textarea.focus()
                        }, 0)
                        return
                    }
                    this.isLoadingLogAddNote = true
                    const saveItem = {
                        CUSTOMER_ID: this.theCustomerId,
                        CASE_ID: this.theActiveLog.ID,
                        ACTION: this.theActiveLogAction,
                        MSG: newNote
                    }
                    console.log({ saveItem })
                    $('.input_set_log_data > input').val(JSON.stringify(saveItem))
                    this.observeChanges('.output_log_created', (jsonSucces) => {
                        this.pushToLogs(jsonSucces)
                        this.closeModal()
                        this.isLoadingLogAddNote = false
                    });
                    $('.set_action > a').click();
                },
                pushToLogs(jsonSucces) {
                    jsonSucces.forEach(logItem => {
                        // if it exitst replace it with the new
                        const idx = this.logs.findIndex(item => item.ID === logItem.ID)
                        this.$set(logItem, 'v_isReadMore', false);
                        if (idx > -1) {
                            this.$set(this.logs, idx, logItem)
                        } else {
                            this.logs.push(logItem)
                        }
                    })
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
                    this.observeChanges('.output_log_created', (jsonSucces) => {
                        this.pushToLogs(jsonSucces)
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
                        const jsonString = el.html()
                        if (jsonString.length > 3) {
                            console.log('observe', { selector, jsonString })
                            clearInterval(cInterval)
                            const sanitizedJsonString = removeControlCharacters(jsonString);
                            const json = JSON.parse(sanitizedJsonString);
                            callback(json);
                        } else {
                            console.log('observer::empty', { selector })
                        }
                    }, 1500)
                    function removeControlCharacters(str) {
                        // Match any character that is not a printable ASCII character or a tab, newline, or carriage return
                        const regex = /[\x00-\x1F\x7F]/g;
                        // Replace any matches with an empty string
                        return str.replace(regex, '');
                    }
                },
                setReadMoreForItem(activity) {
                    const idx = this.logs.findIndex(item => item.ID === activity.ID)
                    this.logs[idx].v_isReadMore = !this.logs[idx].v_isReadMore
                },
                setActiveLogFilter(filter) {
                    this.activeLogFilter = filter
                    this.isLogFiltersActive = false
                },
                closeVueDropdown() {
                    if (this.isLogFiltersActive) {
                        this.isLogFiltersActive = false
                    }
                },
                openCreateCaseFor2ndLine() {
                    this.isEtrayModal = true
                    this.$nextTick(_ => {
                        $('#webform .Web_MainControl:not(.hidden_field):first > select').focus().select()
                    })
                },
                closeEtrayModal() {
                    this.isEtrayModal = false
                    this.$nextTick(_ => {
                        clear_etray_fields();
                    })
                }
            },
            mounted() {
                // this.readCustomer()
                // Virtual scroller
                Vue.component('vue-virtual-scroller', window["vue-virtual-scroller"].DynamicScroller);
                Vue.component('DynamicScrollerItem', window["vue-virtual-scroller"].DynamicScrollerItem);
                $("#webform").appendTo(".js-form-create-case")
                addEtrayCreateFormEventListeners()
                $(document).on('trigger::etray_modal_close', () => {
                    this.closeEtrayModal()
                })
                $('.c-init-loader').removeClass('c-init-loader--show');
                this.readUser()
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


function CreateCase() {

    if (submit_validation_logic() == true) {
        clearJSONfields()
        $(".webformCreateMore").click()
        clear_etray_fields()
        closeCreateCase()
        setTimeout(function () {
            $(document).trigger("vue::new_case_created")
        }, 1e3)
    }
}

function clearJSONfields() {
    $(".output_customer_data > div").html("")
    $(".output_log_data > div").html("")
    $(".output_login_data > div").html("")
    $(".output_log_options_data > div").html("")
}


function clear_etray_fields() {
    console.log('clear_etray_fields()')

    $(".Web_MainControl").each(function () {
        if (!$(this).hasClass('js-dont_clear_on_submit')) {
            $(".Web_MainControl_note > textarea").val("")
            $(".Web_MainControl_textbox > input").val("")
            $(".Web_MainControl > div > div > :radio").prop("checked", !1)
            $(".Web_MainControl > select").prop("selectedIndex", 0)
            $(".Web_MainControl > select").trigger("change");
            setTimeout(function () {
                $(".Web_MainControl_upload > .UploadPanel > div > a").click()
            }, 3e3)
        }
    })

}


function submit_validation_logic() {
    clearJSONfields();
    var e = 0;
    return $(".Web_MainControl").each(function () {
        if ("none" !== $(this).css("display")) {
            if ($(this).find(".Web_Required + a").length) {
                var t = $(this).find(".Web_Required + a");
                t.next("div").next(".UploadPanel").html().length < 1 ? (e++, $(this).addClass("js-input--error")) : $(this).removeClass("js-input--error")
            }
            if ($(this).find('.Web_Required + input[type="checkbox"]').length) {
                var t = $(this).find('.Web_Required + input[type="checkbox"]');
                $(t).is(":checked") ? $(this).removeClass("js-input--error") : (e++, $(this).addClass("js-input--error"))
            }
            if ($(this).find(".Web_Required + .Web_InnerControl > div > input").length) {
                var t = $(this).find(".Web_Required + .Web_InnerControl > div > input");
                $(t).is(":checked") ? $(this).removeClass("js-input--error") : (e++, $(this).addClass("js-input--error"))
            }
            if ($(this).find(".Web_Required + input").length) {
                var t = $(this).find(".Web_Required + input");
                $(t).val() ? $(t).val() && $(t).removeClass("js-input--error") : (e++, $(t).addClass("js-input--error"))
            }
            if ($(this).find(".Web_Required + textarea").length) {
                var t = $(this).find(".Web_Required + textarea");
                $(t).val() ? $(t).val() && $(t).removeClass("js-input--error") : (e++, $(t).addClass("js-input--error"))
            }
            if ($(this).find(".Web_Required + select").length) {
                var t = $(this).find(".Web_Required + select");
                $(t).val() ? $(t).val() && $(t).removeClass("js-input--error") : (e++, $(t).addClass("js-input--error"))
            }
        }
    }), !(e > 0) || (console.log(e), !1)
}

function closeCreateCase() {
    $(document).trigger('trigger::etray_modal_close')
}

function addEtrayCreateFormEventListeners() {
    $('.Web_InnerControl_RADIOBUTTONS > div > input[type="radio"] + div').click(function () {
        $(this).prev('input[type="radio"]').click()
    })
    $('.Web_MainControl_checkbox > input[type="checkbox"] + .CheckboxLabel').click(function () {
        $(this).prev('input[type="checkbox"]').click()
    })
    $('.Web_MainControl_checkbox > .Web_TextDesc').click(function () {
        $(this).next('input[type="checkbox"]').click()
    })
}

function initVue() {
    hideBlockUI()
    $(document).trigger("TRIGGER_SLOW_LOAD")
    console.log('trigger::TRIGGER_SLOW_LOAD')
}

var initTimer = setTimeout(_ => {
    initVue()
}, 4000)

// OBSERVE IF ETRAY FORM IS LOADED
var observer = new MutationObserver(function (mutations) {
    if ($(".output_login_data").length) {
        observer.disconnect();
        clearTimeout(initTimer);
        setTimeout(_ => {
            initVue()
        }, 1500)
        //We can disconnect observer once the element exist if we dont want observe more changes in the DOM
    }
});


// Start observing
observer.observe(document.body, { //document.body is node target to observe
    childList: true, //This is a must have for the observer with subtree
    subtree: true //Set to true if changes must also be observed in descendants.
});
