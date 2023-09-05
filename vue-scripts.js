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
    addVueDatePicker();
    $(document).one("trigger::vue__datepicker_loaded", function () {
        addVueMultiSelect();
    })
    // addVueVirtualScrollerFromCDN()
    $(document).one("trigger::vue__multi_select_loaded", function () {
        Vue.component('vue-multiselect', window.VueMultiselect.default)
        Vue.component('vue-datePicker', window.DatePicker)
        var app = new Vue({
            el: '#c-app',
            components: {
                Multiselect: window.VueMultiselect.default,
                datePicker: window.DatePicker
            },
            data: {
                user: null,
                isUserLoading: false,
                theCustomer: null,
                theCustomerId: null,
                isTheCustomerLoading: false,
                theCustomerPhoneNumber: '',
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
                theActiveLogFilterDropdown: null,
                activeLogFilters: {},
                isModal: false,
                theActiveLog: null,
                theActiveLogAction: null,
                isLoadingLogAddNote: false,
                isEtrayModal: false,
                isMessageModal: false,
                theMessageTemplates: [],
                selectedTemplate: '',
                activeMessageType: 'email',
                theMessageSubject: null,
                theMessageMessage: '',
                theMessageFormErrors: {},
                isSendingMessage: false,
                theMessageEmailAddress: '',
                theMessagePhoneNumber: '',
                activeFilterDateRange: [],
                isShowDateRangePanel: false,
                showRelatedLogs: {},
                validationButtonArr: [
                    { val: 'JE val', tooltip: 'Juridisk Ejer valideret' },
                    { val: '3 pkt. val', tooltip: '3 pkt. valideling' },
                    { val: 'Ingen val', tooltip: 'Kunden kunne/skulle ikke valideres' }
                ],
                seletedValidation: '',
                isRemeberValidationTypeAnimate: false,
                isRemeberValidationType: false,
                isToastVisible: false,
                toastMessage: '',
                isCreatedLogItemOnLoadedCustomer: false,
                itemsToShow: 10
            },
            computed: {
                displayedChainedLogs() {
                    return this.chainedLogs.slice(0, this.itemsToShow);
                },
                hasMoreLogs() {
                    return this.itemsToShow < this.chainedLogs.length;
                },
                theMessageTemplatesFiltered() {
                    return this.theMessageTemplates.filter(template => template.TYPE === this.activeMessageType)
                },
                filteredCategories() {
                    const cats = []
                    this.loggingOptions.forEach(item => {
                        const idx = cats.findIndex(cat => cat.CAT === item.CAT)
                        if (idx < 0) {
                            cats.push(item)
                        }
                    })
                    const sorted_cats = cats.sort(function(a,b){
                        if (a.SORT_NO) {
                            return a.SORT_NO - b.SORT_NO
                        }
                        else {
                            return a.CAT - b.CAT
                        }
                    })
                    return sorted_cats.map(CAT => CAT.CAT)
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
                    return // filteredResults.sort()
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

                    function jsonParseString(str) {
                        let arr = []
                        if (str) {
                            arr = JSON.parse(str)
                        }
                        return arr
                    }

                    return this.logs.map((log) => ({
                        ...log,
                        v_MsgShort: createAShortVersionOfTheText(this.cDecode(log.MSG)),
                        v_RefIds: turnStringToArr(log.REF_IDS),
                        v_Actions: turnStringToArr(log.ACTION),
                        v_notes: jsonParseString(log.LIST_OF_NOTES),
                        MSG: this.cDecode(log.MSG)
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
                logFilters() {
                    const self = this
                    function getActiveFilter(filterLabel) {
                        return self.activeLogFilters[filterLabel] ? self.activeLogFilters[filterLabel] : null
                    }
                    function getAllOptionsFromALabel(filterLabel) {
                        const optionCounts = {};
                        self.logsSorted.forEach(log => {
                            const option = log[filterLabel];
                            optionCounts[option] = (optionCounts[option] || 0) + 1;
                        });

                        const optionsList = Object.entries(optionCounts).sort().map(([option, count]) => {
                            return { value: option, title: `${option} (${count})` };
                        });

                        return [...optionsList];
                    }
                    const closedLogs = this.logsSorted.filter(item => item.STATUS === 'Closed')
                    const openLogs = this.logsSorted.filter(item => item.STATUS === 'Open')

                    function getDateFromNow(days) {
                        let currentDate = new Date();
                        let targetDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
                        let formattedDate = targetDate.toISOString().substr(0, 10);
                        return formattedDate
                    }

                    function getDateFromNowMonths(months) {
                        let currentDate = new Date();
                        let targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months, currentDate.getDate());
                        let formattedDate = targetDate.toISOString().substr(0, 10);
                        return formattedDate
                    }

                    function getDateFromNowYears(years) {
                        let currentDate = new Date();
                        let targetDate = new Date(currentDate.getFullYear() - years, currentDate.getMonth(), currentDate.getDate());
                        let formattedDate = targetDate.toISOString().substr(0, 10);
                        return formattedDate
                    }

                    const filterArr = [
                        {
                            label: 'PERIODE',
                            title: 'PERIODE',
                            activeLogFilter: getActiveFilter('PERIODE'),
                            isLogFiltersActive: this.theActiveLogFilterDropdown === 'PERIODE',
                            options: [
                                { value: getDateFromNow(7), title: 'Seneste 7 dage' },
                                { value: getDateFromNow(15), title: 'Seneste 15 dage' },
                                { value: getDateFromNow(30), title: 'Seneste 30 dage' },
                                { value: getDateFromNowMonths(3), title: 'Seneste 3 måneder' },
                                { value: getDateFromNowMonths(6), title: 'Seneste 6 måneder' },
                                { value: getDateFromNowYears(1), title: 'Seneste år' },
                                { value: 'customDate', title: 'Vælg et datointerval' }
                            ]
                        },
                        {
                            label: 'STATUS',
                            title: 'STATUS',
                            activeLogFilter: getActiveFilter('STATUS'),
                            isLogFiltersActive: this.theActiveLogFilterDropdown === 'STATUS',
                            options: [
                                { value: 'Open', title: 'Åbne  (' + openLogs.length + ')' },
                                { value: 'Closed', title: 'Lukkede (' + closedLogs.length + ')' }
                            ]
                        },
                        {
                            label: 'TYPE',
                            title: 'TYPE',
                            activeLogFilter: getActiveFilter('TYPE'),
                            isLogFiltersActive: this.theActiveLogFilterDropdown === 'TYPE',
                            options: getAllOptionsFromALabel('TYPE')
                        },
                        {
                            label: 'CAT',
                            title: 'FORMÅL',
                            activeLogFilter: getActiveFilter('CAT'),
                            isLogFiltersActive: this.theActiveLogFilterDropdown === 'CAT',
                            options: getAllOptionsFromALabel('CAT')
                        }
                    ]
                    filterArr.forEach(filter => {
                        let title = ''
                        const filterLabel = filter.label
                        const val = this.activeLogFilters[filterLabel]
                        if (val) {
                            const filterOption = filter['options'].find(option => option.value === val)
                            title = filterOption.title
                        }
                        filter['activeTitle'] = title
                    })
                    return filterArr
                },
                logsFiltered() {
                    function isDateInRange(dateToCheckStr, startDateStr, endDateStr) {
                        let dateToCheck = new Date(dateToCheckStr);
                        let startDate = new Date(startDateStr);
                        let endDateEndOfDay = new Date(endDateStr).setHours(23, 59, 59, 999);
                        let endDate = new Date(endDateEndOfDay)
                        return dateToCheck.getTime() >= startDate.getTime() && dateToCheck.getTime() <= endDate.getTime();
                    }
                    let logs = this.logsSorted;
                    if (this.activeLogFilters && Object.keys(this.activeLogFilters).length > 0) {
                        logs = logs.filter(item => {
                            return Object.entries(this.activeLogFilters).every(([key, value]) => {
                                if (key === 'PERIODE') {
                                    let createdDate = this.formatDate(item['CREATED_TIME'])
                                    if (value === 'customDate') {
                                        if (!this.activeFilterDateRange[0]) {
                                            return true
                                        }
                                        let startDate = new Date(this.activeFilterDateRange[0])
                                        let endDate = new Date(this.activeFilterDateRange[1])
                                        let startDateDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                                        let endDateDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                                        // Check if the item was created between the start and end dates
                                        return isDateInRange(createdDate, startDateDateOnly, endDateDateOnly)
                                    } else {
                                        let filterDate = new Date(value);
                                        let createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
                                        let filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
                                        // Check if the item was created before the after the date
                                        return createdDateOnly.getTime() >= filterDateOnly.getTime()
                                    }
                                } else {
                                    return !value || item[key] === value;
                                }
                            });
                        });
                    }
                    return logs.filter(item => {
                        return Object.values(item).some(value => String(value).toLowerCase().includes(this.searchQuery.toLowerCase()));
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
                        
                        const logID = log.id ? log.id : log.ID ? log.ID : null
                        console.log('logID',logID);
                        const idsArr = [(logID).toString()].concat(log.v_RefIds)
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
                    return this.chainedLogIds.map(chainArr => chainArr.filter(id => this.logsMap[id]).map(id => this.logsMap[id]).sort((a, b) => {
                        const dateA = this.formatDate(a.CREATED_TIME)
                        const dateB = this.formatDate(b.CREATED_TIME)
                        return dateB - dateA;
                    })
                    )
                },
                metaKey() {
                    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
                    return isMac ? '⌘' : 'CTRL'
                },
                isNewLogSubmitOpen() {
                    return this.selectedCat && this.selectedReason && this.selectedResult
                }
            },
            watch: {
                theCustomer(newVal, oldVal) {
                    window.scrollTo(0, 0);
                    if (newVal !== oldVal) {
                        if (newVal) {
                            this.updateScrollHandler()
                        } else {
                            window.removeEventListener("scroll", this.handleScroll);
                        }
                    }
                }
            },
            methods: {
                updateScrollHandler() {
                    this.updateLogs();
                    window.removeEventListener("scroll", this.handleScroll);
                    window.addEventListener("scroll", this.handleScroll);
                },
                handleScroll() {
                    const windowHeight = document.documentElement.clientHeight;
                    const scrollTop = document.documentElement.scrollTop;
                    const docHeight = document.documentElement.scrollHeight;
                    if (scrollTop + windowHeight >= docHeight) {
                        this.showMoreItems();
                    }
                },
                showMoreItems() {
                    const increment = 5; // Number of items to add
                    this.itemsToShow += increment;
                },
                updateLogs() {
                    this.itemsToShow = 10;
                },
                sendToast(message) {
                    this.isToastVisible = true;
                    this.toastMessage = message;

                    setTimeout(() => {
                        this.isToastVisible = false;
                    }, 3500);
                },
                setShowRelatedLogs(logId) {
                    if (this.showRelatedLogs[logId]) {
                        this.$delete(this.showRelatedLogs, logId)
                    } else {
                        this.$set(this.showRelatedLogs, logId, true)
                    }
                },
                onFilterLabelClick(filterType) {
                    if (this.activeLogFilters[filterType.label]) {
                        this.$delete(this.activeLogFilters, filterType.label)
                        this.theActiveLogFilterDropdown = null
                    } else {
                        this.setTheActiveLogFilterDropdown(filterType.label)
                    }
                },
                openWebVictor() {
                    const guid = this.theCustomer && this.theCustomer['GUID'] ? this.theCustomer['GUID'] : null
                    if (!guid) {
                        window.alert('Ingen kunde fundet i WebVictor')
                        return
                    }
                    const url = 'http://cbb.apps.mvno.dk/customers/' + guid
                    window.open(url, '_blank')
                },
                openActiveOffers() {
                    const url = 'https://www.cbb.dk/EPiServer/CBB/OrderSearch?Query=' + this.theCustomerId
                    window.open(url, '_blank')
                },
                openClosedOffers() {
                    const url = 'https://www.cbb.dk/EPiServer/CBB/OrderSearch?Query=' + this.theCustomerId + '&SearchType=1'
                    window.open(url, '_blank')
                },
                onNewLogTextareaKeyUp(event) {
                    // Check if the 'cmd' or 'ctrl' key and the 'enter' key are pressed together
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        this.submitNewLog()
                    }
                },
                formatMessage(msg) {
                    return msg
                        .replace(/\\n/g, '<br>')
                        .replace(/\\r\\r\\r/g, '<br>')
                        .replace(/\\r/g, '<br>');
                },
                setActiveMessageType(messageType) {
                    this.activeMessageType = messageType
                    this.theMessageFormErrors = {}
                },
                clearFormError(fieldName) {
                    // clear the error message for the given field name
                    this.$set(this.theMessageFormErrors, fieldName, null);
                },
                sendMessage() {
                    // reset form errors
                    this.theMessageFormErrors = {};

                    // perform form validation based on activeMessageType
                    if (this.activeMessageType === 'email') {
                        if (!this.theMessageSubject || !this.theMessageSubject.trim()) {
                            this.$set(this.theMessageFormErrors, 'subject', 'Emnefelt skal udfyldes');
                        }
                        if (!this.theMessageMessage || !this.theMessageMessage.trim()) {
                            this.$set(this.theMessageFormErrors, 'message', 'Besked skal udfyldes');
                        }
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.theMessageEmailAddress)) {
                            this.$set(this.theMessageFormErrors, 'email', 'Ugyldig emailadresse');
                        }
                    } else if (this.activeMessageType === 'sms') {
                        if (!this.theMessageMessage || !this.theMessageMessage.trim()) {
                            this.$set(this.theMessageFormErrors, 'message', 'Besked skal udfyldes');
                        }
                        if (!this.theMessagePhoneNumber || this.theMessagePhoneNumber.trim().length !== 8) {
                            this.$set(this.theMessageFormErrors, 'phone', 'Telefonnummer skal være 8 cifre');
                        }
                    }

                    // check if there are any form errors
                    if (Object.keys(this.theMessageFormErrors).length > 0) {
                        return;
                    }
                    this.isSendingMessage = true
                    const theMessage = [{
                        CUSTOMER_ID: this.theCustomerId,
                        TYPE: this.activeMessageType.toUpperCase(),
                        SUBJECT: this.activeMessageType === 'sms' ? null : this.theMessageSubject,
                        MSG: this.theMessageMessage,
                        RECIEVER: this.activeMessageType === 'sms' ? this.theMessagePhoneNumber : this.theMessageEmailAddress
                    }]
                    $('.input_set_log_data > input').val(JSON.stringify(theMessage))
                    this.observeChanges('.output_log_created', (jsonSucces) => {
                        this.pushToLogs(jsonSucces)
                        this.closeModal()
                    });
                    $('.send_msg > a').click();
                },
                setStandardTemplate(templateName) {
                    this.theMessageSubject = null
                    this.theMessageMessage = ''
                    this.theMessageFormErrors = {};
                    const template = this.theMessageTemplatesFiltered.find(temp => temp.DISPLAY_NAME === templateName);
                    if (template) {
                        this.theMessageSubject = template.SUBJECT
                        this.theMessageMessage = template.BODY_TEXT
                            .replace(/%ETRAY:CUSTOMER_NAME%/g, this.theCustomer.CUSTOMER_FIRST_NAME ? this.theCustomer.CUSTOMER_FIRST_NAME : '')
                            .replace(/%ETRAY:WF_USER_NAME%/g, this.user.USER_DISPLAY_NAME);
                    }
                },
                openIsMessageModal() {
                    this.isMessageModal = true
                    this.isModal = true
                    this.theMessagePhoneNumber = this.theCustomerId ? this.theCustomerId : ''
                    this.theMessageEmailAddress = this.theCustomer.CUSTOMER_EMAIL ? this.theCustomer.CUSTOMER_EMAIL : ''
                },
                closeIsMessageModal() {
                    this.isMessageModal = false
                    this.theMessageSubject = null
                    this.theMessageMessage = ''
                    this.selectedTemplate = ''
                    this.isSendingMessage = false
                    this.theMessageFormErrors = {}
                },
                cDecode(encodedString) {
                    let temporaryElement = document.createElement("div");
                    temporaryElement.innerHTML = encodedString;
                    let decodedString = temporaryElement.textContent;
                    return decodedString
                },
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
                onSelectedChange(val) {
                    if (val === 'category') {
                        this.openNewLogForm()
                        this.selectedReason = null
                        this.$nextTick(_ => {
                            this.$refs.new_log_reason.activate()
                        })
                    }
                    if (val === 'reason') {
                        this.selectedResult = null
                        this.$nextTick(_ => {
                            this.$refs.new_log_result.activate();
                        })
                    }
                    if (val === 'result') {
                        this.$nextTick(_ => {
                            this.$refs.new_log_message.focus()
                        })
                    }
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
                    this.closeIsMessageModal()
                    this.isModal = false
                    this.theActiveLogAction = null
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
                    $('html, body').animate({ scrollTop: 0 }, 'slow');
                    this.relatedLog = log.ID
                    this.isNewLogFormActive = true
                    const oldCat = log['CAT']
                    if (oldCat && this.filteredCategories.indexOf(oldCat) > -1) {
                        this.selectedCat = oldCat
                        this.onSelectedChange('category')
                    } else {
                        this.selectedCat = null
                        this.$nextTick(_ => {
                            this.$refs.new_log_category.activate()
                        })
                    }
                },
                openNewLogForm() {
                    this.isNewLogFormActive = true
                },
                closeNewLogForm() {
                    this.isNewLogFormActive = false
                    this.resetNewLogForm()
                },
                setSeletedValidation(val) {
                    this.seletedValidation = val
                    this.isRemeberValidationType = false
                },
                submitNewLog() {
                    if (this.seletedValidation.length < 1) {
                        this.isRemeberValidationTypeAnimate = true
                        this.isRemeberValidationType = true
                        setTimeout(_ => {
                            this.isRemeberValidationTypeAnimate = false
                        }, 1500)
                        return
                    }
                    if (this.selectedMessage.length < 1) {
                        $('.logMsg').addClass('logMsgMissing')
                        return
                    }                    
                    
                    let newLog = [{
                        CUSTOMER_ID: this.theCustomerId,
                        REF_IDS: this.relatedLog,
                        CAT: this.selectedCat,
                        REASON: this.selectedReason,
                        RESULT: this.selectedResult,
                        MSG: this.seletedValidation +': '+this.selectedMessage,
                        VALIDATION_TYPE: this.seletedValidation,
                        GUID: this.theCustomer['GUID'],
                        EMAIL: this.theCustomer.CUSTOMER_EMAIL
                    }]
                    $('.input_set_log_data > input').val(JSON.stringify(newLog))
                    this.isCreatedLogItemOnLoadedCustomer = true
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
                    this.seletedValidation = ''
                    this.isRemeberValidationTypeAnimate = false
                    this.isRemeberValidationType = false
                    $('.logMsg').removeClass('logMsgMissing')
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
                        // Hasn't yet created a log on newly loaded customer
                        this.isCreatedLogItemOnLoadedCustomer = false
                    });
                    $('.get_customer_data > a').click();

                    // Read customer log
                    this.isLogLoading = true
                    this.observeChanges('.output_log_data', (success) => {
                        this.logs = success
                        this.logs.forEach(log => {
                            this.$set(log, 'v_isReadMore', false);
                            this.$set(log, 'v_isReadMoreNotes', false);
                        })
                        this.isLogLoading = false
                        this.updateScrollHandler()
                    });
                    $('.get_log_data > a').click();

                    // Read customer new logging options
                    this.observeChanges('.output_log_options_data', (success) => {
                        this.loggingOptions = success && success['list'] ? success['list'] : []
                        this.resultOptions = success && success['result_options'] ? success['result_options'] : []
                    });
                    $('.get_log_options_data > a').click()
                },
                readCustomerLog() {
                    $('.input_customer_id > input').val(this.theCustomerId)
                    this.isLogLoading = true
                    this.observeChanges('.output_log_data', (success) => {
                        this.logs = success
                        this.logs.forEach(log => {
                            this.$set(log, 'v_isReadMore', false);
                            this.$set(log, 'v_isReadMoreNotes', false);
                        })
                        this.isLogLoading = false
                    });
                    $('.get_log_data > a').click();
                },
                readUser() {
                    this.isUserLoading = true
                    this.observeChanges('.output_login_data', (success) => {
                        this.user = success[0]
                        this.isUserLoading = false
                        this.$nextTick(_ => {
                            if ($('.input_customer_id > input').val().length > 0) {
                                this.theCustomerPhoneNumber = $('.input_customer_id > input').val();
                                this.readCustomer();
                            }
                            else {
                                this.$refs.customer_number_input.focus()
                            }
                        })
                    });
                    this.observeChanges('.output_templates', (success) => {
                        this.theMessageTemplates = success
                    });
                    $('.get_login_data > a').click();
                },
                observeChanges(selector, callback) {
                    const el = $(selector + '> div')
                    if (!el || el.length === 0) {
                        console.warn(`No element found with selector ${selector > div}`);
                        return;
                    }
                    el.html('loading')
                    let cInterval = setInterval(_ => {
                        const jsonString = el.html()
                        if (jsonString !== 'loading') {
                            clearInterval(cInterval)
                            const sanitizedJsonString = removeControlCharacters(jsonString);
                            const decoded = this.cDecode(sanitizedJsonString);
                            const json = decoded.length > 1 ? JSON.parse(decoded) : []
                            callback(json);
                        } else {
                            console.log('observer::empty', { selector })
                        }
                    }, 1000)
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
                setShowMoreNotes(activity) {
                    const idx = this.logs.findIndex(item => item.ID === activity.ID)
                    this.logs[idx].v_isReadMoreNotes = !this.logs[idx].v_isReadMoreNotes
                },
                setTheActiveLogFilterDropdown(label) {
                    setTimeout(_ => {
                        if (label === 'PERIODE' && this.isShowDateRangePanel) {
                            return
                        }
                        if (this.theActiveLogFilterDropdown === label) {
                            this.theActiveLogFilterDropdown = null
                        } else {
                            this.theActiveLogFilterDropdown = label
                        }
                    }, 0)
                },
                setActiveLogFilter(filterType, activefilter) {
                    this.$set(this.activeLogFilters, filterType.label, activefilter.value)
                    if (activefilter.value === 'customDate') {
                        this.$nextTick(_ => {
                            this.isShowDateRangePanel = true
                        })
                    }
                    this.theActiveLogFilterDropdown = null
                },
                closeVueDropdown() {
                    if (this.theActiveLogFilterDropdown) {
                        this.theActiveLogFilterDropdown = null
                    }
                },
                openCreateCaseFor2ndLine() {
                    this.isEtrayModal = true
                    $('.js-c-modal').removeClass('c-modal--hidden')
                    this.$nextTick(_ => {
                        $('#webform .Web_MainControl:not(.hidden_field):first > select').focus().select()
                    })
                },
                closeEtrayModal() {
                    this.isEtrayModal = false
                    $('.js-c-modal').addClass('c-modal--hidden')
                    this.$nextTick(_ => {
                        clear_etray_fields();
                    })
                }
            },
            mounted() {
                $('.c-init-loader').removeClass('c-init-loader--show');
                // Virtual scroller
                // Vue.component('vue-virtual-scroller', window["vue-virtual-scroller"].DynamicScroller);
                // Vue.component('DynamicScrollerItem', window["vue-virtual-scroller"].DynamicScrollerItem);
                $(document).on('trigger::etray_modal_close', () => {
                    this.closeEtrayModal()
                })
                $(document).on('vue::new_case_created', () => {
                    if (!this.isCreatedLogItemOnLoadedCustomer) {
                        this.sendToast('HUSK at oprette en ny logning også')
                    }
                    this.readCustomerLog()
                })
                addEtrayCreateFormEventListeners()
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

$( ".logMsg" ).on( "focus", function() {
   $('.logMsg').removeClass('logMsgMissing')
} );    
    


function CreateCase() {
    if (submit_validation_logic()) {
        clearJSONfields();
        $(".webformCreateMore").click();
        clear_etray_fields();
        closeCreateCase();
        setTimeout(function () {
            $(document).trigger("vue::new_case_created");
        }, 1000);
    }
}

function clearJSONfields() {
    $(".output_customer_data > div").html("")
    $(".output_log_data > div").html("")
    $(".output_login_data > div").html("")
    $(".output_log_options_data > div").html("")
}

function clear_etray_fields() {
    $(".Web_MainControl").each(function (index) {
        const $this = $(this);
        if (!$this.hasClass('js-dont_clear_on_submit')) {
            $this.find('select').prop("selectedIndex", 0).trigger("change");
            $this.find('textarea').val('');
            $this.find('input').val('');
            $this.find(':radio').prop('checked', false);
            $this.find(':checkbox').prop('checked', false).trigger("change");
            $this.removeClass('js-checkbox--checked');
            $this.removeClass('js-checkbox--focus');
            $this.find('.js-input--error').removeClass('js-input--error')
        }
    });
}

function submit_validation_logic() {
    clearJSONfields();
    var errors = 0;
    $(".Web_MainControl").each(function () {
        var $this = $(this);
        if ($this.css("display") !== "none") {
            if ($this.find(".Web_Required + a").length) {
                var $input = $this.find(".Web_Required + a").next("div").next(".UploadPanel");
                if ($input.html().length < 1) {
                    errors++;
                    $this.addClass("js-input--error");
                } else {
                    $this.removeClass("js-input--error");
                }
            }
            if ($this.find('.Web_Required + input[type="checkbox"]').length) {
                var $input = $this.find('.Web_Required + input[type="checkbox"]');
                if ($input.is(":checked")) {
                    $this.removeClass("js-input--error");
                } else {
                    errors++;
                    $this.addClass("js-input--error");
                }
            }
            if ($this.find(".Web_Required + .Web_InnerControl > div > input").length) {
                var $input = $this.find(".Web_Required + .Web_InnerControl > div > input");
                if ($input.is(":checked")) {
                    $this.removeClass("js-input--error");
                } else {
                    errors++;
                    $this.addClass("js-input--error");
                }
            }
            if ($this.find(".Web_Required + input").length) {
                var $input = $this.find(".Web_Required + input");
                if ($input.val()) {
                    $input.removeClass("js-input--error");
                } else {
                    errors++;
                    $input.addClass("js-input--error");
                }
            }
            if ($this.find(".Web_Required + textarea").length) {
                var $input = $this.find(".Web_Required + textarea");
                if ($input.val()) {
                    $input.removeClass("js-input--error");
                } else {
                    errors++;
                    $input.addClass("js-input--error");
                }
            }
            if ($this.find(".Web_Required + select").length) {
                var $input = $this.find(".Web_Required + select");
                if ($input.val()) {
                    $input.removeClass("js-input--error");
                } else {
                    errors++;
                    $input.addClass("js-input--error");
                }
            }
        }
    });
    if (errors > 0) {
        console.log(errors);
        $('.js-input--error').on('keyup change', function () {
            $(this).removeClass('js-input--error');
        });
        return false;
    } else {
        return true;
    }
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
        const $checkbox = $(this).next('input[type="checkbox"]');
        $checkbox.prop('checked', !$checkbox.prop('checked'));
        if ($checkbox.prop('checked')) {
            $checkbox.parent().addClass('js-checkbox--checked');
        } else {
            $checkbox.parent().removeClass('js-checkbox--checked');
        }
    });
    $(".Web_MainControl:not(.js-dont_clear_on_submit)").each(function (index) {
        const $this = $(this);
        const $checkbox = $this.find('input[type="checkbox"]');
        if ($checkbox.length) {
            $checkbox.focus(function () {
                $this.addClass('js-checkbox--focus');
            }).blur(function () {
                $this.removeClass('js-checkbox--focus');
            }).change(function () {
                if ($checkbox.prop('checked')) {
                    $checkbox.parent().addClass('js-checkbox--checked');
                } else {
                    $checkbox.parent().removeClass('js-checkbox--checked');
                }
            });
        }
    });
}

function addVueMultiSelect() {
    // Create a <link> element for the CSS file
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/vue-multiselect@latest/dist/vue-multiselect.min.css'
    document.head.appendChild(link)

    // Create a <script> element for the Vue Multiselect script
    $.getScript("https://cdn.jsdelivr.net/npm/vue-multiselect@latest/dist/vue-multiselect.min.js", function (e, t, s) {
        $(document).trigger("trigger::vue__multi_select_loaded")
    })
}

function addVueDatePicker() {
    // Create a <link> element for the CSS file
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/vue2-datepicker/index.css'
    document.head.appendChild(link)

    // Create a <script> element for the Vue Multiselect script
    $.getScript("https://unpkg.com/vue2-datepicker@3.11.1/index.min.js", function (e, t, s) {
        $(document).trigger("trigger::vue__datepicker_init")
    })

    $(document).one('trigger::vue__datepicker_init', function () {
        // Create a <script> element for the Vue Multiselect script
        $.getScript("https://unpkg.com/vue2-datepicker@3.11.1/locale/da.js", function (e, t, s) {
            $(document).trigger("trigger::vue__datepicker_loaded")
        })
    })
}

function initVue() {
    hideBlockUI()
    $("#webform").appendTo(".js-form-create-case")
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
